import type { ValidationIssue, Result } from './validation';
import type { ProxyRecord } from '../types/proxy';
import {
  buildTelegramProxyLink,
  isValidTimestamp,
  proxyKey,
  validateCountry,
  validatePort,
  validateSecret,
  validateServer,
} from './validation';
import type { FeaturedProxyRecord, FeaturedStatus, TopProxyDataset } from '../types/top-proxy';

/**
 * Pure parsing, deduplication, ranking and dataset validation for the automated
 * featured-proxy collector. This module is shared by the Node collector and the
 * browser, so it must not depend on Node-only APIs.
 */

export interface FeedParseContext {
  sourceId: string;
  priority?: number;
}

export interface ParsedCandidate {
  server: string;
  port: number;
  secret: string;
  sourceId: string;
  priority: number;
  country: string | null;
}

export interface FeedParseResult {
  candidates: ParsedCandidate[];
  rejected: number;
  rejectedReasons: Record<string, number>;
  duplicates: number;
}

export interface MergedCandidate {
  server: string;
  port: number;
  secret: string;
  key: string;
  sources: string[];
  sourceCount: number;
  priority: number;
  country: string | null;
}

export interface RankableVerification {
  server: string;
  port: number;
  secret: string;
  sources: string[];
  country: string | null;
  successes: number;
  failures: number;
  unknowns: number;
  medianLatencyMs: number | null;
  verifiedAt: string | null;
  lastFailedAt: string | null;
  runnerRegion: string;
}

export interface RankOptions {
  featuredCount: number;
  minimumSuccessRate: number;
  minimumSuccessfulChecks: number;
  maximumLatencyMs: number;
  maximumDataAgeMinutes: number;
  runnerRegion: string;
  now?: number;
}

export interface TopDatasetParse {
  dataset: TopProxyDataset;
  issues: ValidationIssue[];
  skipped: number;
}

const URL_PATTERN = /(?:https?:\/\/(?:t|telegram)\.me\/proxy|tg:\/\/proxy)\?[^\s<>"'`]+/gi;
const HOST_FORMAT = /^([^\s,:]+)[\s,:]+(\d{1,5})[\s,:]+([A-Za-z0-9+/_=-]+)$/;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;
const FEATURED_STATUSES: FeaturedStatus[] = ['online', 'checking', 'offline', 'unknown'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const round1 = (value: number): number => Math.round(value * 10) / 10;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const addReason = (reasons: Record<string, number>, code: string): void => {
  reasons[code] = (reasons[code] ?? 0) + 1;
};

const stripUrlPunctuation = (value: string): string => value.replace(/[)\],.;]+$/g, '');

const decodeBase64Secret = (input: string): string | null => {
  const restored = input.replace(/\s+/g, '+');
  if (!/^[A-Za-z0-9+/_=-]+$/.test(restored)) return null;
  const padded = restored.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  try {
    const binary = atob(withPadding);
    if (binary.length < 16 || binary.length > 128) return null;
    let hex = '';
    for (let index = 0; index < binary.length; index += 1) {
      hex += binary.charCodeAt(index).toString(16).padStart(2, '0');
    }
    const validated = validateSecret(hex);
    return validated.ok ? validated.value : null;
  } catch {
    return null;
  }
};

/**
 * Telegram links may carry the secret as hex or URL-safe base64. Normalize both
 * to lowercase hex so deduplication and link building use one representation.
 */
export function normalizeSecret(input: string): string | null {
  const value = input.trim().replace(/^0x/i, '');
  if (!value) return null;
  const asHex = validateSecret(value);
  if (asHex.ok) return asHex.value;
  return decodeBase64Secret(value);
}

export function normalizeServer(input: string): string | null {
  const value = input.trim().toLowerCase().replace(/\.+$/, '');
  if (!value) return null;
  const result = validateServer(value);
  return result.ok ? result.value : null;
}

function candidateFromParts(
  serverInput: unknown,
  portInput: unknown,
  secretInput: unknown,
  context: FeedParseContext,
  countryInput?: unknown,
): ParsedCandidate | { code: string } {
  if (typeof serverInput !== 'string') return { code: 'server.invalid' };
  if (typeof secretInput !== 'string') return { code: 'secret.format' };
  const server = normalizeServer(serverInput);
  if (!server) {
    const raw = serverInput.trim().toLowerCase().replace(/\.+$/, '');
    const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(raw);
    return { code: ipv4 ? 'server.invalid' : 'server.invalid' };
  }
  const port = validatePort(
    typeof portInput === 'number' ? portInput : typeof portInput === 'string' ? portInput : '',
  );
  if (!port.ok) return { code: port.code };
  const secret = normalizeSecret(secretInput);
  if (!secret) return { code: 'secret.format' };

  let country: string | null = null;
  if (typeof countryInput === 'string') {
    const result = validateCountry(countryInput);
    country = result.ok ? result.value : null;
  }

  const link = buildTelegramProxyLink({ server, port: port.value, secret });
  if (!link) return { code: 'url.invalid' };

  return {
    server,
    port: port.value,
    secret,
    sourceId: context.sourceId,
    priority: context.priority ?? 1,
    country,
  };
}

function parseUrlValue(raw: string, context: FeedParseContext): ParsedCandidate | { code: string } {
  const cleaned = stripUrlPunctuation(raw.trim());
  const queryIndex = cleaned.indexOf('?');
  if (queryIndex === -1) return { code: 'url.invalid' };
  const params = new URLSearchParams(cleaned.slice(queryIndex + 1));
  return candidateFromParts(
    params.get('server'),
    params.get('port'),
    params.get('secret'),
    context,
  );
}

function parseJsonFeed(value: unknown, context: FeedParseContext): FeedParseResult | null {
  let list: unknown[] | null = null;
  if (Array.isArray(value)) list = value;
  else if (isRecord(value)) {
    if (Array.isArray(value.proxies)) list = value.proxies;
    else if (Array.isArray(value.endpoints)) list = value.endpoints;
    else if (Array.isArray(value.data)) list = value.data;
  }
  if (!list) return null;

  const result: FeedParseResult = {
    candidates: [],
    rejected: 0,
    rejectedReasons: {},
    duplicates: 0,
  };
  const seen = new Set<string>();

  const accept = (candidate: ParsedCandidate | { code: string }): void => {
    if ('code' in candidate) {
      result.rejected += 1;
      addReason(result.rejectedReasons, candidate.code);
      return;
    }
    const key = proxyKey(candidate);
    if (seen.has(key)) {
      result.duplicates += 1;
      return;
    }
    seen.add(key);
    result.candidates.push(candidate);
  };

  list.forEach((entry) => {
    if (typeof entry === 'string') {
      const fromUrl = URL_PATTERN.test(entry) ? parseUrlValue(entry, context) : null;
      URL_PATTERN.lastIndex = 0;
      if (fromUrl) {
        accept(fromUrl);
        return;
      }
      const match = entry.trim().match(HOST_FORMAT);
      if (match) {
        accept(candidateFromParts(match[1], match[2], match[3], context));
        return;
      }
      result.rejected += 1;
      addReason(result.rejectedReasons, 'format.unsupported');
      return;
    }
    if (!isRecord(entry)) {
      result.rejected += 1;
      addReason(result.rejectedReasons, 'format.unsupported');
      return;
    }
    const urlValue = entry.url ?? entry.link;
    if (typeof urlValue === 'string' && /proxy/i.test(urlValue)) {
      accept(parseUrlValue(urlValue, context));
      return;
    }
    accept(
      candidateFromParts(
        entry.server ?? entry.host ?? entry.address,
        entry.port,
        entry.secret,
        context,
        entry.country,
      ),
    );
  });

  return result;
}

/**
 * Parses plain text feeds (tg:// links, t.me links, host:port:secret lines) and
 * structured JSON feeds. Invalid records are counted, never guessed around.
 */
export function parseProxyFeed(text: string, context: FeedParseContext): FeedParseResult {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const jsonResult = parseJsonFeed(JSON.parse(trimmed) as unknown, context);
      if (jsonResult) return jsonResult;
    } catch {
      /* Not JSON after all; fall through to the line parser. */
    }
  }

  const result: FeedParseResult = {
    candidates: [],
    rejected: 0,
    rejectedReasons: {},
    duplicates: 0,
  };
  const seen = new Set<string>();

  const accept = (candidate: ParsedCandidate | { code: string }): void => {
    if ('code' in candidate) {
      result.rejected += 1;
      addReason(result.rejectedReasons, candidate.code);
      return;
    }
    const key = proxyKey(candidate);
    if (seen.has(key)) {
      result.duplicates += 1;
      return;
    }
    seen.add(key);
    result.candidates.push(candidate);
  };

  const urlMatches = trimmed.match(URL_PATTERN) ?? [];
  urlMatches.forEach((url) => accept(parseUrlValue(url, context)));

  trimmed.split(/\r?\n/).forEach((line) => {
    const value = line.trim();
    if (!value || value.startsWith('#') || value.startsWith('//')) return;
    if (URL_PATTERN.test(value)) {
      URL_PATTERN.lastIndex = 0;
      return;
    }
    URL_PATTERN.lastIndex = 0;
    const match = value.match(HOST_FORMAT);
    if (!match) {
      if (!/^(?:[a-z-]+:)?\/\//i.test(value)) {
        result.rejected += 1;
        addReason(result.rejectedReasons, 'format.unsupported');
      }
      return;
    }
    accept(candidateFromParts(match[1], match[2], match[3], context));
  });

  return result;
}

export function mergeCandidates(candidates: ParsedCandidate[]): MergedCandidate[] {
  const merged = new Map<string, MergedCandidate & { sourceSet: Set<string> }>();

  candidates.forEach((candidate) => {
    const key = proxyKey(candidate);
    const existing = merged.get(key);
    if (existing) {
      existing.sourceSet.add(candidate.sourceId);
      existing.sourceCount = existing.sourceSet.size;
      existing.sources = [...existing.sourceSet].sort();
      existing.priority = Math.max(existing.priority, candidate.priority);
      if (!existing.country && candidate.country) existing.country = candidate.country;
      return;
    }
    merged.set(key, {
      server: candidate.server,
      port: candidate.port,
      secret: candidate.secret,
      key,
      sources: [candidate.sourceId],
      sourceCount: 1,
      priority: candidate.priority,
      country: candidate.country,
      sourceSet: new Set([candidate.sourceId]),
    });
  });

  const mergedList: MergedCandidate[] = [];
  merged.forEach((candidate) => {
    mergedList.push({
      server: candidate.server,
      port: candidate.port,
      secret: candidate.secret,
      key: candidate.key,
      sources: candidate.sources,
      sourceCount: candidate.sourceCount,
      priority: candidate.priority,
      country: candidate.country,
    });
  });
  return mergedList;
}

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Applies the publication thresholds. Shared by the ranker and the collector's
 * `totalVerified` counter so the database totals always match the ranking rules.
 */
export function isEligibleVerification(
  verification: RankableVerification,
  options: Omit<RankOptions, 'featuredCount' | 'runnerRegion'>,
): boolean {
  const now = options.now ?? Date.now();
  const attempts = verification.successes + verification.failures;
  if (attempts <= 0) return false;
  if (verification.successes < options.minimumSuccessfulChecks) return false;
  if (verification.medianLatencyMs === null) return false;
  if (verification.medianLatencyMs > options.maximumLatencyMs) return false;

  const successRate = (verification.successes / attempts) * 100;
  if (successRate < options.minimumSuccessRate) return false;

  const verifiedTime = verification.verifiedAt ? Date.parse(verification.verifiedAt) : NaN;
  if (!Number.isFinite(verifiedTime)) return false;
  const ageMs = now - verifiedTime;
  return ageMs >= -5 * 60_000 && ageMs <= options.maximumDataAgeMinutes * 60_000;
}

/**
 * Ranks only endpoints that passed the configured verification threshold. It
 * never pads the list: a short result stays short.
 */
export function rankTopProxies(
  verifications: RankableVerification[],
  options: RankOptions,
): FeaturedProxyRecord[] {
  const now = options.now ?? Date.now();
  const maxAgeMs = options.maximumDataAgeMinutes * 60_000;
  const limit = Math.min(10, Math.max(1, options.featuredCount));

  const ranked = verifications
    .map((verification) => {
      if (!isEligibleVerification(verification, options)) return null;

      const attempts = verification.successes + verification.failures;
      const successRate = (verification.successes / attempts) * 100;
      const verifiedTime = verification.verifiedAt ? Date.parse(verification.verifiedAt) : now;
      const ageMs = now - verifiedTime;
      const latency = verification.medianLatencyMs as number;
      const score =
        clamp01(successRate / 100) * 40 +
        clamp01(1 - verification.failures / attempts) * 15 +
        clamp01(1 - latency / options.maximumLatencyMs) * 20 +
        clamp01(1 - Math.max(0, ageMs) / maxAgeMs) * 10 +
        clamp01(verification.sources.length / 3) * 10 +
        clamp01(verification.successes / 5) * 5;

      return {
        verification,
        successRate,
        latency,
        score: round1(score),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.successRate !== a.successRate) return b.successRate - a.successRate;
      if (a.latency !== b.latency) return a.latency - b.latency;
      const aTime = a.verification.verifiedAt ? Date.parse(a.verification.verifiedAt) : 0;
      const bTime = b.verification.verifiedAt ? Date.parse(b.verification.verifiedAt) : 0;
      if (bTime !== aTime) return bTime - aTime;
      return proxyKey(a.verification).localeCompare(proxyKey(b.verification));
    })
    .slice(0, limit);

  return ranked.map(({ verification, successRate, latency, score }, index) => ({
    id: `proxy-${stableHash(proxyKey(verification)).toString(16).padStart(8, '0')}`,
    rank: index + 1,
    server: verification.server,
    port: verification.port,
    secret: verification.secret,
    protocol: 'MTProto',
    status: 'online',
    latencyMs: Math.round(latency),
    medianLatencyMs: Math.round(latency),
    successRate: round1(successRate),
    successfulChecks: verification.successes,
    failedChecks: verification.failures,
    verifiedAt: verification.verifiedAt,
    lastFailedAt: verification.lastFailedAt,
    method: 'mtproto',
    runnerRegion: verification.runnerRegion,
    sourceCount: verification.sources.length,
    sources: verification.sources,
    country: verification.country,
    score,
  }));
}

export const emptyTopDataset = (
  sourceLabels: Record<string, string> = {},
  totalSources = 0,
  maxAgeMinutes = 480,
): TopProxyDataset => ({
  schemaVersion: 1,
  updatedAt: null,
  totalSources,
  totalDiscovered: 0,
  totalVerified: 0,
  featuredCount: 0,
  maxAgeMinutes,
  sourceLabels,
  proxies: [],
});

export function isTopProxyStale(dataset: TopProxyDataset, now = Date.now()): boolean {
  if (dataset.proxies.length === 0) return false;
  if (!dataset.updatedAt) return true;
  const time = Date.parse(dataset.updatedAt);
  if (!Number.isFinite(time)) return true;
  return now - time > dataset.maxAgeMinutes * 60_000;
}

/**
 * Strict reader for the published top-proxies file. Invalid records are
 * dropped, never rendered, and schema failures make the file unusable.
 */
export function parseTopProxyDataset(raw: unknown): TopDatasetParse {
  const issues: ValidationIssue[] = [];
  const base = emptyTopDataset();
  if (!isRecord(raw) || raw.schemaVersion !== 1 || !Array.isArray(raw.proxies)) {
    issues.push({
      code: 'dataset.schema',
      message: 'The featured proxy database has an unsupported schema.',
    });
    return { dataset: base, issues, skipped: 0 };
  }

  const featuredCount =
    typeof raw.featuredCount === 'number' && Number.isInteger(raw.featuredCount)
      ? Math.min(10, Math.max(0, raw.featuredCount))
      : 10;
  const maxAgeMinutes =
    typeof raw.maxAgeMinutes === 'number' &&
    Number.isFinite(raw.maxAgeMinutes) &&
    raw.maxAgeMinutes > 0 &&
    raw.maxAgeMinutes <= 10_080
      ? Math.round(raw.maxAgeMinutes)
      : 480;

  const sourceLabels: Record<string, string> = {};
  if (isRecord(raw.sourceLabels)) {
    Object.entries(raw.sourceLabels).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) sourceLabels[key] = value.trim();
    });
  }

  const proxies: FeaturedProxyRecord[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  raw.proxies.slice(0, 10).forEach((entry, index) => {
    const recordIssue = (code: ValidationIssue['code'], field: string, message: string) => {
      issues.push({ code, field, message, index });
      skipped += 1;
    };

    if (!isRecord(entry)) {
      recordIssue('dataset.schema', `proxies[${index}]`, 'Featured proxy record is not an object.');
      return;
    }

    const server = validateServer(typeof entry.server === 'string' ? entry.server : '');
    if (!server.ok) return recordIssue(server.code, 'server', server.message);
    const port = validatePort(
      typeof entry.port === 'number' ? entry.port : typeof entry.port === 'string' ? entry.port : '',
    );
    if (!port.ok) return recordIssue(port.code, 'port', port.message);
    const secret = validateSecret(typeof entry.secret === 'string' ? entry.secret : '');
    if (!secret.ok) return recordIssue(secret.code, 'secret', secret.message);

    const key = proxyKey({ server: server.value, port: port.value, secret: secret.value });
    if (seen.has(key)) {
      issues.push({ code: 'duplicate', field: 'server', message: 'Duplicate featured proxy.', index });
      skipped += 1;
      return;
    }
    seen.add(key);

    const status =
      typeof entry.status === 'string' && FEATURED_STATUSES.includes(entry.status as FeaturedStatus)
        ? (entry.status as FeaturedStatus)
        : null;
    if (!status) return recordIssue('status.invalid', 'status', 'Invalid featured status.');
    if (entry.protocol !== 'MTProto') {
      return recordIssue('dataset.schema', 'protocol', 'Only MTProto is supported.');
    }
    if (entry.method !== 'mtproto') {
      return recordIssue('dataset.schema', 'method', 'Only MTProto verification is supported.');
    }

    const id = typeof entry.id === 'string' ? entry.id : '';
    if (!ID_PATTERN.test(id)) return recordIssue('id.invalid', 'id', 'Invalid proxy id.');
    const rank = typeof entry.rank === 'number' ? entry.rank : NaN;
    if (!Number.isInteger(rank) || rank < 1 || rank > Math.max(1, featuredCount)) {
      return recordIssue('dataset.schema', 'rank', 'Rank is outside the featured range.');
    }
    if (proxies.some((proxy) => proxy.rank === rank)) {
      return recordIssue('dataset.schema', 'rank', 'Duplicate rank.');
    }

    const successRate = typeof entry.successRate === 'number' ? entry.successRate : NaN;
    if (!Number.isFinite(successRate) || successRate < 0 || successRate > 100) {
      return recordIssue('dataset.schema', 'successRate', 'Success rate must be between 0 and 100.');
    }
    const successfulChecks =
      typeof entry.successfulChecks === 'number' ? entry.successfulChecks : NaN;
    const failedChecks = typeof entry.failedChecks === 'number' ? entry.failedChecks : NaN;
    if (
      !Number.isInteger(successfulChecks) ||
      successfulChecks < 1 ||
      !Number.isInteger(failedChecks) ||
      failedChecks < 0
    ) {
      return recordIssue(
        'dataset.schema',
        'checks',
        'A published proxy needs at least one successful check and non-negative counters.',
      );
    }

    const latencyMs =
      entry.latencyMs === null
        ? null
        : typeof entry.latencyMs === 'number' && Number.isFinite(entry.latencyMs) && entry.latencyMs >= 0
          ? Math.round(entry.latencyMs)
          : NaN;
    if (Number.isNaN(latencyMs)) {
      return recordIssue('dataset.schema', 'latencyMs', 'Latency must be null or non-negative.');
    }
    const medianLatencyMs =
      entry.medianLatencyMs === null
        ? null
        : typeof entry.medianLatencyMs === 'number' && Number.isFinite(entry.medianLatencyMs)
          ? Math.round(entry.medianLatencyMs)
          : NaN;
    if (Number.isNaN(medianLatencyMs)) {
      return recordIssue('dataset.schema', 'medianLatencyMs', 'Median latency is invalid.');
    }

    if (typeof entry.verifiedAt !== 'string' || !isValidTimestamp(entry.verifiedAt)) {
      return recordIssue(
        'timestamp.invalid',
        'verifiedAt',
        'A published proxy needs a valid verification timestamp.',
      );
    }
    const verifiedAt: string = entry.verifiedAt;
    let lastFailedAt: string | null = null;
    if (entry.lastFailedAt !== null && entry.lastFailedAt !== undefined) {
      if (typeof entry.lastFailedAt !== 'string' || !isValidTimestamp(entry.lastFailedAt)) {
        return recordIssue('timestamp.invalid', 'lastFailedAt', 'Invalid failure timestamp.');
      }
      lastFailedAt = entry.lastFailedAt;
    }

    const sources = Array.isArray(entry.sources)
      ? entry.sources.filter((source): source is string => typeof source === 'string' && Boolean(source))
      : [];
    if (sources.length === 0) {
      return recordIssue('source.invalid', 'sources', 'At least one source is required.');
    }
    const sourceCount = sources.length;
    let country: string | null = null;
    if (entry.country !== null && entry.country !== undefined) {
      const result = validateCountry(typeof entry.country === 'string' ? entry.country : null);
      if (!result.ok) {
        return recordIssue('country.invalid', 'country', 'Invalid country code.');
      }
      country = result.value;
    }

    const score = typeof entry.score === 'number' ? entry.score : NaN;
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return recordIssue('dataset.schema', 'score', 'Score must be between 0 and 100.');
    }
    const runnerRegion =
      typeof entry.runnerRegion === 'string' && entry.runnerRegion.trim()
        ? entry.runnerRegion.trim().slice(0, 40)
        : '';

    proxies.push({
      id,
      rank,
      server: server.value,
      port: port.value,
      secret: secret.value,
      protocol: 'MTProto',
      status,
      latencyMs,
      medianLatencyMs,
      successRate: round1(successRate),
      successfulChecks,
      failedChecks,
      verifiedAt,
      lastFailedAt,
      method: 'mtproto',
      runnerRegion: runnerRegion || 'unknown',
      sourceCount,
      sources: [...new Set(sources)],
      country,
      score: round1(score),
    });
  });

  proxies.sort((a, b) => a.rank - b.rank);

  const dataset: TopProxyDataset = {
    schemaVersion: 1,
    updatedAt:
      raw.updatedAt === null
        ? null
        : typeof raw.updatedAt === 'string' && isValidTimestamp(raw.updatedAt)
          ? raw.updatedAt
          : null,
    totalSources:
      typeof raw.totalSources === 'number' && Number.isInteger(raw.totalSources) && raw.totalSources >= 0
        ? raw.totalSources
        : 0,
    totalDiscovered:
      typeof raw.totalDiscovered === 'number' &&
      Number.isInteger(raw.totalDiscovered) &&
      raw.totalDiscovered >= 0
        ? raw.totalDiscovered
        : 0,
    totalVerified:
      typeof raw.totalVerified === 'number' &&
      Number.isInteger(raw.totalVerified) &&
      raw.totalVerified >= 0
        ? raw.totalVerified
        : 0,
    featuredCount: proxies.length,
    maxAgeMinutes,
    sourceLabels,
    proxies,
  };

  return { dataset, issues, skipped };
}

/** Validates a secret that was already normalized; used by the collector. */
export const validateNormalizedSecret = (secret: string): Result<string> => validateSecret(secret);

/**
 * Builds the official Telegram deep link with the URL API so every parameter is
 * encoded exactly once. Telegram still asks the user to confirm the connection.
 */
export function buildFeaturedTelegramLink(
  proxy: Pick<FeaturedProxyRecord, 'server' | 'port' | 'secret'>,
): string {
  const url = new URL('https://t.me/proxy');
  url.searchParams.set('server', proxy.server);
  url.searchParams.set('port', String(proxy.port));
  url.searchParams.set('secret', proxy.secret);
  return url.toString();
}

/**
 * Converts a featured proxy record into a standard ProxyRecord for directory,
 * details, and statistics display when the manual database is empty.
 */
export function featuredProxyToRecord(featured: FeaturedProxyRecord): ProxyRecord {
  const status = featured.status === 'online' ? 'online' : featured.status === 'offline' ? 'offline' : 'unknown';
  return {
    id: featured.id,
    name: featured.server,
    type: 'mtproto',
    server: featured.server,
    port: featured.port,
    secret: featured.secret,
    country: featured.country,
    sourceId: featured.sources[0] ?? 'collector',
    trust: 'trusted-source',
    status,
    latencyMs: featured.latencyMs,
    lastChecked: featured.verifiedAt,
    lastOnline: featured.verifiedAt,
    consecutiveFailures: featured.failedChecks,
    history: featured.verifiedAt
      ? [
          {
            at: featured.verifiedAt,
            status: status === 'online' ? 'online' : 'offline',
            latencyMs: featured.latencyMs,
            method: 'mtproto',
          },
        ]
      : [],
    createdAt: featured.verifiedAt ?? new Date().toISOString(),
    notes: `Top #${featured.rank} · Score: ${featured.score}`,
  };
}

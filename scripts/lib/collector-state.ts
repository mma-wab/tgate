import { existsSync, readFileSync } from 'node:fs';
import {
  isValidTimestamp,
  proxyKey,
  validateCountry,
  validatePort,
  validateSecret,
  validateServer,
} from '../../src/lib/validation';
import { stableHash, type RankableVerification } from '../../src/lib/top-proxies';
import { writeJsonAtomic } from './atomic-write';

/**
 * Operational state for the automated collector.
 *
 * It keeps a short rolling check window per endpoint so ranking reflects
 * stability across runs, not a single probe. It also stores service exclusions
 * for endpoints that repeatedly fail. The state file only contains publicly
 * advertised proxy credentials, which are part of the Telegram invite link; it
 * is never rendered on the website and full secrets are never logged.
 */

export type AttemptResult = 'success' | 'failure' | 'timeout' | 'unknown';

export interface CollectorAttempt {
  at: string;
  result: AttemptResult;
  latencyMs: number | null;
}

export interface CollectorEndpointState {
  id: string;
  server: string;
  port: number;
  secret: string;
  sources: string[];
  country: string | null;
  attempts: CollectorAttempt[];
  consecutiveFailedRuns: number;
  firstSeenAt: string;
  lastAttemptAt: string;
}

export interface CollectorExclusionState {
  id: string;
  server: string;
  port: number;
  reason: string;
  until: string;
}

export interface CollectorState {
  schemaVersion: 1;
  updatedAt: string | null;
  endpoints: CollectorEndpointState[];
  exclusions: CollectorExclusionState[];
}

export interface VerificationCandidate {
  server: string;
  port: number;
  secret: string;
  sources: string[];
  country: string | null;
}

export interface VerificationAttemptInput {
  result: AttemptResult;
  latencyMs: number | null;
}

export const MAX_STORED_ATTEMPTS = 12;
export const MAX_STORED_ENDPOINTS = 80;
export const MAX_STORED_EXCLUSIONS = 200;
const MAX_ENDPOINTS_TO_PARSE = 400;
const MIN_RETENTION_MS = 24 * 60 * 60 * 1000;

const ATTEMPT_RESULTS: AttemptResult[] = ['success', 'failure', 'timeout', 'unknown'];
const SOURCE_ID = /^[a-z0-9][a-z0-9-]{1,39}$/;
const PROXY_ID = /^proxy-[0-9a-f]{8}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isAttemptResult = (value: unknown): value is AttemptResult =>
  typeof value === 'string' && ATTEMPT_RESULTS.includes(value as AttemptResult);

export const proxyIdFor = (endpoint: Pick<CollectorEndpointState, 'server' | 'port' | 'secret'>): string =>
  `proxy-${stableHash(proxyKey(endpoint)).toString(16).padStart(8, '0')}`;

export const emptyCollectorState = (): CollectorState => ({
  schemaVersion: 1,
  updatedAt: null,
  endpoints: [],
  exclusions: [],
});

function parseAttempt(value: unknown): CollectorAttempt | null {
  if (!isRecord(value) || !isAttemptResult(value.result) || !isValidTimestamp(value.at)) {
    return null;
  }
  const latency =
    typeof value.latencyMs === 'number' && Number.isFinite(value.latencyMs) && value.latencyMs >= 0
      ? Math.round(value.latencyMs)
      : null;
  return { at: value.at, result: value.result, latencyMs: latency };
}

function parseEndpoint(value: unknown, now: number): CollectorEndpointState | null {
  if (!isRecord(value)) return null;
  const server = validateServer(typeof value.server === 'string' ? value.server : '');
  if (!server.ok) return null;
  const port = validatePort(
    typeof value.port === 'number' ? value.port : typeof value.port === 'string' ? value.port : '',
  );
  if (!port.ok) return null;
  const secret = validateSecret(typeof value.secret === 'string' ? value.secret : '');
  if (!secret.ok) return null;

  const sources = Array.isArray(value.sources)
    ? [
        ...new Set(
          value.sources.filter(
            (source): source is string => typeof source === 'string' && SOURCE_ID.test(source),
          ),
        ),
      ].sort()
    : [];
  if (sources.length === 0) return null;

  let country: string | null = null;
  if (value.country !== null && value.country !== undefined) {
    const parsedCountry = validateCountry(typeof value.country === 'string' ? value.country : null);
    country = parsedCountry.ok ? parsedCountry.value : null;
  }

  const attempts = Array.isArray(value.attempts)
    ? value.attempts
        .map(parseAttempt)
        .filter((attempt): attempt is CollectorAttempt => attempt !== null)
        .slice(-MAX_STORED_ATTEMPTS)
    : [];
  const attemptTimes = attempts.map((attempt) => Date.parse(attempt.at)).filter(Number.isFinite);
  const fallbackAt = new Date(now).toISOString();
  const firstSeenAt = isValidTimestamp(value.firstSeenAt)
    ? value.firstSeenAt
    : attemptTimes.length > 0
      ? new Date(Math.min(...attemptTimes)).toISOString()
      : fallbackAt;
  const lastAttemptAt = isValidTimestamp(value.lastAttemptAt)
    ? value.lastAttemptAt
    : attemptTimes.length > 0
      ? new Date(Math.max(...attemptTimes)).toISOString()
      : firstSeenAt;

  const consecutive =
    typeof value.consecutiveFailedRuns === 'number' &&
    Number.isInteger(value.consecutiveFailedRuns) &&
    value.consecutiveFailedRuns >= 0
      ? Math.min(100, value.consecutiveFailedRuns)
      : 0;

  const endpoint: CollectorEndpointState = {
    id: proxyIdFor({ server: server.value, port: port.value, secret: secret.value }),
    server: server.value,
    port: port.value,
    secret: secret.value,
    sources,
    country,
    attempts,
    consecutiveFailedRuns: consecutive,
    firstSeenAt,
    lastAttemptAt,
  };
  return endpoint;
}

function parseExclusion(value: unknown, now: number): CollectorExclusionState | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !PROXY_ID.test(value.id)) return null;
  const server = validateServer(typeof value.server === 'string' ? value.server : '');
  if (!server.ok) return null;
  const port = validatePort(
    typeof value.port === 'number' ? value.port : typeof value.port === 'string' ? value.port : '',
  );
  if (!port.ok) return null;
  if (!isValidTimestamp(value.until) || Date.parse(value.until) <= now) return null;
  const reason =
    typeof value.reason === 'string' && value.reason.trim()
      ? value.reason.trim().slice(0, 80)
      : 'repeated-failures';
  return {
    id: value.id,
    server: server.value,
    port: port.value,
    reason,
    until: value.until,
  };
}

/** Tolerant reader: invalid endpoints are dropped instead of breaking a run. */
export function parseCollectorState(
  raw: unknown,
  options: { now?: number; onWarning?: (message: string) => void } = {},
): CollectorState {
  const now = options.now ?? Date.now();
  if (!isRecord(raw) || raw.schemaVersion !== 1) {
    options.onWarning?.('Ignoring collector state with an unsupported schema.');
    return emptyCollectorState();
  }

  const endpoints: CollectorEndpointState[] = [];
  const seenEndpoints = new Set<string>();
  if (Array.isArray(raw.endpoints)) {
    raw.endpoints.slice(0, MAX_ENDPOINTS_TO_PARSE).forEach((entry, index) => {
      const parsed = parseEndpoint(entry, now);
      if (!parsed) {
        options.onWarning?.(`Dropped invalid state endpoint at index ${index}.`);
        return;
      }
      if (seenEndpoints.has(parsed.id)) return;
      seenEndpoints.add(parsed.id);
      endpoints.push(parsed);
    });
  }

  const exclusions: CollectorExclusionState[] = [];
  const seenExclusions = new Set<string>();
  if (Array.isArray(raw.exclusions)) {
    raw.exclusions.slice(0, MAX_STORED_EXCLUSIONS).forEach((entry, index) => {
      const parsed = parseExclusion(entry, now);
      if (!parsed) {
        options.onWarning?.(`Dropped expired or invalid exclusion at index ${index}.`);
        return;
      }
      if (seenExclusions.has(parsed.id)) return;
      seenExclusions.add(parsed.id);
      exclusions.push(parsed);
    });
  }

  return {
    schemaVersion: 1,
    updatedAt: isValidTimestamp(raw.updatedAt) ? raw.updatedAt : null,
    endpoints,
    exclusions,
  };
}

export function loadCollectorState(
  path: string,
  options: { now?: number; onWarning?: (message: string) => void } = {},
): CollectorState {
  if (!existsSync(path)) return emptyCollectorState();
  try {
    return parseCollectorState(JSON.parse(readFileSync(path, 'utf8')) as unknown, options);
  } catch (error) {
    options.onWarning?.(
      `Could not read collector state: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    return emptyCollectorState();
  }
}

export function saveCollectorState(path: string, state: CollectorState): void {
  writeJsonAtomic(path, state);
}

export function medianLatencyOf(attempts: CollectorAttempt[]): number | null {
  const latencies = attempts
    .filter((attempt) => attempt.result === 'success' && attempt.latencyMs !== null)
    .map((attempt) => attempt.latencyMs as number)
    .sort((a, b) => a - b);
  if (latencies.length === 0) return null;
  const middle = Math.floor(latencies.length / 2);
  if (latencies.length % 2 === 1) return latencies[middle] ?? null;
  const lower = latencies[middle - 1];
  const upper = latencies[middle];
  if (lower === undefined || upper === undefined) return null;
  return (lower + upper) / 2;
}

/** Converts stored history into the ranker's input shape. */
export function rankableFromState(
  endpoint: CollectorEndpointState,
  runnerRegion: string,
): RankableVerification {
  const successes = endpoint.attempts.filter((attempt) => attempt.result === 'success');
  const failures = endpoint.attempts.filter(
    (attempt) => attempt.result === 'failure' || attempt.result === 'timeout',
  );
  const unknowns = endpoint.attempts.filter((attempt) => attempt.result === 'unknown');
  const lastSuccess = successes.length > 0 ? successes[successes.length - 1] : undefined;
  const lastFailure = failures.length > 0 ? failures[failures.length - 1] : undefined;

  return {
    server: endpoint.server,
    port: endpoint.port,
    secret: endpoint.secret,
    sources: endpoint.sources,
    country: endpoint.country,
    successes: successes.length,
    failures: failures.length,
    unknowns: unknowns.length,
    medianLatencyMs: medianLatencyOf(endpoint.attempts),
    verifiedAt: lastSuccess?.at ?? null,
    lastFailedAt: lastFailure?.at ?? null,
    runnerRegion,
  };
}

/**
 * Applies one run's attempts. A run with at least one success resets the failure
 * streak; consecutive failed runs at the threshold create an exclusion and clear
 * the attempt window so a later re-verification starts clean.
 */
export function applyVerification(
  existing: CollectorEndpointState | null,
  candidate: VerificationCandidate,
  attempts: VerificationAttemptInput[],
  at: string,
  failureThreshold: number,
): { endpoint: CollectorEndpointState; excluded: boolean } {
  const id = proxyIdFor(candidate);
  const sameEndpoint = existing && existing.id === id ? existing : null;
  const successes = attempts.filter((attempt) => attempt.result === 'success').length;
  const failures = attempts.filter(
    (attempt) => attempt.result === 'failure' || attempt.result === 'timeout',
  ).length;

  const previousStreak = sameEndpoint?.consecutiveFailedRuns ?? 0;
  const streak = successes > 0 ? 0 : failures > 0 ? previousStreak + 1 : previousStreak;
  const excluded = streak >= failureThreshold;

  const sourceSet = new Set(sameEndpoint?.sources ?? []);
  candidate.sources.forEach((source) => {
    if (SOURCE_ID.test(source)) sourceSet.add(source);
  });

  const storedAttempts: CollectorAttempt[] = attempts.map((attempt) => ({
    at,
    result: attempt.result,
    latencyMs:
      attempt.latencyMs !== null && Number.isFinite(attempt.latencyMs) && attempt.latencyMs >= 0
        ? Math.round(attempt.latencyMs)
        : null,
  }));

  const endpoint: CollectorEndpointState = {
    id,
    server: candidate.server,
    port: candidate.port,
    secret: candidate.secret,
    sources: [...sourceSet].sort(),
    country: candidate.country ?? sameEndpoint?.country ?? null,
    attempts: excluded
      ? []
      : [...(sameEndpoint?.attempts ?? []), ...storedAttempts].slice(-MAX_STORED_ATTEMPTS),
    consecutiveFailedRuns: excluded ? failureThreshold : Math.min(100, streak),
    firstSeenAt: sameEndpoint?.firstSeenAt ?? at,
    lastAttemptAt: at,
  };

  return { endpoint, excluded };
}

/** Keeps recently working endpoints for rechecks while bounding the file size. */
export function pruneCollectorState(
  state: CollectorState,
  options: { now: number; keepIds: Set<string>; maxAgeMinutes: number },
): CollectorState {
  const retentionMs = Math.max(MIN_RETENTION_MS, options.maxAgeMinutes * 2 * 60_000);

  const isRecent = (endpoint: CollectorEndpointState): boolean => {
    const successes = endpoint.attempts.filter((attempt) => attempt.result === 'success');
    const last = successes[successes.length - 1];
    if (!last) return false;
    return options.now - Date.parse(last.at) <= retentionMs;
  };

  const keptIds = state.endpoints.filter(
    (endpoint) => options.keepIds.has(endpoint.id) || isRecent(endpoint),
  );
  const pinned = keptIds.filter((endpoint) => options.keepIds.has(endpoint.id));
  const rest = keptIds
    .filter((endpoint) => !options.keepIds.has(endpoint.id))
    .sort((a, b) => Date.parse(b.lastAttemptAt) - Date.parse(a.lastAttemptAt));
  const endpoints = [...pinned, ...rest].slice(0, MAX_STORED_ENDPOINTS);

  const exclusions = state.exclusions
    .filter((exclusion) => Date.parse(exclusion.until) > options.now)
    .sort((a, b) => Date.parse(b.until) - Date.parse(a.until))
    .slice(0, MAX_STORED_EXCLUSIONS);

  return {
    schemaVersion: 1,
    updatedAt: new Date(options.now).toISOString(),
    endpoints,
    exclusions,
  };
}

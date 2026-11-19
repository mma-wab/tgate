import { readFileSync } from 'node:fs';
import { validateServer } from '../../src/lib/validation';
import type {
  CollectorConfig,
  CollectorExclusion,
  CollectorFeed,
  CollectorSource,
} from '../../src/types/top-proxy';
import { assertAllowedSourceUrl } from './network-guard';

/**
 * Parses and validates `config/collector.json`. Misconfiguration fails loudly
 * instead of silently weakening the allowlist or the verification thresholds.
 */

export class CollectorConfigError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid collector configuration:\n- ${issues.join('\n- ')}`);
    this.name = 'CollectorConfigError';
    this.issues = issues;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const SOURCE_ID = /^[a-z0-9][a-z0-9-]{1,39}$/;
const CRON = /^[0-9*/,\-]+(?:\s+[0-9A-Za-z*/,\-]+){4}$/;

const readString = (
  raw: Record<string, unknown>,
  field: string,
  maxLength: number,
  issues: string[],
): string => {
  const value = raw[field];
  if (typeof value !== 'string' || !value.trim()) {
    issues.push(`${field} must be a non-empty string.`);
    return '';
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    issues.push(`${field} must be at most ${maxLength} characters.`);
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
};

const readInteger = (
  raw: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
  issues: string[],
): number => {
  const value = raw[field];
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    issues.push(`${field} must be an integer.`);
    return min;
  }
  if (value < min || value > max) {
    issues.push(`${field} must be between ${min} and ${max} (received ${value}).`);
    return Math.min(max, Math.max(min, value));
  }
  return value;
};

const readBoolean = (
  raw: Record<string, unknown>,
  field: string,
  fallback: boolean,
  issues: string[],
): boolean => {
  const value = raw[field];
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') {
    issues.push(`${field} must be true or false.`);
    return fallback;
  }
  return value;
};

const parseHostAllowlist = (value: unknown, issues: string[]): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push('allowedHosts must be a non-empty array of public hostnames.');
    return [];
  }
  if (value.length > 20) {
    issues.push('allowedHosts must contain at most 20 entries.');
  }
  const hosts: string[] = [];
  value.slice(0, 20).forEach((entry, index) => {
    if (typeof entry !== 'string') {
      issues.push(`allowedHosts[${index}] must be a hostname string.`);
      return;
    }
    const checked = validateServer(entry);
    if (!checked.ok) {
      issues.push(`allowedHosts[${index}]: ${checked.message}`);
      return;
    }
    hosts.push(checked.value);
  });
  return [...new Set(hosts)];
};

const parseFeed = (
  value: unknown,
  sourceId: string,
  allowedHosts: string[],
  index: number,
  issues: string[],
): CollectorFeed | null => {
  if (!isRecord(value)) {
    issues.push(`sources[${sourceId}].feeds[${index}] must be an object.`);
    return null;
  }
  if (typeof value.url !== 'string') {
    issues.push(`sources[${sourceId}].feeds[${index}].url must be a string.`);
    return null;
  }
  let url: string;
  try {
    url = assertAllowedSourceUrl(value.url, allowedHosts).toString();
  } catch (error) {
    issues.push(
      `sources[${sourceId}].feeds[${index}]: ${error instanceof Error ? error.message : 'invalid URL'}`,
    );
    return null;
  }
  const priority =
    typeof value.priority === 'number' && Number.isInteger(value.priority)
      ? Math.min(10, Math.max(1, value.priority))
      : 1;
  return { url, priority };
};

const parseSource = (
  value: unknown,
  allowedHosts: string[],
  index: number,
  issues: string[],
): CollectorSource | null => {
  if (!isRecord(value)) {
    issues.push(`sources[${index}] must be an object.`);
    return null;
  }
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  if (!SOURCE_ID.test(id)) {
    issues.push(`sources[${index}].id must match ${SOURCE_ID}.`);
    return null;
  }
  const name = readString(value, 'name', 80, issues);
  const repoRaw = typeof value.repo === 'string' ? value.repo.trim() : '';
  try {
    const repo = new URL(repoRaw);
    if (repo.protocol !== 'https:') throw new Error('must use HTTPS');
  } catch {
    issues.push(`sources[${id}].repo must be an HTTPS URL.`);
  }
  const enabled = readBoolean(value, 'enabled', true, issues);
  if (!Array.isArray(value.feeds) || value.feeds.length === 0) {
    issues.push(`sources[${id}].feeds must be a non-empty array.`);
    return null;
  }
  const feeds: CollectorFeed[] = [];
  value.feeds.slice(0, 10).forEach((feed, feedIndex) => {
    const parsed = parseFeed(feed, id, allowedHosts, feedIndex, issues);
    if (parsed) feeds.push(parsed);
  });
  if (enabled && feeds.length === 0) {
    issues.push(`sources[${id}] is enabled but has no valid feeds.`);
    return null;
  }
  return { id, name: name || id, repo: repoRaw, enabled, feeds };
};

const parseExclusions = (value: unknown, issues: string[]): CollectorExclusion[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push('exclusions must be an array.');
    return [];
  }
  const exclusions: CollectorExclusion[] = [];
  const seen = new Set<string>();
  value.slice(0, 200).forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(`exclusions[${index}] must be an object.`);
      return;
    }
    const checked = validateServer(typeof entry.server === 'string' ? entry.server : '');
    if (!checked.ok) {
      issues.push(`exclusions[${index}]: ${checked.message}`);
      return;
    }
    if (seen.has(checked.value)) return;
    seen.add(checked.value);
    const reason =
      typeof entry.reason === 'string' && entry.reason.trim()
        ? entry.reason.trim().slice(0, 120)
        : undefined;
    exclusions.push(reason ? { server: checked.value, reason } : { server: checked.value });
  });
  return exclusions;
};

export function parseCollectorConfig(raw: unknown): CollectorConfig {
  const issues: string[] = [];
  if (!isRecord(raw)) throw new CollectorConfigError(['Configuration root must be an object.']);
  if (raw.schemaVersion !== 1) issues.push('schemaVersion must be 1.');

  const featuredCount = readInteger(raw, 'featuredCount', 1, 50, issues);
  const maxCandidates = readInteger(raw, 'maxCandidates', 1, 300, issues);
  const verificationAttempts = readInteger(raw, 'verificationAttempts', 1, 5, issues);
  const timeoutMs = readInteger(raw, 'timeoutMs', 1500, 30_000, issues);
  const concurrency = readInteger(raw, 'concurrency', 1, 16, issues);
  const maxResponseBytes = readInteger(raw, 'maxResponseBytes', 65_536, 10_485_760, issues);
  const minimumSuccessRate = readInteger(raw, 'minimumSuccessRate', 0, 100, issues);
  const maximumLatencyMs = readInteger(raw, 'maximumLatencyMs', 100, 60_000, issues);
  const maximumDataAgeMinutes = readInteger(raw, 'maximumDataAgeMinutes', 30, 10_080, issues);
  const failureThreshold = readInteger(raw, 'failureThreshold', 1, 10, issues);
  const exclusionHours = readInteger(raw, 'exclusionHours', 1, 168, issues);

  const minimumSuccessfulChecks = readInteger(
    raw,
    'minimumSuccessfulChecks',
    1,
    verificationAttempts,
    issues,
  );
  if (minimumSuccessfulChecks > verificationAttempts) {
    issues.push('minimumSuccessfulChecks cannot exceed verificationAttempts.');
  }

  const runnerRaw =
    typeof raw.runnerRegion === 'string' ? raw.runnerRegion.trim().slice(0, 40) : '';
  if (!runnerRaw || !/^[A-Za-z0-9 ._-]+$/.test(runnerRaw)) {
    issues.push('runnerRegion must be a short label (letters, digits, spaces, . _ -).');
  }

  if (!isRecord(raw.schedule)) {
    issues.push('schedule must be an object.');
  }
  const schedule: Record<string, unknown> = isRecord(raw.schedule) ? raw.schedule : {};
  const collectionCron =
    typeof schedule.collectionCron === 'string' ? schedule.collectionCron.trim() : '';
  if (!CRON.test(collectionCron)) {
    issues.push('schedule.collectionCron must be a five-field cron expression.');
  }
  const verification =
    typeof schedule.verification === 'string' ? schedule.verification.trim() : '';
  if (!verification || verification.length > 80) {
    issues.push('schedule.verification must be "same-run" or a short description.');
  }
  const note =
    typeof schedule.note === 'string' ? schedule.note.trim().slice(0, 240) : undefined;

  const allowedHosts = parseHostAllowlist(raw.allowedHosts, issues);

  if (!Array.isArray(raw.sources) || raw.sources.length === 0) {
    issues.push('sources must be a non-empty array.');
  }
  const sources: CollectorSource[] = [];
  if (Array.isArray(raw.sources)) {
    const seen = new Set<string>();
    raw.sources.slice(0, 20).forEach((source, index) => {
      const parsed = parseSource(source, allowedHosts, index, issues);
      if (!parsed) return;
      if (seen.has(parsed.id)) {
        issues.push(`Duplicate source id "${parsed.id}".`);
        return;
      }
      seen.add(parsed.id);
      sources.push(parsed);
    });
  }
  if (!sources.some((source) => source.enabled)) {
    issues.push('At least one source must be enabled.');
  }

  const exclusions = parseExclusions(raw.exclusions, issues);

  if (issues.length > 0) throw new CollectorConfigError(issues);

  return {
    schemaVersion: 1,
    featuredCount,
    maxCandidates,
    verificationAttempts,
    timeoutMs,
    concurrency,
    maxResponseBytes,
    minimumSuccessRate,
    minimumSuccessfulChecks,
    maximumLatencyMs,
    maximumDataAgeMinutes,
    failureThreshold,
    exclusionHours,
    runnerRegion: runnerRaw,
    schedule: {
      collectionCron,
      verification,
      ...(note ? { note } : {}),
    },
    allowedHosts,
    sources,
    exclusions,
  };
}

export function loadCollectorConfig(path: string): CollectorConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    throw new CollectorConfigError([
      `Cannot read ${path}: ${error instanceof Error ? error.message : 'unknown error'}`,
    ]);
  }
  return parseCollectorConfig(raw);
}

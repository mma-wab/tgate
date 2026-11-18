import type {
  CheckHistoryEntry,
  ProxyDataset,
  ProxyRecord,
  ProxyStatus,
  TrustLevel,
} from '../types/proxy';

export type ValidationCode =
  | 'required'
  | 'server.invalid'
  | 'server.private'
  | 'server.reserved'
  | 'port.invalid'
  | 'secret.format'
  | 'secret.length'
  | 'name.invalid'
  | 'country.invalid'
  | 'source.invalid'
  | 'trust.invalid'
  | 'status.invalid'
  | 'timestamp.invalid'
  | 'id.invalid'
  | 'duplicate'
  | 'dataset.schema';

export interface ValidationIssue {
  code: ValidationCode;
  field?: string;
  /** English message for CLI output and logs. UI layers translate by code. */
  message: string;
  index?: number;
}

export type Result<T> = { ok: true; value: T } | { ok: false; code: ValidationCode; message: string };

const RESERVED_SUFFIXES = ['.invalid', '.test', '.example', '.localhost'];
const RESERVED_HOSTS = new Set(['example.com', 'example.net', 'example.org', 'localhost']);
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const HOSTNAME = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const HEX = /^[0-9a-f]+$/;
const COUNTRY = /^[A-Z]{2}$/;
const SOURCE_ID = /^[a-z0-9][a-z0-9-]{1,39}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;

const isPrivateIpv4 = (octets: number[]): boolean => {
  const [a = 0, b = 0, c = 0] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
};

/**
 * Validates a proxy server address. Only public hostnames and IPv4 literals are
 * accepted so the monitor never receives a private-network target from the
 * public directory.
 */
export function validateServer(input: string): Result<string> {
  const value = input.trim().toLowerCase();
  if (!value) {
    return { ok: false, code: 'required', message: 'Server is required.' };
  }
  if (value.length > 253 || /[\s/\\@?#:]/.test(value)) {
    return {
      ok: false,
      code: 'server.invalid',
      message: 'Enter a hostname or IPv4 address without a scheme, path, or port.',
    };
  }

  const ipMatch = value.match(IPV4);
  if (ipMatch) {
    const octets = ipMatch.slice(1).map(Number);
    if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
      return { ok: false, code: 'server.invalid', message: 'IPv4 address is out of range.' };
    }
    if (isPrivateIpv4(octets)) {
      return {
        ok: false,
        code: 'server.private',
        message: 'Private, reserved, or multicast IP addresses are not allowed.',
      };
    }
    return { ok: true, value };
  }

  if (!HOSTNAME.test(value) || /^\d+\.\d+\.\d+\.\d+$/.test(value)) {
    return { ok: false, code: 'server.invalid', message: 'Enter a valid public hostname.' };
  }
  if (/^\d/.test(value)) {
    return { ok: false, code: 'server.invalid', message: 'Hostnames cannot start with a digit.' };
  }
  if (
    RESERVED_HOSTS.has(value) ||
    RESERVED_SUFFIXES.some((suffix) => value.endsWith(suffix))
  ) {
    return {
      ok: false,
      code: 'server.reserved',
      message: 'Example, test, and local hostnames are not allowed.',
    };
  }
  return { ok: true, value };
}

export function validatePort(input: string | number): Result<number> {
  const raw = typeof input === 'number' ? String(input) : input.trim();
  if (!raw) {
    return { ok: false, code: 'required', message: 'Port is required.' };
  }
  if (!/^\d{1,5}$/.test(raw)) {
    return { ok: false, code: 'port.invalid', message: 'Port must be a whole number.' };
  }
  const port = Number.parseInt(raw, 10);
  if (port < 1 || port > 65535) {
    return { ok: false, code: 'port.invalid', message: 'Port must be between 1 and 65535.' };
  }
  return { ok: true, value: port };
}

/**
 * MTProto secrets are hexadecimal strings. Telegram uses 16-byte secrets, an
 * optional 17th flag byte, and longer secret variants, so even lengths between
 * 32 and 256 hex characters are accepted.
 */
export function validateSecret(input: string): Result<string> {
  const value = input.trim().toLowerCase().replace(/^0x/, '');
  if (!value) {
    return { ok: false, code: 'required', message: 'Secret is required.' };
  }
  if (!HEX.test(value)) {
    return {
      ok: false,
      code: 'secret.format',
      message: 'Secret must contain hexadecimal characters only (0–9, a–f).',
    };
  }
  if (value.length < 32 || value.length > 256 || value.length % 2 !== 0) {
    return {
      ok: false,
      code: 'secret.length',
      message: 'Secret must be an even-length hex string between 32 and 256 characters.',
    };
  }
  return { ok: true, value };
}

export function sanitizeLabel(input: string, maxLength = 60): string {
  return input.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}

export function validateCountry(input: string | null | undefined): Result<string | null> {
  if (input === null || input === undefined || input.trim() === '') {
    return { ok: true, value: null };
  }
  const value = input.trim().toUpperCase();
  if (!COUNTRY.test(value)) {
    return {
      ok: false,
      code: 'country.invalid',
      message: 'Country must be a two-letter ISO 3166-1 code or left empty.',
    };
  }
  return { ok: true, value };
}

export function proxyKey(proxy: Pick<ProxyRecord, 'server' | 'port' | 'secret'>): string {
  return `${proxy.server.toLowerCase()}|${proxy.port}|${proxy.secret.toLowerCase()}`;
}

/** Public connection data used to build Telegram links. */
export interface ProxyEndpoint {
  server: string;
  port: number;
  secret: string;
}

/** Returns the official Telegram deep link, or null when data is not valid. */
export function buildTelegramProxyLink(endpoint: ProxyEndpoint): string | null {
  const server = validateServer(endpoint.server);
  const port = validatePort(endpoint.port);
  const secret = validateSecret(endpoint.secret);
  if (!server.ok || !port.ok || !secret.ok) return null;
  return `https://t.me/proxy?server=${encodeURIComponent(server.value)}&port=${port.value}&secret=${encodeURIComponent(secret.value)}`;
}

export function formatHostPort(endpoint: Pick<ProxyEndpoint, 'server' | 'port'>): string {
  return `${endpoint.server}:${endpoint.port}`;
}

export function maskSecret(secret: string): string {
  if (secret.length <= 12) return '••••••••';
  return `${secret.slice(0, 6)}…${secret.slice(-4)}`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

export function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE.test(value) && Number.isFinite(Date.parse(value));
}

const STATUSES: ProxyStatus[] = ['online', 'offline', 'timeout', 'unknown'];
const TRUST_LEVELS: TrustLevel[] = ['trusted-source', 'community', 'unverified'];

function isStatus(value: unknown): value is ProxyStatus {
  return typeof value === 'string' && STATUSES.includes(value as ProxyStatus);
}

function sanitizeHistory(input: unknown): CheckHistoryEntry[] {
  if (!Array.isArray(input)) return [];
  const entries: CheckHistoryEntry[] = [];
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as Record<string, unknown>;
    if (!isValidTimestamp(raw.at) || !isStatus(raw.status)) continue;
    const latency =
      typeof raw.latencyMs === 'number' && Number.isFinite(raw.latencyMs) && raw.latencyMs >= 0
        ? Math.round(raw.latencyMs)
        : null;
    entries.push({
      at: raw.at,
      status: raw.status,
      latencyMs: latency,
      ...(raw.method === 'mtproto' || raw.method === 'transport' ? { method: raw.method } : {}),
    });
  }
  return entries.slice(-48);
}

/**
 * Validates and normalizes a single proxy record. Unknown keys are dropped, so
 * private review metadata can never leak through this public data shape.
 */
export function validateProxyRecord(
  input: unknown,
  options: { requireId?: boolean; requireTimestamps?: boolean } = {},
): { ok: true; value: ProxyRecord } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!input || typeof input !== 'object') {
    return { ok: false, issues: [{ code: 'required', message: 'Proxy must be an object.' }] };
  }
  const raw = input as Record<string, unknown>;

  const server = validateServer(typeof raw.server === 'string' ? raw.server : '');
  if (!server.ok) issues.push({ code: server.code, field: 'server', message: server.message });

  const port = validatePort(typeof raw.port === 'number' ? raw.port : String(raw.port ?? ''));
  if (!port.ok) issues.push({ code: port.code, field: 'port', message: port.message });

  const secret = validateSecret(typeof raw.secret === 'string' ? raw.secret : '');
  if (!secret.ok) issues.push({ code: secret.code, field: 'secret', message: secret.message });

  const country = validateCountry(typeof raw.country === 'string' ? raw.country : null);
  if (!country.ok) issues.push({ code: country.code, field: 'country', message: country.message });

  const type = raw.type === undefined ? 'mtproto' : raw.type;
  if (type !== 'mtproto') {
    issues.push({ code: 'required', field: 'type', message: 'Only MTProto proxies are supported.' });
  }

  const name = typeof raw.name === 'string' ? sanitizeLabel(raw.name) : '';
  if (!name) {
    issues.push({ code: 'required', field: 'name', message: 'Name is required.' });
  }

  const sourceId = typeof raw.sourceId === 'string' ? raw.sourceId : '';
  if (!SOURCE_ID.test(sourceId)) {
    issues.push({ code: 'source.invalid', field: 'sourceId', message: 'Invalid source id.' });
  }

  const trust = raw.trust;
  if (typeof trust !== 'string' || !TRUST_LEVELS.includes(trust as TrustLevel)) {
    issues.push({ code: 'trust.invalid', field: 'trust', message: 'Invalid trust level.' });
  }

  const status = raw.status === undefined ? 'unknown' : raw.status;
  if (!isStatus(status)) {
    issues.push({ code: 'status.invalid', field: 'status', message: 'Invalid status.' });
  }

  const requireId = options.requireId ?? true;
  const id = raw.id;
  if (requireId && (typeof id !== 'string' || !ID.test(id))) {
    issues.push({ code: 'id.invalid', field: 'id', message: 'Invalid proxy id.' });
  }

  if (raw.lastChecked !== null && raw.lastChecked !== undefined && !isValidTimestamp(raw.lastChecked)) {
    issues.push({
      code: 'timestamp.invalid',
      field: 'lastChecked',
      message: 'lastChecked must be an ISO UTC timestamp.',
    });
  }
  if (raw.lastOnline !== null && raw.lastOnline !== undefined && !isValidTimestamp(raw.lastOnline)) {
    issues.push({
      code: 'timestamp.invalid',
      field: 'lastOnline',
      message: 'lastOnline must be an ISO UTC timestamp.',
    });
  }
  if (options.requireTimestamps && raw.lastChecked === undefined) {
    issues.push({
      code: 'timestamp.invalid',
      field: 'lastChecked',
      message: 'lastChecked is required.',
    });
  }

  if (issues.length > 0) return { ok: false, issues };
  if (!server.ok || !port.ok || !secret.ok || !country.ok) {
    return { ok: false, issues };
  }

  const latencyMs =
    typeof raw.latencyMs === 'number' && Number.isFinite(raw.latencyMs) && raw.latencyMs >= 0
      ? Math.round(raw.latencyMs)
      : null;
  const failures =
    typeof raw.consecutiveFailures === 'number' &&
    Number.isFinite(raw.consecutiveFailures) &&
    raw.consecutiveFailures >= 0
      ? Math.floor(raw.consecutiveFailures)
      : 0;
  const createdAt = isValidTimestamp(raw.createdAt) ? raw.createdAt : new Date(0).toISOString();

  return {
    ok: true,
    value: {
      id: typeof id === 'string' ? id : '',
      name,
      type: 'mtproto',
      server: server.value,
      port: port.value,
      secret: secret.value,
      country: country.value,
      sourceId,
      trust: trust as TrustLevel,
      status: status as ProxyStatus,
      latencyMs,
      lastChecked: isValidTimestamp(raw.lastChecked) ? raw.lastChecked : null,
      lastOnline: isValidTimestamp(raw.lastOnline) ? raw.lastOnline : null,
      consecutiveFailures: failures,
      history: sanitizeHistory(raw.history),
      createdAt,
      notes: typeof raw.notes === 'string' ? sanitizeLabel(raw.notes, 280) || null : null,
    },
  };
}

export interface ParsedDataset {
  dataset: ProxyDataset;
  issues: ValidationIssue[];
  skipped: number;
}

/**
 * Parses the public JSON database. Invalid records are skipped and reported
 * instead of being rendered. An entirely invalid file is rejected.
 */
export function parseProxyDataset(raw: unknown): ParsedDataset {
  const issues: ValidationIssue[] = [];
  if (!raw || typeof raw !== 'object') {
    return {
      dataset: { schemaVersion: 1, lastUpdated: null, proxies: [] },
      issues: [{ code: 'dataset.schema', message: 'Database must be an object.' }],
      skipped: 0,
    };
  }
  const root = raw as Record<string, unknown>;
  if (root.schemaVersion !== 1) {
    issues.push({
      code: 'dataset.schema',
      message: 'Unsupported database schema version.',
    });
  }
  if (!Array.isArray(root.proxies)) {
    issues.push({ code: 'dataset.schema', message: 'Database must include a proxies array.' });
    return {
      dataset: { schemaVersion: 1, lastUpdated: null, proxies: [] },
      issues,
      skipped: 0,
    };
  }

  const lastUpdated = isValidTimestamp(root.lastUpdated) ? root.lastUpdated : null;
  if (root.lastUpdated != null && lastUpdated === null) {
    issues.push({ code: 'timestamp.invalid', message: 'lastUpdated is not a valid UTC timestamp.' });
  }

  const proxies: ProxyRecord[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  root.proxies.slice(0, 2000).forEach((entry, index) => {
    const result = validateProxyRecord(entry);
    if (!result.ok) {
      skipped += 1;
      result.issues.forEach((issue) => issues.push({ ...issue, index }));
      return;
    }
    const key = proxyKey(result.value);
    if (seen.has(key)) {
      skipped += 1;
      issues.push({
        code: 'duplicate',
        message: 'Duplicate proxy skipped.',
        index,
      });
      return;
    }
    seen.add(key);
    proxies.push(result.value);
  });

  return { dataset: { schemaVersion: 1, lastUpdated, proxies }, issues, skipped };
}

/** Returns duplicate pairs inside a list of candidate proxies. */
export function findDuplicates(
  proxies: Array<Pick<ProxyRecord, 'server' | 'port' | 'secret'>>,
): number[] {
  const seen = new Map<string, number>();
  const duplicates: number[] = [];
  proxies.forEach((proxy, index) => {
    const key = proxyKey(proxy);
    if (seen.has(key)) duplicates.push(index);
    else seen.set(key, index);
  });
  return duplicates;
}

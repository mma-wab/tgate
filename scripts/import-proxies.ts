import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  proxyKey,
  sanitizeLabel,
  validateCountry,
  validatePort,
  validateProxyRecord,
  validateSecret,
  validateServer,
} from '../src/lib/validation';
import type { ProxyDataset, SourceDataset } from '../src/types/proxy';

const root = resolve(import.meta.dirname, '..');
const dataset = JSON.parse(readFileSync(resolve(root, 'data/proxies.json'), 'utf8')) as ProxyDataset;
const sources = JSON.parse(readFileSync(resolve(root, 'data/sources.json'), 'utf8')) as SourceDataset;

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

const file = arg('file');
const sourceId = arg('source');
if (!file || !sourceId) {
  console.error(
    'Usage: npm run sources:import -- --file path/to/candidates.json --source <source-id>\n' +
      'The candidates file is an array of { server, port, secret, name?, country?, sourceUrl?, note? }.\n' +
      'Imported entries are written to data/candidates.json for manual review; nothing is published.',
  );
  process.exit(1);
}

if (!sources.sources.some((source) => source.id === sourceId)) {
  console.error(`Unknown source "${sourceId}". Add it to data/sources.json before importing.`);
  process.exit(1);
}

let input: unknown;
try {
  input = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
} catch (error) {
  console.error(`Cannot read ${file}: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const list = Array.isArray(input)
  ? input
  : input && typeof input === 'object' && Array.isArray((input as { proxies?: unknown }).proxies)
    ? ((input as { proxies: unknown[] }).proxies)
    : null;

if (!list) {
  console.error('The candidates file must be an array, or an object with a proxies array.');
  process.exit(1);
}

const existingKeys = new Set(dataset.proxies.map((proxy) => proxyKey(proxy)));
const seen = new Set<string>();
const accepted: Array<Record<string, unknown>> = [];
const rejected: Array<{ index: number; reasons: string[] }> = [];

list.forEach((entry, index) => {
  if (!entry || typeof entry !== 'object') {
    rejected.push({ index, reasons: ['Not an object.'] });
    return;
  }
  const raw = entry as Record<string, unknown>;
  const reasons: string[] = [];

  const server = validateServer(typeof raw.server === 'string' ? raw.server : '');
  if (!server.ok) reasons.push(`server: ${server.message}`);
  const port = validatePort(typeof raw.port === 'number' ? raw.port : String(raw.port ?? ''));
  if (!port.ok) reasons.push(`port: ${port.message}`);
  const secret = validateSecret(typeof raw.secret === 'string' ? raw.secret : '');
  if (!secret.ok) reasons.push(`secret: ${secret.message}`);
  const country = validateCountry(typeof raw.country === 'string' ? raw.country : null);
  if (!country.ok) reasons.push(`country: ${country.message}`);

  if (server.ok && port.ok && secret.ok) {
    const key = proxyKey({ server: server.value, port: port.value, secret: secret.value });
    if (existingKeys.has(key)) reasons.push('duplicate: already published');
    else if (seen.has(key)) reasons.push('duplicate: repeated in this import');
    else seen.add(key);
  }

  if (reasons.length > 0) {
    rejected.push({ index, reasons });
    return;
  }

  const candidate = {
    server: server.ok ? server.value : '',
    port: port.ok ? port.value : 0,
    secret: secret.ok ? secret.value : '',
    name: sanitizeLabel(typeof raw.name === 'string' ? raw.name : '', 60) || null,
    country: country.ok ? country.value : null,
    sourceUrl: typeof raw.sourceUrl === 'string' && raw.sourceUrl.startsWith('https://') ? raw.sourceUrl : null,
    note: sanitizeLabel(typeof raw.note === 'string' ? raw.note : '', 280) || null,
    sourceId,
    reviewerStatus: 'pending-review',
    importedAt: new Date().toISOString(),
  };

  const shape = validateProxyRecord(
    {
      ...candidate,
      id: 'candidate-check',
      type: 'mtproto',
      trust: 'unverified',
      status: 'unknown',
      latencyMs: null,
      lastChecked: null,
      lastOnline: null,
      consecutiveFailures: 0,
      history: [],
      createdAt: candidate.importedAt,
      notes: candidate.note,
    },
    { requireId: true },
  );
  if (!shape.ok) {
    rejected.push({ index, reasons: shape.issues.map((issue) => `${issue.field ?? 'record'}: ${issue.code}`) });
    return;
  }
  accepted.push(candidate);
});

const outputPath = resolve(root, 'data/candidates.json');
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceId,
      published: false,
      note: 'Review queue only. Nothing here is served to the public site.',
      accepted,
      rejected,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(`[sources:import] ${accepted.length} candidate(s) queued, ${rejected.length} rejected.`);
console.log(`[sources:import] Wrote data/candidates.json (gitignored). Nothing was published.`);
console.log('[sources:import] Review each candidate, then use `npm run proxies:add` only for verified entries.');
if (rejected.length > 0) {
  console.log('Rejected indexes:', rejected.map((item) => item.index).join(', '));
}

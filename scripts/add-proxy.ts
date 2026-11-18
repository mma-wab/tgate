import { randomBytes } from 'node:crypto';
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
import type { ProxyDataset, SourceDataset, TrustLevel } from '../src/types/proxy';

const root = resolve(import.meta.dirname, '..');
const datasetPath = resolve(root, 'data/proxies.json');
const sourcesPath = resolve(root, 'data/sources.json');

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

function fail(message: string): never {
  console.error(`\n[proxies:add] ${message}\n`);
  console.error(
    'Usage:\n  npm run proxies:add -- --server host --port 443 --secret <hex> --source <source-id> [--name "Label"] [--country DE] [--trust trusted-source|community|unverified] [--notes "..."]\n',
  );
  process.exit(1);
}

const sources = JSON.parse(readFileSync(sourcesPath, 'utf8')) as SourceDataset;
const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as ProxyDataset;

const sourceId = arg('source')?.trim();
if (!sourceId) fail('--source is required. Add the source to data/sources.json first.');
if (!sources.sources.some((source) => source.id === sourceId)) {
  fail(`Unknown source "${sourceId}". Add it to data/sources.json and document its terms before importing.`);
}

const serverInput = arg('server') ?? '';
const portInput = arg('port') ?? '';
const secretInput = arg('secret') ?? '';

const server = validateServer(serverInput);
if (!server.ok) fail(`Server: ${server.message}`);
const port = validatePort(portInput);
if (!port.ok) fail(`Port: ${port.message}`);
const secret = validateSecret(secretInput);
if (!secret.ok) fail(`Secret: ${secret.message}`);
const country = validateCountry(arg('country'));
if (!country.ok) fail(`Country: ${country.message}`);

const trustInput = arg('trust') ?? 'unverified';
const allowedTrust: TrustLevel[] = ['trusted-source', 'community', 'unverified'];
if (!allowedTrust.includes(trustInput as TrustLevel)) fail('--trust must be trusted-source, community, or unverified.');

const key = proxyKey({ server: server.value, port: port.value, secret: secret.value });
if (dataset.proxies.some((proxy) => proxyKey(proxy) === key)) {
  fail('This proxy already exists in data/proxies.json.');
}

const name = sanitizeLabel(arg('name') ?? server.value, 60) || server.value;
const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40);
const id = `${slug || 'proxy'}-${randomBytes(3).toString('hex')}`;
const now = new Date().toISOString();

const record = {
  id,
  name,
  type: 'mtproto',
  server: server.value,
  port: port.value,
  secret: secret.value,
  country: country.value,
  sourceId,
  trust: trustInput,
  status: 'unknown',
  latencyMs: null,
  lastChecked: null,
  lastOnline: null,
  consecutiveFailures: 0,
  history: [],
  createdAt: now,
  notes: sanitizeLabel(arg('notes') ?? '', 280) || null,
};

const validated = validateProxyRecord(record);
if (!validated.ok) {
  console.error('[proxies:add] The record failed validation:');
  validated.issues.forEach((issue) => console.error(`  - ${issue.code} [${issue.field ?? '-'}] ${issue.message}`));
  process.exit(1);
}

const next: ProxyDataset = {
  schemaVersion: 1,
  lastUpdated: now,
  proxies: [...dataset.proxies, validated.value],
};
writeFileSync(datasetPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');

console.log(`[proxies:add] Added "${name}" (${id}) as ${trustInput}.`);
console.log('Next: run `npm run validate:proxies` and `npm run monitor:proxies` before committing.');

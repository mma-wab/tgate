import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseProxyDataset } from '../src/lib/validation';

const root = resolve(import.meta.dirname, '..');
const path = resolve(root, 'data/proxies.json');

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(path, 'utf8'));
} catch (error) {
  console.error(`Cannot parse data/proxies.json: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const parsed = parseProxyDataset(raw);

if (parsed.issues.length > 0) {
  console.error(`Invalid proxy data: ${parsed.issues.length} issue(s), ${parsed.skipped} record(s) skipped.`);
  parsed.issues.slice(0, 25).forEach((issue) => {
    const index = issue.index === undefined ? '' : `record ${issue.index}: `;
    console.error(`  - ${index}${issue.code}${issue.field ? ` [${issue.field}]` : ''} — ${issue.message}`);
  });
  process.exit(1);
}

const online = parsed.dataset.proxies.filter((proxy) => proxy.status === 'online').length;
console.log(
  `Valid dataset: schema v${parsed.dataset.schemaVersion}, ${parsed.dataset.proxies.length} proxies, ${online} online, lastUpdated=${parsed.dataset.lastUpdated ?? 'never'}.`,
);

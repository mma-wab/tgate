import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseProxyDataset } from '../src/lib/validation';
import { parseTopProxyDataset } from '../src/lib/top-proxies';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'data/proxies.json');
const topSourcePath = resolve(root, 'data/top-proxies.json');
const outputDir = resolve(root, 'public/data');
const outputPath = resolve(outputDir, 'proxies.json');
const topOutputPath = resolve(outputDir, 'top-proxies.json');

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(sourcePath, 'utf8'));
} catch (error) {
  console.error(`[data:sync] Cannot read ${sourcePath}:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

const parsed = parseProxyDataset(raw);
if (parsed.issues.length > 0) {
  console.error(`[data:sync] Refusing to publish invalid data (${parsed.issues.length} issue(s)):`);
  parsed.issues.slice(0, 10).forEach((issue) => {
    console.error(`  - ${issue.code}${issue.field ? ` (${issue.field})` : ''}: ${issue.message}`);
  });
  process.exit(1);
}

let rawTop: unknown;
try {
  rawTop = JSON.parse(readFileSync(topSourcePath, 'utf8'));
} catch (error) {
  console.error(
    `[data:sync] Cannot read ${topSourcePath}:`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}

const parsedTop = parseTopProxyDataset(rawTop);
if (parsedTop.issues.length > 0) {
  console.error(
    `[data:sync] Refusing to publish invalid featured data (${parsedTop.issues.length} issue(s)):`,
  );
  parsedTop.issues.slice(0, 10).forEach((issue) => {
    console.error(`  - ${issue.code}${issue.field ? ` (${issue.field})` : ''}: ${issue.message}`);
  });
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(parsed.dataset, null, 2)}\n`, 'utf8');
writeFileSync(topOutputPath, `${JSON.stringify(parsedTop.dataset, null, 2)}\n`, 'utf8');
console.log(
  `[data:sync] Published ${parsed.dataset.proxies.length} proxies to public/data/proxies.json`,
);
console.log(
  `[data:sync] Published ${parsedTop.dataset.proxies.length} featured proxies to public/data/top-proxies.json`,
);

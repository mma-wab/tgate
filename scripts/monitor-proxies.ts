import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseProxyDataset } from '../src/lib/validation';
import type { CheckHistoryEntry, ProxyDataset, ProxyRecord, ProxyStatus } from '../src/types/proxy';
import { mapWithConcurrency } from './lib/concurrency';
import { probeMtproto, type ProbeOutcome } from './lib/mtproto-probe';

/**
 * MTProto-aware availability monitor.
 *
 * Each approved endpoint receives one obfuscated2 handshake and an unencrypted
 * `req_pq_multi`. Only a valid `resPQ` with the matching nonce is treated as
 * ONLINE. Network failures become OFFLINE/TIMEOUT after the configured failure
 * threshold; anything we cannot confirm is UNKNOWN, never ONLINE.
 *
 * Fake-TLS secrets (`ee…`) are verified through an emulated TLS ClientHello,
 * a validated ServerHello HMAC and the same obfuscated2 exchange. Anything that
 * cannot be confirmed is UNKNOWN rather than guessed.
 */

const root = resolve(import.meta.dirname, '..');
const datasetPath = resolve(root, 'data/proxies.json');
const dryRun = process.argv.includes('--dry-run');

function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

const TIMEOUT_MS = envInt('PROXY_MONITOR_TIMEOUT_MS', 8000, 1500, 30_000);
const CONCURRENCY = envInt('PROXY_MONITOR_CONCURRENCY', 4, 1, 10);
const FAILURE_THRESHOLD = envInt('PROXY_MONITOR_FAILURE_THRESHOLD', 2, 1, 10);

/**
 * The failure threshold applies to the current streak. Failures are recorded in
 * history immediately; the visible status becomes OFFLINE/TIMEOUT only once the
 * streak reaches the threshold. Before that it is UNKNOWN, never ONLINE.
 */
function failureStatus(proxy: ProxyRecord, outcome: ProbeOutcome): ProxyStatus {
  if (outcome.kind === 'unknown') return 'unknown';
  const failures = proxy.consecutiveFailures + 1;
  if (failures < FAILURE_THRESHOLD) return 'unknown';
  return outcome.kind === 'timeout' ? 'timeout' : 'offline';
}

const probe = (proxy: ProxyRecord): Promise<ProbeOutcome> => probeMtproto(proxy, TIMEOUT_MS);


async function main(): Promise<void> {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(datasetPath, 'utf8'));
  } catch (error) {
    console.error(`Cannot read data/proxies.json: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  const parsed = parseProxyDataset(raw);
  if (parsed.issues.length > 0) {
    console.error(`Refusing to monitor invalid data (${parsed.issues.length} issue(s)). Run validate:proxies.`);
    process.exit(1);
  }

  const before = parsed.dataset;
  if (before.proxies.length === 0) {
    console.log('[monitor] No approved proxies to check. Nothing written.');
    return;
  }

  console.log(
    `[monitor] Checking ${before.proxies.length} endpoint(s) · timeout ${TIMEOUT_MS}ms · concurrency ${CONCURRENCY} · failure threshold ${FAILURE_THRESHOLD}`,
  );

  const outcomes = await mapWithConcurrency(before.proxies, CONCURRENCY, probe);
  const checkedAt = new Date().toISOString();
  const changed: Array<{ proxy: ProxyRecord; outcome: ProbeOutcome; status: ProxyStatus }> = [];

  const proxies = before.proxies.map((proxy, index) => {
    const outcome = outcomes[index] ?? { kind: 'unknown' as const, reason: 'no result' };
    let status: ProxyStatus;
    let consecutiveFailures = proxy.consecutiveFailures;
    let latencyMs: number | null = null;
    let lastOnline = proxy.lastOnline;

    if (outcome.kind === 'online') {
      status = 'online';
      consecutiveFailures = 0;
      latencyMs = outcome.latencyMs;
      lastOnline = checkedAt;
    } else if (outcome.kind === 'unknown') {
      status = 'unknown';
    } else {
      consecutiveFailures = proxy.consecutiveFailures + 1;
      status = failureStatus(proxy, outcome);
    }

    const entry: CheckHistoryEntry = {
      at: checkedAt,
      status,
      latencyMs,
      method: 'mtproto',
    };
    const history = [...proxy.history, entry].slice(-48);

    changed.push({ proxy, outcome, status });
    return {
      ...proxy,
      status,
      latencyMs,
      consecutiveFailures,
      lastChecked: checkedAt,
      lastOnline,
      history,
    };
  });

  const summary = changed.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
    return accumulator;
  }, {});

  changed.forEach(({ proxy, outcome }) => {
    const detail =
      outcome.kind === 'online'
        ? `${outcome.latencyMs}ms`
        : outcome.kind === 'unknown'
          ? `unknown: ${outcome.reason}`
          : `${outcome.kind}: ${outcome.reason}`;
    console.log(`  ${proxy.server}:${proxy.port} → ${outcome.kind === 'online' ? 'ONLINE' : detail}`);
  });

  console.log(`[monitor] Summary: ${JSON.stringify(summary)}`);

  const next: ProxyDataset = { schemaVersion: 1, lastUpdated: checkedAt, proxies };

  if (dryRun) {
    console.log('[monitor] --dry-run: data/proxies.json was not modified.');
    return;
  }

  writeFileSync(datasetPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log('[monitor] Wrote data/proxies.json.');
}

void main();

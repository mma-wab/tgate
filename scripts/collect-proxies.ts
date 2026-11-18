import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  CollectorConfig,
  FeaturedProxyRecord,
  TopProxyDataset,
} from '../src/types/top-proxy';
import {
  emptyTopDataset,
  isEligibleVerification,
  mergeCandidates,
  parseProxyFeed,
  parseTopProxyDataset,
  rankTopProxies,
  type MergedCandidate,
  type ParsedCandidate,
  type RankableVerification,
} from '../src/lib/top-proxies';
import { proxyKey } from '../src/lib/validation';
import { writeJsonAtomic } from './lib/atomic-write';
import { CollectorConfigError, loadCollectorConfig } from './lib/collector-config';
import {
  applyVerification,
  loadCollectorState,
  pruneCollectorState,
  proxyIdFor,
  rankableFromState,
  saveCollectorState,
  type CollectorExclusionState,
  type CollectorState,
  type VerificationAttemptInput,
} from './lib/collector-state';
import { mapWithConcurrency } from './lib/concurrency';
import { fetchFeedText, type FetchResult } from './lib/fetch-feed';
import { resolvePublicAddress } from './lib/network-guard';
import { probeMtproto, type ProbeOutcome } from './lib/mtproto-probe';

/**
 * Automated collector for the featured MTProto proxy list.
 *
 * Steps: fetch allowlisted feeds -> parse/validate -> deduplicate -> genuine
 * MTProto verification -> rank -> atomically publish the top list. The previous
 * valid database and state are preserved when a run cannot complete safely.
 *
 * Secrets are public invite credentials, but they are never logged. Only proxy
 * ids and host:port pairs appear in output.
 */

const root = resolve(import.meta.dirname, '..');
const topPath = resolve(root, 'data/top-proxies.json');
const statePath = resolve(root, 'data/collector-state.json');
const cacheDir = resolve(root, '.cache/collector');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
let configPath = resolve(root, 'config/collector.json');
const configFlag = args.indexOf('--config');
if (configFlag !== -1) {
  const value = args[configFlag + 1];
  if (!value) {
    console.error('[collect] --config requires a path.');
    process.exitCode = 1;
    process.exit();
  }
  configPath = resolve(root, value);
}

interface FeedTask {
  sourceId: string;
  priority: number;
  url: string;
}

interface CandidateVerification {
  candidate: MergedCandidate;
  outcomes: ProbeOutcome[];
}

function readPreviousDataset(path: string): TopProxyDataset | null {
  if (!existsSync(path)) return null;
  try {
    const parsed = parseTopProxyDataset(JSON.parse(readFileSync(path, 'utf8')) as unknown);
    if (parsed.issues.length > 0) {
      console.warn(
        `[collect] Previous top-proxies.json has ${parsed.issues.length} validation issue(s); it will only be replaced by a valid dataset.`,
      );
      return null;
    }
    return parsed.dataset;
  } catch (error) {
    console.warn(
      `[collect] Could not read the previous database: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    return null;
  }
}

function outcomeLabel(outcomes: ProbeOutcome[]): string {
  const counts = { online: 0, offline: 0, timeout: 0, unknown: 0 };
  outcomes.forEach((outcome) => {
    counts[outcome.kind] += 1;
  });
  const latencies = outcomes
    .filter((outcome): outcome is Extract<ProbeOutcome, { kind: 'online' }> => outcome.kind === 'online')
    .map((outcome) => outcome.latencyMs)
    .sort((a, b) => a - b);
  const median =
    latencies.length === 0
      ? null
      : latencies.length % 2 === 1
        ? latencies[Math.floor(latencies.length / 2)] ?? null
        : ((latencies[latencies.length / 2 - 1] ?? 0) + (latencies[latencies.length / 2] ?? 0)) / 2;
  const latency = median === null ? '' : ` · median ${Math.round(median)}ms`;
  return `${counts.online}/${outcomes.length} online${latency} · offline ${counts.offline} · timeout ${counts.timeout} · unknown ${counts.unknown}`;
}

async function main(): Promise<number> {
  let config: CollectorConfig;
  try {
    config = loadCollectorConfig(configPath);
  } catch (error) {
    if (error instanceof CollectorConfigError) {
      console.error(error.message);
    } else {
      console.error(`[collect] Cannot load configuration: ${error instanceof Error ? error.message : error}`);
    }
    return 1;
  }

  const enabledSources = config.sources.filter((source) => source.enabled);
  const sourceLabels: Record<string, string> = {};
  enabledSources.forEach((source) => {
    sourceLabels[source.id] = source.name;
  });
  const envRegion = process.env.COLLECTOR_RUNNER_REGION?.trim();
  const runnerRegion =
    envRegion && /^[A-Za-z0-9 ._-]{1,40}$/.test(envRegion) ? envRegion : config.runnerRegion;

  console.log(
    `[collect] ${enabledSources.length} source(s) · max ${config.maxCandidates} candidates · ${config.verificationAttempts} attempt(s) per endpoint · region ${runnerRegion}${dryRun ? ' · dry run' : ''}`,
  );

  const previous = readPreviousDataset(topPath);
  const state = loadCollectorState(statePath, {
    onWarning: (message) => console.warn(`[collect] ${message}`),
  });

  const tasks: FeedTask[] = [];
  enabledSources.forEach((source) => {
    source.feeds.forEach((feed) => {
      tasks.push({ sourceId: source.id, priority: feed.priority, url: feed.url });
    });
  });

  const feedPromises = new Map<string, Promise<FetchResult>>();
  const fetchOnce = (url: string): Promise<FetchResult> => {
    const existing = feedPromises.get(url);
    if (existing) return existing;
    const promise = fetchFeedText(url, {
      allowedHosts: config.allowedHosts,
      timeoutMs: Math.max(15_000, config.timeoutMs),
      maxBytes: config.maxResponseBytes,
      cacheDir,
    });
    feedPromises.set(url, promise);
    return promise;
  };

  const feedOutcomes = await mapWithConcurrency(tasks, config.concurrency, async (task) => ({
    task,
    result: await fetchOnce(task.url),
  }));

  const parsedCandidates: ParsedCandidate[] = [];
  let successfulFeeds = 0;
  let rejected = 0;
  let duplicates = 0;
  let downloadedBytes = 0;
  const rejectionReasons: Record<string, number> = {};

  feedOutcomes.forEach(({ task, result }) => {
    if (!result.ok) {
      console.warn(`[collect] Source "${task.sourceId}" unavailable: ${result.reason}`);
      return;
    }
    successfulFeeds += 1;
    downloadedBytes += result.bytes;
    const parsed = parseProxyFeed(result.text, {
      sourceId: task.sourceId,
      priority: task.priority,
    });
    parsedCandidates.push(...parsed.candidates);
    rejected += parsed.rejected;
    duplicates += parsed.duplicates;
    Object.entries(parsed.rejectedReasons).forEach(([code, count]) => {
      rejectionReasons[code] = (rejectionReasons[code] ?? 0) + count;
    });
    console.log(
      `[collect] ${task.sourceId}: ${parsed.candidates.length} valid · ${parsed.rejected} rejected · ${parsed.duplicates} duplicate(s) · ${result.cached ? 'not modified upstream' : `${result.bytes} bytes`}`,
    );
  });

  if (successfulFeeds === 0) {
    console.error('[collect] Every configured source failed. The previous database was kept.');
    return 1;
  }

  const merged = mergeCandidates(parsedCandidates);
  const discoveredCount = merged.length;
  const previousProxies = previous?.proxies ?? [];
  const previousKeys = new Set(previousProxies.map((proxy) => proxyKey(proxy)));
  const mergedByKey = new Map(merged.map((candidate) => [candidate.key, candidate] as const));

  previousProxies.forEach((proxy) => {
    const key = proxyKey(proxy);
    const existing = mergedByKey.get(key);
    if (existing) {
      const sources = [...new Set([...existing.sources, ...proxy.sources])].sort();
      existing.sources = sources;
      existing.sourceCount = sources.length;
      existing.priority = Math.max(existing.priority, 5);
      if (!existing.country) existing.country = proxy.country;
      return;
    }
    const restored: MergedCandidate = {
      server: proxy.server,
      port: proxy.port,
      secret: proxy.secret,
      key,
      sources: [...new Set(proxy.sources)].sort(),
      sourceCount: new Set(proxy.sources).size,
      priority: 5,
      country: proxy.country,
    };
    merged.push(restored);
    mergedByKey.set(key, restored);
  });

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const staticExclusions = new Set(config.exclusions.map((exclusion) => exclusion.server));
  const activeExclusionIds = new Set(
    state.exclusions.filter((exclusion) => Date.parse(exclusion.until) > now).map((exclusion) => exclusion.id),
  );

  const available = merged.filter(
    (candidate) =>
      !staticExclusions.has(candidate.server) && !activeExclusionIds.has(proxyIdFor(candidate)),
  );
  // Feed order carries the upstream curator's own ranking (best-first lists),
  // so it is a better tie-breaker than a hash when priorities are equal.
  const feedOrder = new Map(merged.map((candidate, index) => [candidate.key, index] as const));
  available.sort((a, b) => {
    const aPrevious = previousKeys.has(a.key) ? 1 : 0;
    const bPrevious = previousKeys.has(b.key) ? 1 : 0;
    if (aPrevious !== bPrevious) return bPrevious - aPrevious;
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.sourceCount !== b.sourceCount) return b.sourceCount - a.sourceCount;
    const order = (feedOrder.get(a.key) ?? 0) - (feedOrder.get(b.key) ?? 0);
    return order !== 0 ? order : a.key.localeCompare(b.key);
  });
  // Sample across sources instead of letting the largest feed fill every slot.
  // This keeps verification honest: one source cannot drown out the others.
  const perSourceCap = Math.max(
    1,
    Math.ceil(config.maxCandidates / Math.max(1, enabledSources.length)),
  );
  const selected: MergedCandidate[] = [];
  const selectedKeys = new Set<string>();
  const perSource = new Map<string, number>();
  for (const candidate of available) {
    if (selected.length >= config.maxCandidates) break;
    const source = candidate.sources[0] ?? 'unknown';
    const used = perSource.get(source) ?? 0;
    if (used >= perSourceCap) continue;
    selected.push(candidate);
    selectedKeys.add(candidate.key);
    perSource.set(source, used + 1);
  }
  if (selected.length < config.maxCandidates) {
    for (const candidate of available) {
      if (selected.length >= config.maxCandidates) break;
      if (selectedKeys.has(candidate.key)) continue;
      selected.push(candidate);
      selectedKeys.add(candidate.key);
    }
  }
  const selectionSummary = [...perSource.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, count]) => `${source}:${count}`)
    .join(', ');

  console.log(
    `[collect] ${discoveredCount} discovered · ${duplicates} in-feed duplicate(s) · ${rejected} rejected · ${available.length} eligible for probing (${selected.length} selected${selectionSummary ? ` · ${selectionSummary}` : ''})${Object.keys(rejectionReasons).length > 0 ? ` · reasons ${JSON.stringify(rejectionReasons)}` : ''}${downloadedBytes > 0 ? ` · ${downloadedBytes} bytes fetched` : ''}`,
  );

  if (merged.length === 0) {
    if (previousProxies.length > 0) {
      console.error('[collect] No proxies could be read from any source. The previous database was kept.');
      return 1;
    }
    const dataset = emptyTopDataset(sourceLabels, enabledSources.length, config.maximumDataAgeMinutes);
    dataset.updatedAt = nowIso;
    dataset.totalDiscovered = 0;
    if (!dryRun) {
      writeJsonAtomic(topPath, dataset);
      const nextState: CollectorState = {
        schemaVersion: 1,
        updatedAt: nowIso,
        endpoints: [...state.endpoints],
        exclusions: [...state.exclusions],
      };
      saveCollectorState(statePath, nextState);
    }
    console.log('[collect] Sources returned no proxies; published an empty, clearly labelled database.');
    return 0;
  }

  const verifyCandidate = async (candidate: MergedCandidate): Promise<CandidateVerification> => {
    let address: string;
    try {
      address = await resolvePublicAddress(candidate.server);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unresolvable target';
      return {
        candidate,
        outcomes: Array.from({ length: config.verificationAttempts }, (): ProbeOutcome => ({
          kind: 'offline',
          reason,
        })),
      };
    }
    const outcomes: ProbeOutcome[] = [];
    for (let attempt = 0; attempt < config.verificationAttempts; attempt += 1) {
      outcomes.push(
        await probeMtproto(
          {
            server: candidate.server,
            port: candidate.port,
            secret: candidate.secret,
            address,
          },
          config.timeoutMs,
        ),
      );
    }
    return { candidate, outcomes };
  };

  const verifications = await mapWithConcurrency(selected, config.concurrency, async (candidate) => {
    const result = await verifyCandidate(candidate);
    console.log(
      `[collect] ${proxyIdFor(candidate)} ${candidate.server}:${candidate.port} → ${outcomeLabel(result.outcomes)}`,
    );
    return result;
  });

  const currentSuccesses = verifications.reduce(
    (total, verification) =>
      total + verification.outcomes.filter((outcome) => outcome.kind === 'online').length,
    0,
  );

  if (selected.length >= 3 && currentSuccesses === 0) {
    console.error(
      '[collect] No endpoint completed an MTProto handshake. This looks like a runner or upstream outage, so the previous database and state were left untouched.',
    );
    return 1;
  }

  const stateById = new Map(state.endpoints.map((endpoint) => [endpoint.id, endpoint] as const));
  const exclusionsById = new Map(
    state.exclusions.map((exclusion) => [exclusion.id, exclusion] as const),
  );
  const eligible: RankableVerification[] = [];

  verifications.forEach(({ candidate, outcomes }) => {
    const id = proxyIdFor(candidate);
    const attempts: VerificationAttemptInput[] = outcomes.map((outcome) => {
      if (outcome.kind === 'online') return { result: 'success', latencyMs: outcome.latencyMs };
      if (outcome.kind === 'unknown') return { result: 'unknown', latencyMs: null };
      if (outcome.kind === 'timeout') return { result: 'timeout', latencyMs: null };
      return { result: 'failure', latencyMs: null };
    });
    const { endpoint, excluded } = applyVerification(
      stateById.get(id) ?? null,
      {
        server: candidate.server,
        port: candidate.port,
        secret: candidate.secret,
        sources: candidate.sources,
        country: candidate.country,
      },
      attempts,
      nowIso,
      config.failureThreshold,
    );
    stateById.set(id, endpoint);

    if (excluded) {
      const exclusion: CollectorExclusionState = {
        id,
        server: candidate.server,
        port: candidate.port,
        reason: 'repeated-failures',
        until: new Date(now + config.exclusionHours * 3_600_000).toISOString(),
      };
      exclusionsById.set(id, exclusion);
      console.warn(
        `[collect] ${id} excluded for ${config.exclusionHours}h after ${endpoint.consecutiveFailedRuns} consecutive failed run(s).`,
      );
      return;
    }

    const runSuccesses = outcomes.filter((outcome) => outcome.kind === 'online').length;
    if (runSuccesses >= config.minimumSuccessfulChecks) {
      eligible.push(rankableFromState(endpoint, runnerRegion));
    }
  });

  const rankingOptions = {
    featuredCount: config.featuredCount,
    minimumSuccessRate: config.minimumSuccessRate,
    minimumSuccessfulChecks: config.minimumSuccessfulChecks,
    maximumLatencyMs: config.maximumLatencyMs,
    maximumDataAgeMinutes: config.maximumDataAgeMinutes,
    runnerRegion,
    now,
  };
  const top: FeaturedProxyRecord[] = rankTopProxies(eligible, rankingOptions);
  const totalVerified = eligible.filter((verification) =>
    isEligibleVerification(verification, rankingOptions),
  ).length;

  const dataset: TopProxyDataset = {
    schemaVersion: 1,
    updatedAt: nowIso,
    totalSources: enabledSources.length,
    totalDiscovered: discoveredCount,
    totalVerified,
    featuredCount: top.length,
    maxAgeMinutes: config.maximumDataAgeMinutes,
    sourceLabels,
    proxies: top,
  };

  const validated = parseTopProxyDataset(dataset);
  if (validated.issues.length > 0 || validated.dataset.proxies.length !== top.length) {
    console.error(
      `[collect] Generated database failed validation (${validated.issues.length} issue(s)). The previous database was kept.`,
    );
    validated.issues.slice(0, 5).forEach((issue) => {
      console.error(`[collect]   ${issue.field ?? 'dataset'}: ${issue.message}`);
    });
    return 1;
  }

  const checkedIds = new Set(selected.map((candidate) => proxyIdFor(candidate)));
  const nextState = pruneCollectorState(
    {
      schemaVersion: 1,
      updatedAt: nowIso,
      endpoints: [...stateById.values()],
      exclusions: [...exclusionsById.values()],
    },
    {
      now,
      keepIds: new Set(top.map((proxy) => proxy.id)),
      maxAgeMinutes: config.maximumDataAgeMinutes,
    },
  );

  if (dryRun) {
    console.log(
      `[collect] Dry run: ${top.length} featured · ${totalVerified} eligible · ${checkedIds.size} checked. No files written.`,
    );
    top.forEach((proxy) => {
      console.log(`[collect]   ${String(proxy.rank).padStart(2, '0')} ${proxy.id} ${proxy.server}:${proxy.port} · ${proxy.latencyMs}ms · ${proxy.successRate}%`);
    });
    return 0;
  }

  writeJsonAtomic(topPath, dataset);
  saveCollectorState(statePath, nextState);

  console.log(
    `[collect] Published ${top.length} featured prox${top.length === 1 ? 'y' : 'ies'} · ${totalVerified} eligible · ${checkedIds.size} checked · ${nextState.exclusions.length} exclusion(s).`,
  );
  if (top.length < config.featuredCount) {
    console.warn(
      `[collect] Only ${top.length} of ${config.featuredCount} positions are filled. Missing positions are intentionally left empty.`,
    );
  }
  top.forEach((proxy) => {
    console.log(
      `[collect]   ${String(proxy.rank).padStart(2, '0')} ${proxy.id} ${proxy.server}:${proxy.port} · ${proxy.latencyMs}ms · ${proxy.successRate}%`,
    );
  });

  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`[collect] Fatal error: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });

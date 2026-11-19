import { describe, expect, it } from 'vitest';
import {
  buildFeaturedTelegramLink,
  buildFeaturedTelegramTgLink,
  isTopProxyStale,
  mergeCandidates,
  normalizeSecret,
  parseProxyFeed,
  parseTopProxyDataset,
  rankTopProxies,
  type RankableVerification,
} from '../src/lib/top-proxies';
import type { TopProxyDataset } from '../src/types/top-proxy';

const NOW = Date.parse('2026-11-17T12:00:00Z');
const HEX_1 = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const HEX_2 = 'e8da6fda391b335dff2083634c9e7db5';
const HEX_3 = 'dd4482437e89f9af8929514eee7faaf61f';
const base64url = (hex: string): string => Buffer.from(hex, 'hex').toString('base64url');

const verification = (overrides: Partial<RankableVerification> = {}): RankableVerification => ({
  server: 'relay1.proxyhub.dev',
  port: 443,
  secret: HEX_1,
  sources: ['iwizard7'],
  country: null,
  successes: 3,
  failures: 0,
  unknowns: 0,
  medianLatencyMs: 90,
  verifiedAt: '2026-11-17T11:55:00Z',
  lastFailedAt: null,
  runnerRegion: 'github-actions',
  ...overrides,
});

const rankOptions = {
  featuredCount: 12,
  minimumSuccessRate: 60,
  minimumSuccessfulChecks: 2,
  maximumLatencyMs: 3000,
  maximumDataAgeMinutes: 480,
  runnerRegion: 'github-actions',
  now: NOW,
};

describe('proxy feed parsing', () => {
  it('parses tg:// links and normalizes the host', () => {
    const result = parseProxyFeed(
      `tg://proxy?server=Relay1.ProxyHub.dev.&port=443&secret=${HEX_1}`,
      { sourceId: 'iwizard7' },
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      server: 'relay1.proxyhub.dev',
      port: 443,
      secret: HEX_1,
      sourceId: 'iwizard7',
    });
  });

  it('parses t.me links with base64url secrets into hex', () => {
    const secret = base64url(HEX_2);
    const result = parseProxyFeed(
      `https://t.me/proxy?server=edge2.proxyhub.dev&port=8443&secret=${secret}`,
      { sourceId: 'radikal' },
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.secret).toBe(HEX_2);
  });

  it('parses host:port:secret lines with standard and url-safe base64', () => {
    const secret = base64url(HEX_3);
    const result = parseProxyFeed(
      `node3.proxyhub.dev:443:${secret}\nnode4.proxyhub.dev:8443 ${secret}`,
      { sourceId: 'solispirit' },
    );
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.every((candidate) => candidate.secret === HEX_3)).toBe(true);
  });

  it('reads structured JSON feeds and keeps a validated country', () => {
    const result = parseProxyFeed(
      JSON.stringify({
        proxies: [
          { server: 'json1.proxyhub.dev', port: 443, secret: HEX_1, country: 'NL' },
          { server: 'json2.proxyhub.dev', port: '70000', secret: HEX_1 },
        ],
      }),
      { sourceId: 'iwizard7', priority: 4 },
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({ country: 'NL', priority: 4 });
    expect(result.rejected).toBe(1);
    expect(result.rejectedReasons['port.invalid']).toBe(1);
  });

  it('rejects malformed records instead of repairing them', () => {
    const result = parseProxyFeed(
      [
        'bad.proxyhub.dev:443:not-hex-or-base64!!',
        '127.0.0.1:443:' + HEX_1,
        'node.proxyhub.dev:0:' + HEX_1,
        'node.proxyhub.dev:443:abcd',
        'example.com:443:' + HEX_1,
      ].join('\n'),
      { sourceId: 'radikal' },
    );
    expect(result.candidates).toHaveLength(0);
    expect(result.rejected).toBeGreaterThanOrEqual(4);
  });

  it('normalizes hex and base64 representations of the same secret', () => {
    expect(normalizeSecret(HEX_2)).toBe(HEX_2);
    expect(normalizeSecret(base64url(HEX_2))).toBe(HEX_2);
  });
});

describe('deduplication', () => {
  it('merges the same endpoint across sources and keeps source diversity', () => {
    const a = parseProxyFeed(`tg://proxy?server=relay.proxyhub.dev&port=443&secret=${HEX_1}`, {
      sourceId: 'iwizard7',
      priority: 2,
    });
    const b = parseProxyFeed(
      `https://t.me/proxy?server=RELAY.proxyhub.dev&port=443&secret=${base64url(HEX_1)}`,
      { sourceId: 'radikal', priority: 4 },
    );
    const merged = mergeCandidates([...a.candidates, ...b.candidates]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ sourceCount: 2, priority: 4 });
    expect(merged[0]?.sources).toEqual(['iwizard7', 'radikal']);
  });
});

describe('ranking', () => {
  it('ranks verified proxies and assigns contiguous ranks', () => {
    const result = rankTopProxies(
      [
        verification({ server: 'slow.proxyhub.dev', medianLatencyMs: 900 }),
        verification({ server: 'fast.proxyhub.dev', medianLatencyMs: 40 }),
        verification({
          server: 'multi.proxyhub.dev',
          medianLatencyMs: 60,
          sources: ['iwizard7', 'radikal', 'solispirit'],
        }),
      ],
      rankOptions,
    );
    expect(result).toHaveLength(3);
    expect(result.map((proxy) => proxy.rank)).toEqual([1, 2, 3]);
    expect(result.every((proxy) => proxy.status === 'online')).toBe(true);
    expect(result[0]?.server).toBe('multi.proxyhub.dev');
  });

  it('never pads the featured list and enforces the configured limit', () => {
    const result = rankTopProxies(
      Array.from({ length: 14 }, (_, index) =>
        verification({
          server: `relay${index}.proxyhub.dev`,
          secret: Buffer.from(`${HEX_1}${index.toString(16).padStart(2, '0')}`).toString('hex'),
          medianLatencyMs: 50 + index,
        }),
      ),
      rankOptions,
    );
    expect(result).toHaveLength(12);
  });

  it('excludes low success rates, excessive latency, and stale verification', () => {
    const result = rankTopProxies(
      [
        verification({ server: 'low.proxyhub.dev', successes: 1, failures: 2 }),
        verification({ server: 'slow.proxyhub.dev', medianLatencyMs: 5000 }),
        verification({ server: 'old.proxyhub.dev', verifiedAt: '2026-11-17T01:00:00Z' }),
        verification({ server: 'good.proxyhub.dev' }),
        verification({ server: 'fake-tls.proxyhub.dev', successes: 0, failures: 0, unknowns: 3 }),
      ],
      rankOptions,
    );
    expect(result.map((proxy) => proxy.server)).toEqual(['good.proxyhub.dev']);
  });

  it('keeps a reliable proxy with one temporary failure', () => {
    const result = rankTopProxies(
      [verification({ successes: 2, failures: 1, medianLatencyMs: 120 })],
      rankOptions,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.successRate).toBeCloseTo(66.7, 1);
  });
});

describe('published dataset', () => {
  const dataset: TopProxyDataset = {
    schemaVersion: 1,
    updatedAt: '2026-11-17T11:58:00Z',
    totalSources: 3,
    totalDiscovered: 12,
    totalVerified: 5,
    featuredCount: 1,
    maxAgeMinutes: 480,
    sourceLabels: { iwizard7: 'iwizard7 MTProxy List' },
    proxies: rankTopProxies([verification()], rankOptions),
  };

  it('round-trips a valid dataset', () => {
    const parsed = parseTopProxyDataset(dataset);
    expect(parsed.issues).toHaveLength(0);
    expect(parsed.dataset.proxies).toHaveLength(1);
    expect(parsed.dataset.proxies[0]?.server).toBe('relay1.proxyhub.dev');
  });

  it('drops invalid records and insists on a valid schema', () => {
    const invalid = {
      ...dataset,
      proxies: [
        { ...dataset.proxies[0], port: 0 },
        { ...dataset.proxies[0], server: 'localhost', rank: 2 },
      ],
    };
    const parsed = parseTopProxyDataset(invalid);
    expect(parsed.dataset.proxies).toHaveLength(0);
    expect(parsed.skipped).toBe(2);

    const failed = parseTopProxyDataset({ proxies: 'nope' });
    expect(failed.dataset.proxies).toHaveLength(0);
    expect(failed.issues[0]?.code).toBe('dataset.schema');
  });

  it('drops records that were never successfully verified', () => {
    const record = dataset.proxies[0];
    expect(record).toBeDefined();
    const parsed = parseTopProxyDataset({
      ...dataset,
      proxies: [{ ...record, successfulChecks: 0, verifiedAt: null }],
    });
    expect(parsed.dataset.proxies).toHaveLength(0);
    expect(parsed.skipped).toBe(1);
  });

  it('reports stale data instead of pretending it is live', () => {
    expect(isTopProxyStale(dataset, NOW)).toBe(false);
    expect(isTopProxyStale(dataset, NOW + 9 * 60 * 60 * 1000)).toBe(true);
    expect(isTopProxyStale({ ...dataset, updatedAt: null }, NOW)).toBe(true);
  });
});

describe('buildFeaturedTelegramLink', () => {
  it('builds the official Telegram proxy link with encoded parameters', () => {
    expect(
      buildFeaturedTelegramLink({
        server: 'relay1.proxyhub.dev',
        port: 443,
        secret: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
      }),
    ).toBe(
      'https://t.me/proxy?server=relay1.proxyhub.dev&port=443&secret=a1b2c3d4e5f60718293a4b5c6d7e8f90',
    );
  });

  it('builds the direct tg:// proxy URI for direct native Telegram app launch', () => {
    expect(
      buildFeaturedTelegramTgLink({
        server: 'relay1.proxyhub.dev',
        port: 443,
        secret: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
      }),
    ).toBe(
      'tg://proxy?server=relay1.proxyhub.dev&port=443&secret=a1b2c3d4e5f60718293a4b5c6d7e8f90',
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  availableCountries,
  computeStats,
  countByStatus,
  filterProxies,
  hasActiveFilters,
  isRecent,
  matchesQuery,
} from '../src/lib/directory';
import type { DirectoryFilters, ProxyRecord } from '../src/types/proxy';

const NOW = Date.parse('2026-11-17T12:00:00Z');
const SECRET = '0123456789abcdef0123456789abcdef';

function proxy(overrides: Partial<ProxyRecord> = {}): ProxyRecord {
  return {
    id: 'proxy-test',
    name: 'Relay',
    type: 'mtproto',
    server: 'relay.example.net',
    port: 443,
    secret: SECRET,
    country: 'DE',
    sourceId: 'manual',
    trust: 'community',
    status: 'unknown',
    latencyMs: null,
    lastChecked: '2026-11-17T11:00:00Z',
    lastOnline: null,
    consecutiveFailures: 0,
    history: [],
    createdAt: '2026-11-01T00:00:00Z',
    notes: null,
    ...overrides,
  };
}

const filters = (overrides: Partial<DirectoryFilters> = {}): DirectoryFilters => ({
  ...DEFAULT_FILTERS,
  ...overrides,
});

describe('filtering', () => {
  const proxies = [
    proxy({ id: 'fast', name: 'Fast Berlin', status: 'online', latencyMs: 45, country: 'DE', trust: 'trusted-source' }),
    proxy({
      id: 'slow',
      name: 'Slow Paris',
      server: 'paris.example.net',
      status: 'online',
      latencyMs: 210,
      country: 'FR',
    }),
    proxy({ id: 'down', name: 'Down', server: 'down.example.net', status: 'offline', country: 'NL' }),
    proxy({ id: 'timeout', name: 'Timing out', server: 'timeout.example.net', status: 'timeout', country: 'DE' }),
    proxy({ id: 'unknown', name: 'New entry', server: 'new.example.net', status: 'unknown', country: 'US' }),
  ];

  it('sorts online proxies by latency, then unknowns', () => {
    const result = filterProxies(proxies, filters());
    expect(result.map((item) => item.id).slice(0, 2)).toEqual(['fast', 'slow']);
    expect(result.at(-1)?.id).toBe('unknown');
  });

  it('treats timeout as offline for filtering and counting', () => {
    expect(filterProxies(proxies, filters({ status: 'offline' })).map((item) => item.id).sort()).toEqual([
      'down',
      'timeout',
    ]);
    expect(countByStatus(proxies)).toEqual({ all: 5, online: 2, offline: 2, unknown: 1 });
  });

  it('combines country, trust and text filters', () => {
    expect(filterProxies(proxies, filters({ country: 'DE' })).map((item) => item.id)).toEqual(['fast', 'timeout']);
    expect(filterProxies(proxies, filters({ trust: 'trusted-source' })).map((item) => item.id)).toEqual(['fast']);
    expect(filterProxies(proxies, filters({ query: 'PARIS' })).map((item) => item.id)).toEqual(['slow']);
    expect(filterProxies(proxies, filters({ query: 'example.net' })).length).toBe(5);
    expect(filterProxies(proxies, filters({ query: 'manual' })).length).toBe(5);
  });

  it('filters by recency without dropping future-clock entries', () => {
    expect(isRecent(proxy({ lastChecked: '2026-11-17T11:30:00Z' }), NOW)).toBe(true);
    expect(isRecent(proxy({ lastChecked: '2026-11-15T11:30:00Z' }), NOW)).toBe(false);
    expect(isRecent(proxy({ lastChecked: null }), NOW)).toBe(false);
    expect(isRecent(proxy({ lastChecked: '2026-11-17T12:00:30Z' }), NOW)).toBe(true);
    expect(filterProxies(proxies, filters({ recentOnly: true }), NOW).length).toBe(5);
  });

  it('supports name and recent sorts', () => {
    expect(filterProxies(proxies, filters({ sort: 'name' })).map((item) => item.name)[0]).toBe('Down');
    expect(filterProxies(proxies, filters({ sort: 'recent' })).length).toBe(5);
  });

  it('matches queries against name, server, country and source', () => {
    expect(matchesQuery(proxies[0]!, 'fast berlin')).toBe(true);
    expect(matchesQuery(proxies[0]!, 'de')).toBe(true);
    expect(matchesQuery(proxies[0]!, 'nope')).toBe(false);
    expect(matchesQuery(proxies[0]!, '   ')).toBe(true);
  });

  it('detects active filters', () => {
    expect(hasActiveFilters(filters())).toBe(false);
    expect(hasActiveFilters(filters({ query: 'relay' }))).toBe(true);
    expect(hasActiveFilters(filters({ status: 'online' }))).toBe(true);
    expect(hasActiveFilters(filters({ sort: 'name' }))).toBe(false);
  });
});

describe('computeStats', () => {
  it('reports zeros for an empty dataset without inventing a rate', () => {
    expect(computeStats([], null)).toEqual({
      total: 0,
      online: 0,
      offline: 0,
      unknown: 0,
      averageLatencyMs: null,
      availabilityRate: null,
      lastUpdated: null,
      verifiedCount: 0,
    });
  });

  it('averages only measured online latency and counts verified history', () => {
    const stats = computeStats(
      [
        proxy({ status: 'online', latencyMs: 40, lastOnline: '2026-11-17T11:00:00Z' }),
        proxy({ id: 'p2', status: 'online', latencyMs: 60, lastOnline: '2026-11-16T11:00:00Z' }),
        proxy({ id: 'p3', status: 'offline', latencyMs: 10 }),
        proxy({ id: 'p4', status: 'timeout' }),
      ],
      '2026-11-17T11:00:00Z',
    );
    expect(stats.online).toBe(2);
    expect(stats.offline).toBe(2);
    expect(stats.unknown).toBe(0);
    expect(stats.averageLatencyMs).toBe(50);
    expect(stats.availabilityRate).toBe(50);
    expect(stats.verifiedCount).toBe(2);
    expect(stats.lastUpdated).toBe('2026-11-17T11:00:00Z');
  });
});

describe('availableCountries', () => {
  it('lists unique codes with localized names', () => {
    const list = availableCountries(
      [proxy({ country: 'DE' }), proxy({ id: 'p2', country: 'FR' }), proxy({ id: 'p3', country: null })],
      'en',
    );
    expect(list.map((item) => item.code)).toEqual(['FR', 'DE']);
    expect(list[1]!.label).toMatch(/Germany/i);
  });
});

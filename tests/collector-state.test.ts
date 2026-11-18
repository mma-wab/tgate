import { describe, expect, it } from 'vitest';
import {
  applyVerification,
  emptyCollectorState,
  medianLatencyOf,
  parseCollectorState,
  pruneCollectorState,
  proxyIdFor,
  rankableFromState,
  type CollectorEndpointState,
  type CollectorState,
} from '../scripts/lib/collector-state';

const NOW = Date.parse('2026-11-17T12:00:00Z');
const NOW_ISO = new Date(NOW).toISOString();
const SECRET = '0123456789abcdef0123456789abcdef';

const endpoint = (overrides: Partial<CollectorEndpointState> = {}): CollectorEndpointState => {
  const base: CollectorEndpointState = {
    id: '',
    server: 'proxy.telegram-cdn.net',
    port: 443,
    secret: SECRET,
    sources: ['iwizard7', 'radikal'],
    country: 'NL',
    attempts: [{ at: NOW_ISO, result: 'success', latencyMs: 120 }],
    consecutiveFailedRuns: 0,
    firstSeenAt: NOW_ISO,
    lastAttemptAt: NOW_ISO,
  };
  const merged = { ...base, ...overrides };
  return { ...merged, id: proxyIdFor(merged) };
};

describe('collector state', () => {
  it('derives stable proxy ids matching the published format', () => {
    const id = proxyIdFor({ server: 'proxy.telegram-cdn.net', port: 443, secret: SECRET });
    expect(id).toMatch(/^proxy-[0-9a-f]{8}$/);
    expect(proxyIdFor({ server: 'proxy.telegram-cdn.net', port: 443, secret: SECRET })).toBe(id);
  });

  it('drops invalid endpoints and expired exclusions while keeping valid history', () => {
    const valid = endpoint();
    const state = parseCollectorState(
      {
        schemaVersion: 1,
        updatedAt: NOW_ISO,
        endpoints: [
          valid,
          { ...valid, server: '127.0.0.1' },
          { ...valid, secret: 'not-hex' },
          { ...valid, attempts: [{ at: 'not-a-time', result: 'success', latencyMs: 10 }] },
        ],
        exclusions: [
          {
            id: 'proxy-aaaaaaaa',
            server: 'proxy.telegram-cdn.net',
            port: 443,
            reason: 'repeated-failures',
            until: new Date(NOW + 3_600_000).toISOString(),
          },
          {
            id: 'proxy-bbbbbbbb',
            server: 'proxy.telegram-cdn.net',
            port: 443,
            reason: 'repeated-failures',
            until: new Date(NOW - 3_600_000).toISOString(),
          },
        ],
      },
      { now: NOW },
    );

    expect(state.endpoints).toHaveLength(1);
    expect(state.endpoints[0]?.id).toBe(valid.id);
    expect(state.endpoints[0]?.sources).toEqual(['iwizard7', 'radikal']);
    expect(state.exclusions).toHaveLength(1);
    expect(state.exclusions[0]?.id).toBe('proxy-aaaaaaaa');
  });

  it('returns an empty state for corrupt input', () => {
    expect(parseCollectorState(null).endpoints).toHaveLength(0);
    expect(parseCollectorState({ schemaVersion: 2 }).schemaVersion).toBe(1);
  });

  it('accumulates attempts across runs and resets the failure streak on success', () => {
    const existing = endpoint({
      attempts: [{ at: NOW_ISO, result: 'success', latencyMs: 100 }],
      consecutiveFailedRuns: 0,
    });
    const { endpoint: updated, excluded } = applyVerification(
      existing,
      {
        server: existing.server,
        port: existing.port,
        secret: existing.secret,
        sources: ['solispirit'],
        country: null,
      },
      [
        { result: 'success', latencyMs: 140 },
        { result: 'failure', latencyMs: null },
        { result: 'timeout', latencyMs: null },
      ],
      NOW_ISO,
      3,
    );

    expect(excluded).toBe(false);
    expect(updated.attempts).toHaveLength(4);
    expect(updated.sources).toEqual(['iwizard7', 'radikal', 'solispirit']);
    expect(updated.country).toBe('NL');
    expect(updated.consecutiveFailedRuns).toBe(0);
  });

  it('excludes an endpoint only after the configured number of failed runs', () => {
    const first = applyVerification(
      endpoint({ attempts: [], consecutiveFailedRuns: 2 }),
      {
        server: 'proxy.telegram-cdn.net',
        port: 443,
        secret: SECRET,
        sources: ['iwizard7'],
        country: null,
      },
      [{ result: 'failure', latencyMs: null }],
      NOW_ISO,
      3,
    );
    expect(first.excluded).toBe(true);
    expect(first.endpoint.attempts).toHaveLength(0);
    expect(first.endpoint.consecutiveFailedRuns).toBe(3);

    const unknownOnly = applyVerification(
      endpoint({ attempts: [], consecutiveFailedRuns: 2 }),
      {
        server: 'proxy.telegram-cdn.net',
        port: 443,
        secret: SECRET,
        sources: ['iwizard7'],
        country: null,
      },
      [{ result: 'unknown', latencyMs: null }],
      NOW_ISO,
      3,
    );
    expect(unknownOnly.excluded).toBe(false);
    expect(unknownOnly.endpoint.consecutiveFailedRuns).toBe(2);
  });

  it('computes median latency and rankable statistics', () => {
    const attempts = [
      { at: '2026-11-17T11:00:00Z', result: 'success' as const, latencyMs: 100 },
      { at: '2026-11-17T11:05:00Z', result: 'failure' as const, latencyMs: null },
      { at: '2026-11-17T11:10:00Z', result: 'timeout' as const, latencyMs: null },
      { at: '2026-11-17T11:15:00Z', result: 'success' as const, latencyMs: 300 },
      { at: '2026-11-17T11:20:00Z', result: 'unknown' as const, latencyMs: null },
    ];
    expect(medianLatencyOf(attempts)).toBe(200);
    expect(medianLatencyOf([])).toBeNull();

    const rankable = rankableFromState(
      endpoint({ attempts, lastAttemptAt: '2026-11-17T11:20:00Z' }),
      'github-actions',
    );
    expect(rankable.successes).toBe(2);
    expect(rankable.failures).toBe(2);
    expect(rankable.unknowns).toBe(1);
    expect(rankable.medianLatencyMs).toBe(200);
    expect(rankable.verifiedAt).toBe('2026-11-17T11:15:00Z');
    expect(rankable.lastFailedAt).toBe('2026-11-17T11:10:00Z');
  });

  it('prunes stale endpoints but keeps published and recent ones', () => {
    const recent = endpoint();
    const pinned = endpoint({
      server: 'old.telegram-cdn.net',
      attempts: [{ at: '2026-11-10T12:00:00Z', result: 'success', latencyMs: 200 }],
      lastAttemptAt: '2026-11-10T12:00:00Z',
    });
    const stale = endpoint({
      server: 'stale.telegram-cdn.net',
      attempts: [{ at: '2026-11-10T12:00:00Z', result: 'success', latencyMs: 200 }],
      lastAttemptAt: '2026-11-10T12:00:00Z',
    });

    const state: CollectorState = {
      ...emptyCollectorState(),
      endpoints: [recent, pinned, stale],
      exclusions: [
        {
          id: 'proxy-aaaaaaaa',
          server: 'proxy.telegram-cdn.net',
          port: 443,
          reason: 'repeated-failures',
          until: new Date(NOW + 3_600_000).toISOString(),
        },
        {
          id: 'proxy-bbbbbbbb',
          server: 'proxy.telegram-cdn.net',
          port: 443,
          reason: 'repeated-failures',
          until: new Date(NOW - 3_600_000).toISOString(),
        },
      ],
    };

    const pruned = pruneCollectorState(state, {
      now: NOW,
      keepIds: new Set([pinned.id]),
      maxAgeMinutes: 480,
    });
    const ids = pruned.endpoints.map((entry) => entry.id);
    expect(ids).toContain(recent.id);
    expect(ids).toContain(pinned.id);
    expect(ids).not.toContain(stale.id);
    expect(pruned.exclusions).toHaveLength(1);
    expect(pruned.updatedAt).toBe(NOW_ISO);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildTelegramProxyLink,
  findDuplicates,
  formatHostPort,
  isValidTimestamp,
  maskSecret,
  parseProxyDataset,
  proxyKey,
  validateCountry,
  validatePort,
  validateProxyRecord,
  validateSecret,
  validateServer,
} from '../src/lib/validation';
import type { ProxyRecord } from '../src/types/proxy';
import type { Result } from '../src/lib/validation';

const errorCode = (result: Result<unknown>): string => (result.ok ? 'ok' : result.code);

const SECRET = '0123456789abcdef0123456789abcdef';

function record(overrides: Partial<ProxyRecord> = {}): ProxyRecord {
  return {
    id: 'proxy-abc123',
    name: 'Community relay',
    type: 'mtproto',
    server: 'relay.example.net',
    port: 443,
    secret: SECRET,
    country: 'DE',
    sourceId: 'manual',
    trust: 'community',
    status: 'unknown',
    latencyMs: null,
    lastChecked: '2026-11-16T10:00:00Z',
    lastOnline: null,
    consecutiveFailures: 0,
    history: [],
    createdAt: '2026-11-01T00:00:00Z',
    notes: null,
    ...overrides,
  };
}

describe('validateServer', () => {
  it('accepts public hostnames and public IPv4 addresses', () => {
    expect(validateServer('Relay.Example.NET')).toEqual({ ok: true, value: 'relay.example.net' });
    expect(validateServer('8.8.8.8')).toEqual({ ok: true, value: '8.8.8.8' });
  });

  it('rejects schemes, paths, ports and empty values', () => {
    expect(validateServer('https://relay.example.net').ok).toBe(false);
    expect(validateServer('relay.example.net:443').ok).toBe(false);
    expect(validateServer('relay.example.net/path').ok).toBe(false);
    expect(errorCode(validateServer('   '))).toBe('required');
  });

  it('rejects private, reserved and documentation ranges', () => {
    for (const ip of ['10.0.0.1', '127.0.0.1', '192.168.1.4', '172.16.0.1', '100.64.0.1', '203.0.113.5', '198.51.100.7', '192.0.2.9', '224.0.0.1', '0.0.0.0']) {
      expect(errorCode(validateServer(ip)), ip).toBe('server.private');
    }
    for (const host of ['localhost', 'example.com', 'relay.example', 'node.test', 'host.localhost']) {
      expect(validateServer(host).ok, host).toBe(false);
    }
  });

  it('rejects invalid IPv4 octets', () => {
    expect(validateServer('999.1.1.1').ok).toBe(false);
    expect(validateServer('1.2.3.256').ok).toBe(false);
  });
});

describe('validatePort', () => {
  it('accepts the full valid range', () => {
    expect(validatePort(1)).toEqual({ ok: true, value: 1 });
    expect(validatePort('65535')).toEqual({ ok: true, value: 65535 });
  });

  it('rejects zero, out-of-range and non-numeric ports', () => {
    expect(validatePort(0).ok).toBe(false);
    expect(validatePort(65536).ok).toBe(false);
    expect(validatePort('443.5').ok).toBe(false);
    expect(validatePort('-1').ok).toBe(false);
  });
});

describe('validateSecret', () => {
  it('normalizes case and strips a 0x prefix', () => {
    expect(validateSecret(`  0x${SECRET.toUpperCase()}  `)).toEqual({ ok: true, value: SECRET });
  });

  it('accepts longer even-length secrets', () => {
    expect(validateSecret('ee'.padEnd(64, 'a')).ok).toBe(true);
  });

  it('rejects odd, short, long and non-hex secrets', () => {
    expect(errorCode(validateSecret('abc'))).toBe('secret.length');
    expect(errorCode(validateSecret(SECRET.slice(0, 31)))).toBe('secret.length');
    expect(errorCode(validateSecret('z'.repeat(32)))).toBe('secret.format');
    expect(errorCode(validateSecret('a'.repeat(258)))).toBe('secret.length');
  });
});

describe('validateCountry', () => {
  it('normalizes and accepts ISO country codes', () => {
    expect(validateCountry(' de ')).toEqual({ ok: true, value: 'DE' });
    expect(validateCountry('')).toEqual({ ok: true, value: null });
    expect(validateCountry(null)).toEqual({ ok: true, value: null });
  });

  it('rejects non-ISO values', () => {
    expect(validateCountry('Germany').ok).toBe(false);
    expect(validateCountry('D1').ok).toBe(false);
  });
});

describe('connection helpers', () => {
  it('builds the exact official Telegram deep link', () => {
    expect(buildTelegramProxyLink({ server: 'Relay.Example.NET', port: 443, secret: SECRET })).toBe(
      `https://t.me/proxy?server=relay.example.net&port=443&secret=${SECRET}`,
    );
  });

  it('refuses to build a link for invalid credentials', () => {
    expect(buildTelegramProxyLink({ server: 'localhost', port: 443, secret: SECRET })).toBeNull();
    expect(buildTelegramProxyLink({ server: 'relay.example.net', port: 0, secret: SECRET })).toBeNull();
    expect(buildTelegramProxyLink({ server: 'relay.example.net', port: 443, secret: 'nope' })).toBeNull();
  });

  it('formats and masks without leaking the full secret', () => {
    expect(formatHostPort({ server: 'relay.example.net', port: 443 })).toBe('relay.example.net:443');
    expect(maskSecret(SECRET)).toBe('012345…cdef');
    expect(maskSecret(SECRET)).not.toContain(SECRET);
  });

  it('deduplicates case-insensitively on server and secret', () => {
    const key = proxyKey({ server: 'Relay.Example.NET', port: 443, secret: SECRET.toUpperCase() });
    expect(key).toBe(proxyKey({ server: 'relay.example.net', port: 443, secret: SECRET }));
    expect(findDuplicates([record(), record({ name: 'Copy' })])).toEqual([1]);
  });
});

describe('timestamps', () => {
  it('accepts ISO UTC timestamps only', () => {
    expect(isValidTimestamp('2026-11-17T10:00:00Z')).toBe(true);
    expect(isValidTimestamp('2026-11-17T10:00:00.123Z')).toBe(true);
    expect(isValidTimestamp('2026-11-17T10:00:00+02:00')).toBe(false);
    expect(isValidTimestamp('2026-11-17')).toBe(false);
    expect(isValidTimestamp('not a date')).toBe(false);
  });
});

describe('validateProxyRecord', () => {
  it('normalizes valid records and drops unknown keys', () => {
    const result = validateProxyRecord({
      ...record(),
      server: 'RELAY.example.net',
      reviewer: 'internal@example.net',
      adminToken: 'secret-token',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.server).toBe('relay.example.net');
    expect(result.value).not.toHaveProperty('reviewer');
    expect(result.value).not.toHaveProperty('adminToken');
  });

  it('rejects malformed credentials and ids', () => {
    expect(validateProxyRecord({ ...record(), port: 70000 }).ok).toBe(false);
    expect(validateProxyRecord({ ...record(), secret: 'xyz' }).ok).toBe(false);
    expect(validateProxyRecord({ ...record(), server: '10.0.0.1' }).ok).toBe(false);
    expect(validateProxyRecord({ ...record(), id: 'bad id' }).ok).toBe(false);
    expect(validateProxyRecord({ ...record(), type: 'socks5' }).ok).toBe(false);
  });
});

describe('parseProxyDataset', () => {
  it('returns an empty dataset for invalid input', () => {
    const parsed = parseProxyDataset(null);
    expect(parsed.dataset.proxies).toEqual([]);
    expect(parsed.issues.length).toBeGreaterThan(0);
  });

  it('skips invalid and duplicate rows instead of failing the whole file', () => {
    const parsed = parseProxyDataset({
      schemaVersion: 1,
      lastUpdated: '2026-11-17T10:00:00Z',
      proxies: [
        record({ id: 'first-proxy' }),
        record({ id: 'first-proxy-2' }),
        { ...record({ id: 'bad-proxy' }), port: 'nope' },
        record({ id: 'second-proxy', server: 'other.example.net' }),
      ],
    });
    expect(parsed.dataset.proxies.map((proxy) => proxy.id)).toEqual(['first-proxy', 'second-proxy']);
    expect(parsed.skipped).toBe(2);
    expect(parsed.issues.some((issue) => issue.code === 'duplicate')).toBe(true);
  });

  it('rejects unsupported schema versions and malformed timestamps', () => {
    const parsed = parseProxyDataset({
      schemaVersion: 2,
      lastUpdated: 'yesterday',
      proxies: [],
    });
    expect(parsed.issues.map((issue) => issue.code)).toContain('dataset.schema');
    expect(parsed.issues.map((issue) => issue.code)).toContain('timestamp.invalid');
    expect(parsed.dataset.lastUpdated).toBeNull();
  });
});

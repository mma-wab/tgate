import dns from 'node:dns/promises';
import net from 'node:net';
import { validateServer } from '../../src/lib/validation';

/**
 * Network guards shared by the source fetcher and the MTProto prober.
 *
 * The collector only talks to hosts that are explicitly allowlisted, and every
 * resolved address must be publicly routable. Private, loopback, link-local,
 * multicast and reserved addresses are rejected so community proxy feeds can
 * never turn the runner into an SSRF pivot.
 */

const isDisallowedAddress = (address: string): boolean => {
  const value = address.trim().toLowerCase();
  if (!value) return true;
  if (net.isIPv6(value)) {
    const bare = value.replace(/^\[|\]$/g, '');
    if (bare === '::' || bare === '::1') return true;
    if (bare.startsWith('fe80') || bare.startsWith('fc') || bare.startsWith('fd')) return true;
    if (bare.startsWith('ff')) return true;
    // Documentation, benchmarking and ORCHID prefixes are never routable.
    if (bare.startsWith('2001:db8') || bare.startsWith('2001:2:') || bare.startsWith('2001:10:')) {
      return true;
    }
    if (bare.startsWith('::ffff:')) {
      const mapped = bare.slice('::ffff:'.length);
      const checked = validateServer(mapped);
      return !checked.ok;
    }
    const firstGroup = Number.parseInt(bare.split(':')[0] ?? '', 16);
    // Only 2000::/3 global unicast is acceptable.
    if (!Number.isFinite(firstGroup) || firstGroup < 0x2000 || firstGroup > 0x3fff) return true;
    return false;
  }
  return !validateServer(value).ok;
};

/** Accepts a configured source URL only when it is HTTPS on an allowlisted host. */
export function assertAllowedSourceUrl(raw: string, allowedHosts: string[]): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Source URL is not a valid URL.');
  }
  if (url.protocol !== 'https:') throw new Error('Only HTTPS source URLs are allowed.');
  if (url.username || url.password) throw new Error('Source URLs must not contain credentials.');
  if (url.port && url.port !== '443') throw new Error('Source URLs must use port 443.');
  const host = url.hostname.toLowerCase();
  if (!allowedHosts.some((value) => value.trim().toLowerCase() === host)) {
    throw new Error(`Host "${host}" is not in config.collector.allowedHosts.`);
  }
  return url;
}

/**
 * Resolves a hostname once and returns a public address. Callers connect to the
 * returned address instead of re-resolving, which also prevents DNS rebinding.
 */
export async function resolvePublicAddress(hostname: string): Promise<string> {
  const value = hostname.trim().toLowerCase().replace(/\.+$/, '');
  const literal = validateServer(value);
  if (!literal.ok) throw new Error('Target is not a valid public hostname or IPv4 address.');

  if (net.isIP(value)) {
    if (isDisallowedAddress(value)) throw new Error('Target is a private, reserved, or multicast address.');
    return value;
  }

  const addresses = await dns.lookup(value, { all: true, verbatim: true });
  if (addresses.length === 0) throw new Error('Target host did not resolve.');
  const candidate = addresses.find((entry) => !isDisallowedAddress(entry.address));
  if (!candidate) throw new Error('Target host resolves only to private or reserved addresses.');
  return candidate.address;
}

/**
 * Resolves and validates a feed host before the HTTP request is made. Unlike
 * probe targets, every DNS answer must be public: one private answer rejects
 * the whole host, so a feed can never redirect the runner into a local network.
 */
export async function assertPublicSourceHost(hostname: string): Promise<void> {
  const value = hostname.trim().toLowerCase().replace(/\.+$/, '');
  const literal = validateServer(value);
  if (!literal.ok) throw new Error('Source host is not a public hostname.');

  if (net.isIP(literal.value)) {
    if (isDisallowedAddress(literal.value)) {
      throw new Error('Source host is a private, reserved, or multicast address.');
    }
    return;
  }

  const addresses = await dns.lookup(literal.value, { all: true, verbatim: true });
  if (addresses.length === 0) throw new Error('Source host did not resolve.');
  if (addresses.some((entry) => isDisallowedAddress(entry.address))) {
    throw new Error('Source host resolves to a private, reserved, or multicast address.');
  }
}

export { isDisallowedAddress };

import { describe, expect, it } from 'vitest';
import {
  assertAllowedSourceUrl,
  isDisallowedAddress,
  resolvePublicAddress,
} from '../scripts/lib/network-guard';

describe('network guard', () => {
  it('flags private, loopback, link-local, multicast and reserved IPv4', () => {
    [
      '0.0.0.0',
      '10.0.0.1',
      '100.64.1.1',
      '127.0.0.1',
      '169.254.169.254',
      '172.16.0.1',
      '192.168.1.10',
      '224.0.0.1',
    ].forEach((address) => {
      expect(isDisallowedAddress(address)).toBe(true);
    });
    expect(isDisallowedAddress('8.8.8.8')).toBe(false);
    expect(isDisallowedAddress('1.1.1.1')).toBe(false);
  });

  it('flags private and link-local IPv6', () => {
    ['::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', 'ff02::1'].forEach((address) => {
      expect(isDisallowedAddress(address)).toBe(true);
    });
    expect(isDisallowedAddress('2001:4860:4860::8888')).toBe(false);
  });

  it('accepts only HTTPS feeds on allowlisted hosts', () => {
    const allowed = ['raw.githubusercontent.com'];
    expect(assertAllowedSourceUrl('https://raw.githubusercontent.com/a/b.txt', allowed).hostname).toBe(
      'raw.githubusercontent.com',
    );

    expect(() => assertAllowedSourceUrl('http://raw.githubusercontent.com/a/b.txt', allowed)).toThrow(
      /HTTPS/,
    );
    expect(() => assertAllowedSourceUrl('https://evil.example.net/a.txt', allowed)).toThrow(
      /allowedHosts/,
    );
    expect(() =>
      assertAllowedSourceUrl('https://user:pass@raw.githubusercontent.com/a/b.txt', allowed),
    ).toThrow(/credentials/);
    expect(() =>
      assertAllowedSourceUrl('https://raw.githubusercontent.com:8443/a/b.txt', allowed),
    ).toThrow(/port 443/);
  });

  it('resolves public IP literals without DNS and rejects private targets', async () => {
    await expect(resolvePublicAddress('8.8.8.8')).resolves.toBe('8.8.8.8');
    await expect(resolvePublicAddress('127.0.0.1')).rejects.toThrow(/private|reserved|public hostname/);
    await expect(resolvePublicAddress('localhost')).rejects.toThrow(/valid public hostname/);
  });
});

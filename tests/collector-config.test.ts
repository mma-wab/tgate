import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CollectorConfigError,
  parseCollectorConfig,
} from '../scripts/lib/collector-config';

type MutableConfig = {
  [key: string]: any;
};

const validConfig = (): MutableConfig =>
  JSON.parse(readFileSync(resolve('config/collector.json'), 'utf8')) as MutableConfig;

describe('collector configuration', () => {
  it('accepts the repository configuration', () => {
    const config = parseCollectorConfig(validConfig());
    expect(config.featuredCount).toBe(12);
    expect(config.sources).toHaveLength(3);
    expect(config.sources.filter((source) => source.enabled)).toHaveLength(3);
    expect(config.allowedHosts).toContain('raw.githubusercontent.com');
    expect(config.minimumSuccessfulChecks).toBeLessThanOrEqual(config.verificationAttempts);
    expect(config.schedule.collectionCron).toMatch(/^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/);
  });

  it('rejects a feed outside the host allowlist', () => {
    const raw = validConfig();
    raw.sources[0].feeds[0].url = 'https://evil.example.org/proxies.txt';
    expect(() => parseCollectorConfig(raw)).toThrow(CollectorConfigError);
    expect(() => parseCollectorConfig(raw)).toThrow(/allowedHosts/);
  });

  it('rejects plain HTTP feeds and credentials in feed URLs', () => {
    const http = validConfig();
    http.sources[0].feeds[0].url = 'http://raw.githubusercontent.com/iwizard7/MTProxy_list/data/working.txt';
    expect(() => parseCollectorConfig(http)).toThrow(/HTTPS/);

    const credentials = validConfig();
    credentials.sources[0].feeds[0].url =
      'https://user:pass@raw.githubusercontent.com/iwizard7/MTProxy_list/data/working.txt';
    expect(() => parseCollectorConfig(credentials)).toThrow(/credentials/);
  });

  it('rejects an enabled source with no valid feeds', () => {
    const raw = validConfig();
    raw.sources[0].feeds = [];
    expect(() => parseCollectorConfig(raw)).toThrow(/non-empty array/);
  });

  it('rejects impossible verification thresholds', () => {
    const raw = validConfig();
    raw.verificationAttempts = 1;
    raw.minimumSuccessfulChecks = 2;
    expect(() => parseCollectorConfig(raw)).toThrow(/minimumSuccessfulChecks/);
  });

  it('rejects duplicate source ids and disabled-only configurations', () => {
    const duplicate = validConfig();
    duplicate.sources[1].id = duplicate.sources[0].id;
    expect(() => parseCollectorConfig(duplicate)).toThrow(/Duplicate source id/);

    const disabled = validConfig();
    disabled.sources.forEach((source: MutableConfig) => {
      source.enabled = false;
    });
    expect(() => parseCollectorConfig(disabled)).toThrow(/At least one source must be enabled/);
  });

  it('rejects unsafe numeric limits instead of silently accepting them', () => {
    const raw = validConfig();
    raw.maxCandidates = 10_000;
    raw.concurrency = 0;
    raw.maxResponseBytes = 12;
    expect(() => parseCollectorConfig(raw)).toThrow(/maxCandidates/);
    try {
      parseCollectorConfig(raw);
    } catch (error) {
      expect(error).toBeInstanceOf(CollectorConfigError);
      const issues = (error as CollectorConfigError).issues;
      expect(issues.some((issue) => issue.includes('concurrency'))).toBe(true);
      expect(issues.some((issue) => issue.includes('maxResponseBytes'))).toBe(true);
    }
  });

  it('rejects malformed package exclusions', () => {
    const raw = validConfig();
    raw.exclusions = [{ server: '127.0.0.1', reason: 'loopback' }];
    expect(() => parseCollectorConfig(raw)).toThrow(/exclusions/);
  });
});

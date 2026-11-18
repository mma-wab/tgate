import type { ProxyStatus } from './proxy';

/** Published statuses for the featured list. `checking` is a UI-only state. */
export type FeaturedStatus = 'online' | 'checking' | 'offline' | 'unknown';

export interface FeaturedProxyRecord {
  id: string;
  rank: number;
  server: string;
  port: number;
  /** Hex-encoded MTProto secret. Public by design: it is part of the invite link. */
  secret: string;
  protocol: 'MTProto';
  status: FeaturedStatus;
  latencyMs: number | null;
  medianLatencyMs: number | null;
  successRate: number;
  successfulChecks: number;
  failedChecks: number;
  verifiedAt: string | null;
  lastFailedAt: string | null;
  method: 'mtproto';
  runnerRegion: string;
  sourceCount: number;
  sources: string[];
  country: string | null;
  score: number;
}

export interface TopProxyDataset {
  schemaVersion: 1;
  updatedAt: string | null;
  totalSources: number;
  totalDiscovered: number;
  totalVerified: number;
  featuredCount: number;
  maxAgeMinutes: number;
  sourceLabels: Record<string, string>;
  proxies: FeaturedProxyRecord[];
}

export interface CollectorFeed {
  url: string;
  priority: number;
}

export interface CollectorSource {
  id: string;
  name: string;
  repo: string;
  enabled: boolean;
  feeds: CollectorFeed[];
}

export interface CollectorExclusion {
  server: string;
  reason?: string;
}

export interface CollectorConfig {
  schemaVersion: 1;
  featuredCount: number;
  maxCandidates: number;
  verificationAttempts: number;
  timeoutMs: number;
  concurrency: number;
  maxResponseBytes: number;
  minimumSuccessRate: number;
  minimumSuccessfulChecks: number;
  maximumLatencyMs: number;
  maximumDataAgeMinutes: number;
  failureThreshold: number;
  exclusionHours: number;
  runnerRegion: string;
  schedule: {
    collectionCron: string;
    verification: string;
    note?: string;
  };
  allowedHosts: string[];
  sources: CollectorSource[];
  exclusions: CollectorExclusion[];
}

/** Maps the collector's verified status to the broader proxy status union when needed. */
export const toProxyStatus = (status: FeaturedStatus): ProxyStatus =>
  status === 'checking' ? 'unknown' : status;

export type Lang = 'ar' | 'en';

export type ProxyStatus = 'online' | 'offline' | 'timeout' | 'unknown';

export type TrustLevel = 'trusted-source' | 'community' | 'unverified';

export type ProxySourceKind = 'manual' | 'official' | 'community' | 'public-list';

export interface CheckHistoryEntry {
  /** ISO 8601 timestamp of the check. */
  at: string;
  status: ProxyStatus;
  latencyMs: number | null;
  /** How the check was performed. */
  method?: 'mtproto' | 'transport';
}

export interface ProxyRecord {
  id: string;
  name: string;
  type: 'mtproto';
  /** Public hostname or IPv4 address. No scheme, path, or port. */
  server: string;
  port: number;
  /** Hex-encoded MTProto proxy secret. Public by design: it is part of the invite link. */
  secret: string;
  /** ISO 3166-1 alpha-2 code, only when reliably known. */
  country: string | null;
  sourceId: string;
  trust: TrustLevel;
  status: ProxyStatus;
  latencyMs: number | null;
  /** Time of the most recent check attempt. */
  lastChecked: string | null;
  /** Time of the most recent successful MTProto probe. */
  lastOnline: string | null;
  consecutiveFailures: number;
  history: CheckHistoryEntry[];
  createdAt: string;
  notes: string | null;
}

export interface ProxyDataset {
  schemaVersion: 1;
  lastUpdated: string | null;
  proxies: ProxyRecord[];
}

export interface SourceRecord {
  id: string;
  name: string;
  url: string | null;
  kind: ProxySourceKind;
  license: string | null;
  addedAt: string;
  lastSyncAt: string | null;
  importedCount: number;
  validationStatus: 'validated' | 'pending-review' | 'disabled';
}

export interface SourceDataset {
  schemaVersion: 1;
  sources: SourceRecord[];
}

export type StatusFilter = 'all' | 'online' | 'offline' | 'unknown';
export type SortOption = 'fastest' | 'recent' | 'name';

export interface DirectoryFilters {
  query: string;
  status: StatusFilter;
  country: string;
  trust: string;
  recentOnly: boolean;
  sort: SortOption;
}

export interface DirectoryStats {
  total: number;
  online: number;
  offline: number;
  unknown: number;
  averageLatencyMs: number | null;
  availabilityRate: number | null;
  lastUpdated: string | null;
  verifiedCount: number;
}

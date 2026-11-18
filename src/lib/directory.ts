import type {
  DirectoryFilters,
  DirectoryStats,
  ProxyRecord,
  ProxyStatus,
} from '../types/proxy';

export const DEFAULT_FILTERS: DirectoryFilters = {
  query: '',
  status: 'all',
  country: '',
  trust: '',
  recentOnly: false,
  sort: 'fastest',
};

export const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

const effectiveStatus = (status: ProxyStatus): 'online' | 'offline' | 'unknown' => {
  if (status === 'online') return 'online';
  if (status === 'offline' || status === 'timeout') return 'offline';
  return 'unknown';
};

export function isRecent(proxy: ProxyRecord, now = Date.now()): boolean {
  if (!proxy.lastChecked) return false;
  const checked = Date.parse(proxy.lastChecked);
  return Number.isFinite(checked) && now - checked <= RECENT_WINDOW_MS && now >= checked - 60_000;
}

export function matchesStatus(proxy: ProxyRecord, status: DirectoryFilters['status']): boolean {
  if (status === 'all') return true;
  return effectiveStatus(proxy.status) === status;
}

export function matchesQuery(proxy: ProxyRecord, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [proxy.name, proxy.server, proxy.country ?? '', proxy.sourceId]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

export function filterProxies(
  proxies: ProxyRecord[],
  filters: DirectoryFilters,
  now = Date.now(),
): ProxyRecord[] {
  const filtered = proxies.filter((proxy) => {
    if (!matchesStatus(proxy, filters.status)) return false;
    if (filters.country && proxy.country !== filters.country) return false;
    if (filters.trust && proxy.trust !== filters.trust) return false;
    if (filters.recentOnly && !isRecent(proxy, now)) return false;
    if (!matchesQuery(proxy, filters.query)) return false;
    return true;
  });

  const latency = (proxy: ProxyRecord): number =>
    proxy.status === 'online' && proxy.latencyMs !== null ? proxy.latencyMs : Number.POSITIVE_INFINITY;
  const checkedAt = (proxy: ProxyRecord): number => {
    if (!proxy.lastChecked) return 0;
    const parsed = Date.parse(proxy.lastChecked);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return filtered.sort((a, b) => {
    if (filters.sort === 'name') {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }
    if (filters.sort === 'recent') {
      return checkedAt(b) - checkedAt(a) || latency(a) - latency(b);
    }
    return latency(a) - latency(b) || checkedAt(b) - checkedAt(a);
  });
}

export function computeStats(
  proxies: ProxyRecord[],
  lastUpdated: string | null,
): DirectoryStats {
  const total = proxies.length;
  let online = 0;
  let offline = 0;
  let unknown = 0;
  let latencySum = 0;
  let latencyCount = 0;
  let verifiedCount = 0;

  for (const proxy of proxies) {
    const status = effectiveStatus(proxy.status);
    if (status === 'online') {
      online += 1;
      if (proxy.status === 'online' && proxy.latencyMs !== null) {
        latencySum += proxy.latencyMs;
        latencyCount += 1;
      }
    } else if (status === 'offline') {
      offline += 1;
    } else {
      unknown += 1;
    }
    if (proxy.lastOnline) verifiedCount += 1;
  }

  return {
    total,
    online,
    offline,
    unknown,
    averageLatencyMs: latencyCount > 0 ? Math.round(latencySum / latencyCount) : null,
    availabilityRate: total > 0 ? Math.round((online / total) * 100) : null,
    lastUpdated,
    verifiedCount,
  };
}

/** Returns the countries present in the dataset, sorted by localized name. */
export function availableCountries(
  proxies: ProxyRecord[],
  locale: string,
): Array<{ code: string; label: string }> {
  const codes = new Set<string>();
  proxies.forEach((proxy) => {
    if (proxy.country) codes.add(proxy.country);
  });
  let display: Intl.DisplayNames | null = null;
  try {
    display = new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    display = null;
  }
  return [...codes]
    .map((code) => ({
      code,
      label: display?.of(code) ?? code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}

export function hasActiveFilters(filters: DirectoryFilters): boolean {
  return Boolean(
    filters.query.trim() ||
      filters.status !== 'all' ||
      filters.country ||
      filters.trust ||
      filters.recentOnly,
  );
}

export function countByStatus(proxies: ProxyRecord[]): Record<'all' | 'online' | 'offline' | 'unknown', number> {
  const counts = { all: proxies.length, online: 0, offline: 0, unknown: 0 };
  proxies.forEach((proxy) => {
    counts[effectiveStatus(proxy.status)] += 1;
  });
  return counts;
}

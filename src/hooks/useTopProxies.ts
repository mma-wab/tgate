import { useCallback, useEffect, useRef, useState } from 'react';
import { isTopProxyStale } from '../lib/top-proxies';
import { fetchTopProxyData, TopProxyDataError } from '../services/top-proxies';
import type { TopProxyDataset } from '../types/top-proxy';

export type TopProxiesStatus = 'loading' | 'ready' | 'error';
export type TopProxiesRefreshResult = 'ok' | 'rate-limited' | 'error' | 'aborted';

const REFRESH_COOLDOWN_MS = 30_000;

/**
 * Reads the published featured-proxy JSON. Manual refreshes are rate limited and
 * only re-fetch the static database; they never start proxy discovery or scans.
 */
export function useTopProxies() {
  const [dataset, setDataset] = useState<TopProxyDataset | null>(null);
  const [status, setStatus] = useState<TopProxiesStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastAttemptRef = useRef(0);
  const hasDataRef = useRef(false);

  const load = useCallback(async (manual: boolean): Promise<TopProxiesRefreshResult> => {
    lastAttemptRef.current = Date.now();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (manual) setRefreshing(true);

    try {
      const result = await fetchTopProxyData({
        signal: controller.signal,
        bypassCache: manual,
      });
      if (controller.signal.aborted) return 'aborted';
      hasDataRef.current = true;
      setDataset(result.dataset);
      setSkipped(result.skipped);
      setLastFetchedAt(result.fetchedAt);
      setFailed(false);
      setStatus('ready');
      return 'ok';
    } catch (error) {
      if (controller.signal.aborted) return 'aborted';
      if (error instanceof TopProxyDataError && error.kind === 'aborted') return 'aborted';
      setFailed(true);
      setStatus(hasDataRef.current ? 'ready' : 'error');
      return 'error';
    } finally {
      if (!controller.signal.aborted && manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const refresh = useCallback(async (): Promise<TopProxiesRefreshResult> => {
    // A failed first load must be retryable immediately; the cooldown only
    // protects the published snapshot from rapid repeated requests.
    const retryAfterFailure = status === 'error' && !hasDataRef.current;
    if (!retryAfterFailure && Date.now() - lastAttemptRef.current < REFRESH_COOLDOWN_MS) {
      return 'rate-limited';
    }
    return load(true);
  }, [load, status]);

  return {
    dataset,
    status,
    refreshing,
    failed,
    skipped,
    lastFetchedAt,
    stale: dataset ? isTopProxyStale(dataset) : false,
    refresh,
  };
}

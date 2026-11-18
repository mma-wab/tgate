import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchProxyData, ProxyDataError } from '../services/proxies';
import type { ProxyDataResult } from '../services/proxies';
import type { ProxyDataset } from '../types/proxy';
import type { ValidationIssue } from '../lib/validation';

type LoadStatus = 'loading' | 'ready' | 'error';

interface ProxiesContextValue {
  status: LoadStatus;
  dataset: ProxyDataset | null;
  issues: ValidationIssue[];
  skipped: number;
  errorKind: 'network' | 'invalid' | null;
  lastFetch: number | null;
  isRefreshing: boolean;
  refresh: (options?: { bypassCache?: boolean }) => Promise<ProxyDataResult | null>;
}

const ProxiesContext = createContext<ProxiesContextValue | null>(null);

export function ProxiesProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [dataset, setDataset] = useState<ProxyDataset | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [errorKind, setErrorKind] = useState<'network' | 'invalid' | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (bypassCache: boolean, initial: boolean) => {
    const id = ++requestId.current;
    if (initial) setStatus('loading');
    else setIsRefreshing(true);

    try {
      const result = await fetchProxyData({ bypassCache });
      if (id !== requestId.current) return null;
      setDataset(result.dataset);
      setIssues(result.issues);
      setSkipped(result.skipped);
      setErrorKind(null);
      setStatus('ready');
      setLastFetch(Date.now());
      return result;
    } catch (error) {
      if (id !== requestId.current) return null;
      const kind = error instanceof ProxyDataError ? error.kind : 'network';
      if (kind === 'aborted') return null;
      if (initial || !dataset) {
        setStatus('error');
        setDataset(null);
        setErrorKind(kind === 'invalid' ? 'invalid' : 'network');
      }
      return null;
    } finally {
      if (id === requestId.current) setIsRefreshing(false);
    }
  }, [dataset]);

  useEffect(() => {
    void load(false, true);
    // Intentionally runs once on mount; refresh() handles later updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(
    async (options?: { bypassCache?: boolean }) =>
      load(options?.bypassCache ?? true, false),
    [load],
  );

  const value = useMemo<ProxiesContextValue>(
    () => ({
      status,
      dataset,
      issues,
      skipped,
      errorKind,
      lastFetch,
      isRefreshing,
      refresh,
    }),
    [status, dataset, issues, skipped, errorKind, lastFetch, isRefreshing, refresh],
  );

  return <ProxiesContext.Provider value={value}>{children}</ProxiesContext.Provider>;
}

export function useProxies(): ProxiesContextValue {
  const context = useContext(ProxiesContext);
  if (!context) throw new Error('useProxies must be used inside ProxiesProvider');
  return context;
}

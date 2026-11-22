import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n, type TranslationKey } from '../../i18n';
import { useCopy } from '../../hooks/useCopy';
import { useNow } from '../../hooks/useNow';
import { useTopProxies } from '../../hooks/useTopProxies';
import { useToast } from '../../contexts/ToastContext';
import type { FeaturedProxyRecord, FeaturedStatus } from '../../types/top-proxy';
import {
  countryLabel,
  formatDateTime,
  formatNumber,
  formatRelative,
} from '../../lib/format';
import { cn } from '../../lib/cn';
import { buildFeaturedTelegramLink, buildFeaturedTelegramTgLink } from '../../lib/top-proxies';
import { Button } from '../ui/Button';
import { Container, Section } from '../ui/LayoutPrimitives';
import { EmptyState, ErrorState, Skeleton } from '../ui/Feedback';
import {
  BoltIcon,
  CheckIcon,
  CopyIcon,
  PinIcon,
  RefreshIcon,
  SearchIcon,
  CloseIcon,
  ShieldIcon,
  TelegramPlaneIcon,
} from '../ui/SketchIcons';

const statusTone: Record<FeaturedStatus, { dot: string; label: TranslationKey }> = {
  online: { dot: 'bg-success', label: 'home.featured.status.online' },
  checking: { dot: 'bg-warning', label: 'home.featured.status.checking' },
  offline: { dot: 'bg-danger', label: 'home.featured.status.offline' },
  unknown: { dot: 'bg-muted', label: 'home.featured.status.unknown' },
};

function StatusIndicator({ status }: { status: FeaturedStatus }) {
  const { t } = useI18n();
  const tone = statusTone[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-soft">
      <span className={cn('size-2 rounded-full', tone.dot)} aria-hidden="true" />
      {t(tone.label)}
    </span>
  );
}

function ProxyRow({ proxy, index }: { proxy: FeaturedProxyRecord; index: number }) {
  const { t, lang } = useI18n();
  const copy = useCopy();
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const link = buildFeaturedTelegramLink(proxy);
  const tgLink = buildFeaturedTelegramTgLink(proxy);
  const country = countryLabel(proxy.country, lang);
  const fast = proxy.latencyMs !== null && proxy.latencyMs < 200;

  const handleConnect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = tgLink;

    const fallbackTimer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    }, 2000);

    const clearFallback = () => window.clearTimeout(fallbackTimer);
    window.addEventListener('pagehide', clearFallback, { once: true });
    window.addEventListener('blur', clearFallback, { once: true });
  };

  const handleCopy = async () => {
    const ok = await copy(link, t('home.featured.copyLinkDone'));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <motion.li
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.2,
        delay: reduceMotion ? 0 : Math.min(index * 0.015, 0.12),
        ease: 'easeOut',
      }}
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 px-4 py-3.5 transition-colors hover:bg-brand-soft/35 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] sm:py-3',
        index > 0 && 'border-t border-dashed border-line',
      )}
    >
      <span className="num row-span-1 inline-flex h-7 min-w-8 items-center justify-center rounded-[0.7rem] border border-line bg-surface-2 px-1.5 font-mono text-[11px] font-bold text-muted">
        {String(proxy.rank).padStart(2, '0')}
      </span>

      <div className="min-w-0">
        <p
          dir="ltr"
          title={proxy.server}
          className="truncate text-start font-mono text-[13px] font-semibold text-ink"
        >
          {proxy.server}
        </p>
        {country ? (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
            <PinIcon className="size-3" />
            <span className="truncate">{country}</span>
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-self-end sm:justify-self-auto">
        <span
          title={t('home.featured.latency')}
          className={cn(
            'num inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11.5px] font-bold',
            fast ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted',
          )}
        >
          <BoltIcon className="size-3" />
          {proxy.latencyMs === null
            ? '—'
            : `${formatNumber(Math.round(proxy.latencyMs), lang)} ms`}
        </span>
      </div>

      <span className="hidden sm:inline-flex">
        <StatusIndicator status={proxy.status} />
      </span>

      <div className="col-span-3 flex items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
        <span className="sm:hidden">
          <StatusIndicator status={proxy.status} />
        </span>
        <div className="flex flex-1 items-center gap-2 sm:flex-none">
          <a
            href={tgLink}
            onClick={handleConnect}
            aria-label={`${t('home.featured.connect')} — ${proxy.server}`}
            title={t('home.featured.connectHint')}
            className="sketch-pill inline-flex h-9 flex-1 items-center justify-center gap-1.5 border-brand/30 bg-brand-soft px-3.5 text-[12.5px] font-bold text-brand-ink transition-colors hover:border-brand hover:bg-brand hover:text-white sm:flex-none"
          >
            <TelegramPlaneIcon className="size-4" />
            <span>{t('home.featured.connect')}</span>
          </a>
          <button
            type="button"
            onClick={() => void handleCopy()}
            title={t('home.featured.copyLink')}
            aria-label={`${t('home.featured.copyLink')} — ${proxy.server}`}
            className="sketch-sm inline-flex size-9 items-center justify-center text-muted transition hover:border-brand/50 hover:text-brand"
          >
            {copied ? (
              <CheckIcon className="size-4 text-success" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </button>
        </div>
      </div>
    </motion.li>
  );
}

function ProxyRowSkeleton() {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
      <Skeleton className="size-7 rounded-lg" />
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-40 rounded-md" />
        <Skeleton className="h-2.5 w-20 rounded-md" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </li>
  );
}

export function FeaturedProxies() {
  const { t, lang } = useI18n();
  const { push } = useToast();
  const now = useNow();
  const { dataset, status, refreshing, refresh, stale } = useTopProxies();
  const proxies = dataset?.proxies ?? [];
  const isReady = status === 'ready' && dataset !== null;

  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'fast'>('all');

  const filteredProxies = useMemo(() => {
    return proxies.filter((proxy) => {
      if (filterMode === 'online' && proxy.status !== 'online') return false;
      if (filterMode === 'fast' && (proxy.latencyMs === null || proxy.latencyMs >= 200)) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const serverMatch = proxy.server.toLowerCase().includes(q);
      const countryMatch = proxy.country ? proxy.country.toLowerCase().includes(q) : false;
      const countryName = proxy.country ? countryLabel(proxy.country, lang).toLowerCase() : '';
      const countryNameMatch = countryName.includes(q);

      return serverMatch || countryMatch || countryNameMatch;
    });
  }, [proxies, query, filterMode, lang]);

  const lastUpdated = dataset?.updatedAt ?? null;
  const lastUpdatedLabel = useMemo(() => {
    if (lastUpdated) {
      return t('home.featured.lastUpdatedValue', {
        time: formatRelative(lastUpdated, lang, now),
      });
    }
    return status === 'loading' ? null : t('home.featured.neverUpdated');
  }, [lastUpdated, status, t, lang, now]);

  const fastCount = proxies.filter((p) => p.latencyMs !== null && p.latencyMs < 200).length;

  const handleRefresh = async () => {
    const result = await refresh();
    if (result === 'rate-limited') push(t('home.featured.refreshLimit'), 'info');
    else if (result === 'ok') push(t('home.featured.refreshDone'), 'success');
    else if (result === 'error') push(t('home.featured.error.title'), 'error');
  };

  return (
    <Section id="proxies" className="scroll-mt-20 pt-7 pb-6 sm:pt-9 sm:pb-8">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div>
            <h2 className="text-[1.45rem] leading-tight font-extrabold text-ink sm:text-[1.7rem]">
              {t('home.featured.title')}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
              {lastUpdatedLabel ? (
                <span title={lastUpdated ? formatDateTime(lastUpdated, lang) : undefined}>
                  {lastUpdatedLabel}
                </span>
              ) : null}
              {isReady && proxies.length > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-line-strong">
                    ·
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-semibold',
                      stale ? 'text-warning' : 'text-success',
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        stale ? 'bg-warning' : 'bg-success',
                      )}
                      aria-hidden="true"
                    />
                    {t(stale ? 'home.featured.stale' : 'home.featured.fresh')}
                  </span>
                </span>
              ) : null}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleRefresh()}
            loading={refreshing}
            iconLeft={<RefreshIcon className="size-3.5" />}
            className="shrink-0"
          >
            {refreshing ? t('home.featured.refreshing') : t('home.featured.refresh')}
          </Button>
        </div>

        {isReady && proxies.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('directory.searchPlaceholder')}
                aria-label={t('directory.searchLabel')}
                className="sketch-sm h-10 w-full bg-surface ps-9 pe-9 text-[12.5px] text-ink placeholder:text-muted focus:border-brand focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('common.close')}
                  className="absolute end-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:text-ink"
                >
                  <CloseIcon className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                aria-pressed={filterMode === 'all'}
                className={cn(
                  'sketch-pill h-8 px-3 text-[11.5px] font-semibold transition-colors',
                  filterMode === 'all'
                    ? 'border-brand bg-brand text-white'
                    : 'bg-surface text-ink-soft hover:border-brand/50',
                )}
              >
                {t('directory.allStatuses')} ({proxies.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('fast')}
                aria-pressed={filterMode === 'fast'}
                className={cn(
                  'sketch-pill inline-flex h-8 items-center gap-1 px-3 text-[11.5px] font-semibold transition-colors',
                  filterMode === 'fast'
                    ? 'border-brand bg-brand text-white'
                    : 'bg-surface text-ink-soft hover:border-brand/50',
                )}
              >
                <BoltIcon className="size-3.5" />
                &lt; 200 ms ({fastCount})
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          {status === 'loading' && dataset === null ? (
            <ul className="sketch overflow-hidden" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <ProxyRowSkeleton key={index} />
              ))}
            </ul>
          ) : null}

          {status === 'error' ? (
            <ErrorState
              title={t('home.featured.error.title')}
              description={t('home.featured.error.body')}
              onRetry={() => void handleRefresh()}
            />
          ) : null}

          {isReady && filteredProxies.length === 0 ? (
            <EmptyState
              title={t('directory.noMatch.title')}
              description={t('directory.noMatch.body')}
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setFilterMode('all');
                  }}
                  iconLeft={<CloseIcon className="size-3.5" />}
                >
                  {t('directory.noMatch.clear')}
                </Button>
              }
            />
          ) : null}

          {isReady && filteredProxies.length > 0 ? (
            <ul className="sketch overflow-hidden">
              {filteredProxies.map((proxy, index) => (
                <ProxyRow key={proxy.id} proxy={proxy} index={index} />
              ))}
            </ul>
          ) : null}
        </div>

        {isReady && proxies.length > 0 ? (
          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-muted">
            <ShieldIcon className="mt-px size-3.5 shrink-0 text-brand" />
            {t('home.featured.footerNote')}
          </p>
        ) : null}
      </Container>
    </Section>
  );
}

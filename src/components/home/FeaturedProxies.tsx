import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  Copy,
  MapPin,
  RefreshCw,
  Search,
  Send,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useCopy } from '../../hooks/useCopy';
import { useNow } from '../../hooks/useNow';
import { useTopProxies } from '../../hooks/useTopProxies';
import { useToast } from '../../contexts/ToastContext';
import type { FeaturedProxyRecord } from '../../types/top-proxy';
import {
  countryLabel,
  formatDateTime,
  formatNumber,
  formatRelative,
} from '../../lib/format';
import { cn } from '../../lib/cn';
import { buildFeaturedTelegramLink, buildFeaturedTelegramTgLink } from '../../lib/top-proxies';
import { Badge } from '../ui/Badge';
import { Button, buttonStyles } from '../ui/Button';
import { Container, Section } from '../ui/LayoutPrimitives';
import { EmptyState, ErrorState, Skeleton } from '../ui/Feedback';

function FeaturedProxyCard({
  proxy,
  sourceLabels: _sourceLabels,
  index,
}: {
  proxy: FeaturedProxyRecord;
  sourceLabels: Record<string, string>;
  index: number;
}) {
  const { t, lang } = useI18n();
  const copy = useCopy();
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const link = buildFeaturedTelegramLink(proxy);
  const tgLink = buildFeaturedTelegramTgLink(proxy);
  const titleId = `featured-proxy-${proxy.id}`;
  const rank = String(proxy.rank).padStart(2, '0');
  const country = countryLabel(proxy.country, lang);
  const latency =
    proxy.latencyMs === null ? '—' : `${formatNumber(Math.round(proxy.latencyMs), lang)} ms`;

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
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.16),
        ease: 'easeOut',
      }}
      aria-labelledby={titleId}
      className="group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-3 sm:p-3.5 shadow-card transition-all duration-150 hover:border-brand/40 hover:shadow-lift"
    >
      <div>
        {/* Top Header Row: Rank, Hostname, and Latency Pill */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="num font-mono text-[10.5px] font-bold text-muted bg-surface-2 px-1.5 py-0.5 rounded-md border border-line shrink-0">
              #{rank}
            </span>
            <span
              id={titleId}
              dir="ltr"
              title={proxy.server}
              className="truncate text-[13px] font-bold text-ink"
            >
              {proxy.server}
            </span>
          </div>

          <div
            className={cn(
              'flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold font-mono',
              proxy.latencyMs !== null && proxy.latencyMs < 200
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            )}
            title={t('home.featured.latency')}
          >
            <span className="size-1.5 rounded-full bg-current" />
            <span>{latency}</span>
          </div>
        </div>

        {/* Compact Country Tag if available */}
        {country ? (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted truncate">
            <MapPin className="size-3 shrink-0 opacity-60" aria-hidden="true" />
            <span className="truncate">{country}</span>
          </div>
        ) : null}
      </div>

      {/* Main Connection CTA Row */}
      <div className="mt-3 flex items-center gap-2.5">
        <a
          href={tgLink}
          onClick={handleConnect}
          className={buttonStyles(
            'primary',
            'md',
            'flex-1 h-12 text-[14px] font-bold shadow-sm hover:shadow-md active:scale-[0.98] transition-all rounded-xl sm:rounded-2xl',
          )}
          aria-label={`${t('home.featured.connect')} — ${proxy.server}`}
          title={t('home.featured.connectHint')}
        >
          <Send className="size-4 shrink-0" aria-hidden="true" />
          <span>{t('home.featured.connect')}</span>
        </a>

        <button
          type="button"
          onClick={() => void handleCopy()}
          title={t('home.featured.copyLink')}
          aria-label={`${t('home.featured.copyLink')} — ${proxy.server}`}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-line bg-surface-2 text-muted transition hover:border-brand/40 hover:text-ink active:scale-[0.96]"
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </motion.article>
  );
}

function FeaturedProxySkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4.5 w-28 rounded-md" />
        <Skeleton className="h-4.5 w-14 rounded-full" />
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <Skeleton className="h-12 flex-1 rounded-xl sm:rounded-2xl" />
        <Skeleton className="size-12 rounded-xl sm:rounded-2xl" />
      </div>
    </div>
  );
}

export function FeaturedProxies() {
  const { t, lang } = useI18n();
  const { push } = useToast();
  const now = useNow();
  const { dataset, status, refreshing, refresh, stale } = useTopProxies();
  const proxies = dataset?.proxies ?? [];
  const sourceLabels = dataset?.sourceLabels ?? {};
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

  const handleRefresh = async () => {
    const result = await refresh();
    if (result === 'rate-limited') push(t('home.featured.refreshLimit'), 'info');
    else if (result === 'ok') push(t('home.featured.refreshDone'), 'success');
    else if (result === 'error') push(t('home.featured.error.title'), 'error');
  };

  return (
    <Section id="proxies" tone="soft" className="scroll-mt-16 pt-2 pb-4 sm:pt-3 sm:pb-6">
      <Container>
        {/* Compact Heading Row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink">
              {t('home.featured.title')}
            </h2>
            {isReady && proxies.length > 0 ? (
              <Badge tone={stale ? 'warning' : 'success'}>
                {t(stale ? 'home.featured.stale' : 'home.featured.fresh')}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[11px] text-muted hidden sm:inline"
              title={lastUpdated ? formatDateTime(lastUpdated, lang) : undefined}
            >
              {lastUpdatedLabel}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleRefresh()}
              loading={refreshing}
              iconLeft={<RefreshCw className="size-3" aria-hidden="true" />}
              className="h-8 px-2.5 text-xs rounded-xl"
            >
              {refreshing ? t('home.featured.refreshing') : t('home.featured.refresh')}
            </Button>
          </div>
        </div>

        {/* Compact Search & Filter Row */}
        {isReady && proxies.length > 0 ? (
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('directory.searchPlaceholder')}
                className="w-full rounded-xl border border-line bg-surface py-1.5 pe-7 ps-8 text-[12px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 transition-all"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('common.close')}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-all',
                  filterMode === 'all'
                    ? 'bg-brand text-white shadow-2xs'
                    : 'border border-line bg-surface text-ink-soft hover:bg-surface-2',
                )}
              >
                {t('directory.allStatuses')} ({proxies.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('fast')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-all',
                  filterMode === 'fast'
                    ? 'bg-brand text-white shadow-2xs'
                    : 'border border-line bg-surface text-ink-soft hover:bg-surface-2',
                )}
              >
                ⚡ &lt; 200 ms ({proxies.filter((p) => p.latencyMs !== null && p.latencyMs < 200).length})
              </button>
            </div>
          </div>
        ) : null}

        {/* 12 Proxies Grid: High density & responsive */}
        <div className="mt-2.5">
          {status === 'loading' && dataset === null ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => (
                <FeaturedProxySkeleton key={index} />
              ))}
            </div>
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
                  iconLeft={<X className="size-3.5" />}
                >
                  {t('directory.noMatch.clear')}
                </Button>
              }
            />
          ) : null}

          {isReady && filteredProxies.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProxies.map((proxy, index) => (
                <FeaturedProxyCard
                  key={proxy.id}
                  proxy={proxy}
                  sourceLabels={sourceLabels}
                  index={index}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

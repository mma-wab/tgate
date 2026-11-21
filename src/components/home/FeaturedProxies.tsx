import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Copy,
  MapPin,
  RefreshCw,
  Search,
  Send,
  WifiOff,
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
import { Container, Section, SectionHeading } from '../ui/LayoutPrimitives';
import { EmptyState, ErrorState, InlineNote, Skeleton } from '../ui/Feedback';

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

  const link = buildFeaturedTelegramLink(proxy);
  const tgLink = buildFeaturedTelegramTgLink(proxy);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const titleId = `featured-proxy-${proxy.id}`;
  const rank = String(proxy.rank).padStart(2, '0');
  const country = countryLabel(proxy.country, lang);
  const latency =
    proxy.latencyMs === null ? '—' : `${formatNumber(Math.round(proxy.latencyMs), lang)} ms`;

  const handleConnect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAndroid) {
      e.preventDefault();
      window.location.href = tgLink;

      const fallbackTimer = window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.open(link, '_blank', 'noopener,noreferrer');
        }
      }, 2000);

      window.addEventListener(
        'pagehide',
        () => window.clearTimeout(fallbackTimer),
        { once: true },
      );
    }
  };

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.28,
        delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.25),
        ease: 'easeOut',
      }}
      aria-labelledby={titleId}
      className="group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:border-brand/40 hover:shadow-lift motion-safe:hover:-translate-y-0.5"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="num font-bold text-[11px] text-muted bg-surface-2 px-1.5 py-0.5 rounded border border-line shrink-0">
              #{rank}
            </span>
            <span
              id={titleId}
              dir="ltr"
              title={proxy.server}
              className="truncate text-[14px] font-semibold text-ink"
            >
              {proxy.server}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-pulse-soft rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="num font-bold">⚡ {latency}</span>
          </div>
        </div>

        {country ? (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="size-3 text-muted/70 shrink-0" aria-hidden="true" />
            <span className="truncate">{country}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        <a
          href={isAndroid ? tgLink : link}
          onClick={handleConnect}
          target={isAndroid ? undefined : '_blank'}
          rel={isAndroid ? undefined : 'noopener noreferrer'}
          className={buttonStyles('primary', 'md', 'flex-1 min-h-[42px] font-semibold shadow-sm active:scale-[0.98] transition-transform')}
          aria-label={`${t('home.featured.connect')} — ${proxy.server}`}
          title={t('home.featured.connectHint')}
        >
          <Send className="size-4" aria-hidden="true" />
          <span>{t('home.featured.connect')}</span>
          {!isAndroid ? <span className="sr-only"> ({t('common.newTab')})</span> : null}
        </a>

        <button
          type="button"
          onClick={() => void copy(link, t('home.featured.copyLinkDone'))}
          title={t('home.featured.copyLink')}
          aria-label={`${t('home.featured.copyLink')} — ${proxy.server}`}
          className="inline-flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:border-brand/40 hover:bg-brand-soft/50 hover:text-brand-ink active:scale-[0.96]"
        >
          <Copy className="size-4" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}

function FeaturedProxySkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-3.5 flex items-center gap-2">
        <Skeleton className="h-[42px] flex-1 rounded-xl" />
        <Skeleton className="size-[42px] rounded-xl" />
      </div>
    </div>
  );
}

export function FeaturedProxies() {
  const { t, lang } = useI18n();
  const { push } = useToast();
  const now = useNow();
  const { dataset, status, refreshing, failed, refresh, stale } = useTopProxies();
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
    <Section id="proxies" tone="soft" className="scroll-mt-20">
      <Container>
        <SectionHeading
          eyebrow={t('home.featured.eyebrow')}
          title={t('home.featured.title')}
          description={t('home.featured.description')}
        >
          <div className="flex flex-col items-start gap-2.5 sm:flex-row sm:items-center">
            <span
              className="text-[11px] leading-5 text-muted"
              title={lastUpdated ? formatDateTime(lastUpdated, lang) : undefined}
            >
              {lastUpdatedLabel ?? (
                <span className="skeleton inline-block h-3 w-28 rounded align-middle" aria-hidden="true" />
              )}
            </span>
            {isReady && proxies.length > 0 ? (
              <Badge tone={stale ? 'warning' : 'success'}>
                {t(stale ? 'home.featured.stale' : 'home.featured.fresh')}
              </Badge>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => void handleRefresh()}
              loading={refreshing}
              iconLeft={<RefreshCw className="size-4" aria-hidden="true" />}
            >
              {refreshing ? t('home.featured.refreshing') : t('home.featured.refresh')}
            </Button>
          </div>
        </SectionHeading>

        {isReady && proxies.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('directory.searchPlaceholder')}
                className="w-full rounded-2xl border border-line bg-surface py-2.5 pe-9 ps-10 text-[13px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('common.close')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-[12px] font-semibold transition',
                  filterMode === 'all'
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-surface text-ink-soft hover:bg-surface-2',
                )}
              >
                {t('directory.allStatuses')} ({proxies.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('fast')}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-[12px] font-semibold transition',
                  filterMode === 'fast'
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-surface text-ink-soft hover:bg-surface-2',
                )}
              >
                ⚡ &lt; 200 ms ({proxies.filter((p) => p.latencyMs !== null && p.latencyMs < 200).length})
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          {status === 'loading' && dataset === null ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
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

          {isReady && failed ? (
            <InlineNote tone="warning" className="mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{t('home.featured.error.stale')}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleRefresh()}
                  iconLeft={<RefreshCw className="size-3.5" aria-hidden="true" />}
                >
                  {t('common.retry')}
                </Button>
              </div>
            </InlineNote>
          ) : null}

          {isReady && stale ? (
            <InlineNote tone="warning" className="mb-4">
              {t('home.featured.staleNotice')}
            </InlineNote>
          ) : null}

          {isReady && proxies.length === 0 ? (
            <EmptyState
              icon={WifiOff}
              title={t('home.featured.empty.title')}
              description={t('home.featured.empty.body')}
              actions={
                <Button
                  variant="secondary"
                  onClick={() => void handleRefresh()}
                  loading={refreshing}
                  iconLeft={<RefreshCw className="size-4" aria-hidden="true" />}
                >
                  {t('home.featured.refresh')}
                </Button>
              }
            />
          ) : null}

          {isReady && proxies.length > 0 && filteredProxies.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t('directory.noMatch.title')}
              description={t('directory.noMatch.body')}
              actions={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setFilterMode('all');
                  }}
                  iconLeft={<X className="size-4" />}
                >
                  {t('directory.noMatch.clear')}
                </Button>
              }
            />
          ) : null}

          {isReady && filteredProxies.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

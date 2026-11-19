import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Gauge,
  KeyRound,
  MapPin,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  WifiOff,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useCopy } from '../../hooks/useCopy';
import { useNow } from '../../hooks/useNow';
import { useTopProxies } from '../../hooks/useTopProxies';
import { useToast } from '../../contexts/ToastContext';
import type { FeaturedProxyRecord, FeaturedStatus } from '../../types/top-proxy';
import {
  countryLabel,
  featuredStatusLabel,
  formatDateTime,
  formatLatency,
  formatNumber,
  formatRelative,
  percentPrecise,
} from '../../lib/format';
import { cn } from '../../lib/cn';
import { buildFeaturedTelegramLink, buildFeaturedTelegramTgLink } from '../../lib/top-proxies';
import { Badge } from '../ui/Badge';
import { Button, buttonStyles } from '../ui/Button';
import { Container, Section, SectionHeading } from '../ui/LayoutPrimitives';
import { EmptyState, ErrorState, InlineNote, Skeleton } from '../ui/Feedback';

const statusTone: Record<FeaturedStatus, string> = {
  online: 'border-success/25 bg-success-soft text-success',
  checking: 'border-brand/25 bg-brand-soft text-brand-ink',
  offline: 'border-danger/25 bg-danger-soft text-danger',
  unknown: 'border-line bg-surface-2 text-muted',
};

const statusDot: Record<FeaturedStatus, string> = {
  online: 'bg-success',
  checking: 'bg-brand',
  offline: 'bg-danger',
  unknown: 'bg-muted',
};

function FeaturedStatusBadge({ status }: { status: FeaturedStatus }) {
  const { lang } = useI18n();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium leading-none',
        statusTone[status],
      )}
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        {status === 'online' || status === 'checking' ? (
          <span
            className={cn(
              'absolute inline-flex size-full animate-pulse-soft rounded-full opacity-70',
              statusDot[status],
            )}
          />
        ) : null}
        <span className={cn('relative inline-flex size-1.5 rounded-full', statusDot[status])} />
      </span>
      {featuredStatusLabel(status, lang)}
    </span>
  );
}

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
  const now = useNow();
  const copy = useCopy();
  const { push } = useToast();
  const reduceMotion = useReducedMotion();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const link = buildFeaturedTelegramLink(proxy);
  const tgLink = buildFeaturedTelegramTgLink(proxy);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const titleId = `featured-proxy-${proxy.id}`;
  const rank = String(proxy.rank).padStart(2, '0');
  const country = countryLabel(proxy.country, lang);
  const latency =
    proxy.latencyMs === null ? '—' : `${formatNumber(Math.round(proxy.latencyMs), lang)} ms`;
  const successRate = percentPrecise(proxy.successRate, lang);
  const lastVerified = formatRelative(proxy.verifiedAt, lang, now);

  const handleConnect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAndroid) {
      e.preventDefault();
      // On Android devices, open the native Telegram app directly via tg://
      window.location.href = tgLink;

      // Graceful fallback: If Telegram is not installed after 2s, open official web link
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

  const share = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `MTProto · ${proxy.server}`, url: link });
        push(t('home.featured.shareDone'), 'success');
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    await copy(link, t('home.featured.shareCopied'));
  };

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.28,
        delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.3),
        ease: 'easeOut',
      }}
      aria-labelledby={titleId}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-card transition duration-300 hover:border-line-strong hover:shadow-lift motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
            {t('home.featured.rank')}
            <span className="num font-bold">#{rank}</span>
          </span>
          <FeaturedStatusBadge status={proxy.status} />
        </div>
        {country ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
            <MapPin className="size-3 text-muted" aria-hidden="true" />
            {country}
          </span>
        ) : null}
      </div>

      <div className="relative z-10 mt-3.5">
        <h3
          id={titleId}
          className="ltr-data truncate text-[16px] font-semibold leading-6 text-ink"
          dir="ltr"
          title={proxy.server}
        >
          {proxy.server}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="ltr-data num text-[12px] font-medium text-ink-soft" dir="ltr">
            :{proxy.port}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-muted">
            <ShieldCheck className="size-3" aria-hidden="true" />
            {proxy.protocol}
          </span>
          <Badge tone="success" icon={<Check className="size-3" aria-hidden="true" />}>
            {t('home.featured.verifiedBadge')}
          </Badge>
        </div>
      </div>

      <dl className="mt-3.5 grid grid-cols-3 gap-2 rounded-2xl border border-line/80 bg-surface-2/40 p-2.5 text-center sm:text-start">
        <div className="min-w-0">
          <dt className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted sm:justify-start">
            <Gauge className="size-3 text-brand" aria-hidden="true" />
            {t('home.featured.latency')}
          </dt>
          <dd
            className="num mt-1 text-[13px] font-semibold text-ink"
            title={formatLatency(proxy.latencyMs, lang)}
          >
            {latency}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted sm:justify-start">
            <Check className="size-3 text-success" aria-hidden="true" />
            {t('home.featured.successRate')}
          </dt>
          <dd className="num mt-1 text-[13px] font-semibold text-success">{successRate}</dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted sm:justify-start">
            <Clock3 className="size-3 text-muted" aria-hidden="true" />
            {t('home.featured.lastVerified')}
          </dt>
          <dd
            className="mt-1 truncate text-[12px] font-medium text-ink-soft"
            title={proxy.verifiedAt ? formatDateTime(proxy.verifiedAt, lang) : undefined}
          >
            {lastVerified}
          </dd>
        </div>
      </dl>

      {detailsOpen ? (
        <div className="mt-3.5 rounded-2xl border border-brand/20 bg-brand-soft/30 p-3 text-[12px]">
          <div className="flex items-center justify-between gap-2 border-b border-brand/15 pb-2">
            <span className="font-semibold text-brand-ink flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-brand" />
              {t('details.showSecret')}
            </span>
            <button
              type="button"
              onClick={() => void copy(proxy.secret, t('details.copySecret'))}
              className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-surface px-2 py-0.5 text-[11px] font-medium text-brand-ink hover:bg-brand-soft"
            >
              <Copy className="size-3" />
              {t('details.copySecret')}
            </button>
          </div>
          <p className="mt-2 font-mono text-[11px] break-all select-all text-ink-soft ltr-data" dir="ltr">
            {proxy.secret}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted border-t border-brand/15 pt-2">
            <span>{t('details.protocolValue')}</span>
            <span className="font-medium text-ink-soft">{proxy.port}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-auto space-y-2 pt-4">
        <a
          href={isAndroid ? tgLink : link}
          onClick={handleConnect}
          target={isAndroid ? undefined : '_blank'}
          rel={isAndroid ? undefined : 'noopener noreferrer'}
          className={buttonStyles('primary', 'lg', 'w-full min-h-[44px] shadow-sm')}
          aria-label={`${t('home.featured.connect')} — ${proxy.server}`}
          title={t('home.featured.connectHint')}
        >
          <Send className="size-4" aria-hidden="true" />
          <span className="font-semibold">{t('home.featured.connect')}</span>
          {!isAndroid ? <span className="sr-only"> ({t('common.newTab')})</span> : null}
        </a>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void copy(link, t('home.featured.copyLinkDone'))}
            title={t('home.featured.copyLink')}
            aria-label={`${t('home.featured.copyLink')} — ${proxy.server}`}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink-soft transition hover:border-brand/40 hover:bg-brand-soft/50 hover:text-brand-ink"
          >
            <Copy className="size-4" aria-hidden="true" />
            <span>{t('home.featured.copyLinkShort')}</span>
          </button>

          <button
            type="button"
            onClick={() => void share()}
            title={t('home.featured.share')}
            aria-label={`${t('home.featured.share')} — ${proxy.server}`}
            className="inline-flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:border-brand/40 hover:bg-brand-soft/50 hover:text-brand-ink"
          >
            <Share2 className="size-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setDetailsOpen((prev) => !prev)}
            title={detailsOpen ? t('details.hideSecret') : t('details.showSecret')}
            aria-label={`${detailsOpen ? t('details.hideSecret') : t('details.showSecret')} — ${proxy.server}`}
            className={cn(
              'inline-flex size-[42px] shrink-0 items-center justify-center rounded-xl border transition',
              detailsOpen
                ? 'border-brand bg-brand-soft text-brand-ink'
                : 'border-line bg-surface text-muted hover:border-brand/40 hover:bg-brand-soft/50 hover:text-brand-ink',
            )}
          >
            <ChevronDown className={cn('size-4 transition-transform duration-200', detailsOpen && 'rotate-180')} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function FeaturedProxySkeleton() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-5 w-3/5" />
      <Skeleton className="mt-2 h-4 w-2/5" />
      <Skeleton className="mt-4 h-[72px] w-full rounded-2xl" />
      <Skeleton className="mt-auto h-11 w-full rounded-xl" />
      <div className="mt-2 flex items-center gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="size-10 rounded-xl" />
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
                onClick={() => setFilterMode('online')}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-[12px] font-semibold transition',
                  filterMode === 'online'
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-surface text-ink-soft hover:bg-surface-2',
                )}
              >
                {t('common.online')} ({proxies.filter((p) => p.status === 'online').length})
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

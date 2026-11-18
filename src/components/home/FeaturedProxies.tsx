import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  Gauge,
  Layers,
  ListChecks,
  Lock,
  MapPin,
  RefreshCw,
  Send,
  Server,
  Share2,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
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
import { buildFeaturedTelegramLink } from '../../lib/top-proxies';
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

function Metric({
  icon,
  label,
  value,
  valueTitle,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueTitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
        <span className="text-muted/80" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="num mt-1 text-[13px] font-semibold text-ink" title={valueTitle}>
        {value}
      </dd>
      {children}
    </div>
  );
}

function CardAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-line bg-surface px-1.5 py-2 text-[10px] font-medium leading-3 text-muted transition hover:border-brand/35 hover:bg-brand-soft/60 hover:text-brand-ink"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="text-center">{label}</span>
    </button>
  );
}

function FeaturedProxyCard({
  proxy,
  sourceLabels,
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

  const link = buildFeaturedTelegramLink(proxy);
  const titleId = `featured-proxy-${proxy.id}`;
  const rank = String(proxy.rank).padStart(2, '0');
  const country = countryLabel(proxy.country, lang);
  const latency =
    proxy.latencyMs === null ? '—' : `${formatNumber(Math.round(proxy.latencyMs), lang)} ms`;
  const successRate = percentPrecise(proxy.successRate, lang);
  const lastVerified = formatRelative(proxy.verifiedAt, lang, now);
  const sourceNames = proxy.sources.map((source) => sourceLabels[source] ?? source);
  const visibleSources = sourceNames.slice(0, 3);
  const totalChecks = proxy.successfulChecks + proxy.failedChecks;
  const serverInfo = `server: ${proxy.server}\nport: ${proxy.port}\nsecret: ${proxy.secret}`;

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
      <span
        className="pointer-events-none absolute end-3 top-1 select-none text-[3.2rem] font-semibold leading-none text-ink/[0.05]"
        aria-hidden="true"
      >
        {rank}
      </span>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand-ink">
            {t('home.featured.rank')}
            <span className="num">{rank}</span>
          </span>
          <FeaturedStatusBadge status={proxy.status} />
        </div>
        {country ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
            <MapPin className="size-3" aria-hidden="true" />
            {country}
          </span>
        ) : null}
      </div>

      <div className="relative z-10 mt-4">
        <h3 id={titleId} className="ltr-data truncate text-[17px] font-semibold leading-6 text-ink" dir="ltr">
          {proxy.server}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="ltr-data num text-[12px] text-ink-soft" dir="ltr">
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

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-2xl border border-line/80 bg-surface-2/50 p-3">
        <Metric
          icon={<Gauge className="size-3" />}
          label={t('home.featured.latency')}
          value={latency}
          valueTitle={formatLatency(proxy.latencyMs, lang)}
        />
        <Metric
          icon={<Check className="size-3" />}
          label={t('home.featured.successRate')}
          value={successRate}
        >
          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-success"
              style={{ width: `${Math.min(100, Math.max(0, proxy.successRate))}%` }}
            />
          </span>
        </Metric>
        <Metric
          icon={<Clock3 className="size-3" />}
          label={t('home.featured.lastVerified')}
          value={lastVerified}
          valueTitle={proxy.verifiedAt ? formatDateTime(proxy.verifiedAt, lang) : undefined}
        />
        <Metric
          icon={<ListChecks className="size-3" />}
          label={t('home.featured.checks')}
          value={formatNumber(proxy.successfulChecks, lang)}
          valueTitle={t('home.featured.checksHint', {
            ok: proxy.successfulChecks,
            total: totalChecks,
          })}
        />
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
          <Layers className="size-3" aria-hidden="true" />
          {t('home.featured.sources')}
        </span>
        {visibleSources.map((source) => (
          <span
            key={source}
            className="max-w-[10rem] truncate rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] text-ink-soft"
            title={source}
          >
            {source}
          </span>
        ))}
        {sourceNames.length > visibleSources.length ? (
          <span className="text-[10px] text-muted">+{sourceNames.length - visibleSources.length}</span>
        ) : null}
      </div>

      <div className="mt-auto pt-5">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles('primary', 'lg', 'w-full')}
          aria-label={`${t('home.featured.connect')} — ${proxy.server}`}
          title={t('home.featured.connectHint')}
        >
          <Send className="size-4" aria-hidden="true" />
          {t('home.featured.connect')}
          <span className="sr-only"> ({t('common.newTab')})</span>
        </a>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <CardAction
            icon={<Copy className="size-4" />}
            label={t('home.featured.copyLinkShort')}
            onClick={() => void copy(link, t('home.featured.copyLinkDone'))}
          />
          <CardAction
            icon={<Server className="size-4" />}
            label={t('home.featured.copyServerShort')}
            onClick={() => void copy(serverInfo, t('home.featured.copyServerDone'))}
          />
          <CardAction
            icon={<Share2 className="size-4" />}
            label={t('home.featured.shareShort')}
            onClick={() => void share()}
          />
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-4 text-muted">
          <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          {t('home.featured.secretNote')}
        </p>
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
      <Skeleton className="mt-4 h-[116px] w-full rounded-2xl" />
      <Skeleton className="mt-3 h-5 w-4/5" />
      <Skeleton className="mt-5 h-12 w-full rounded-xl" />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
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
    <Section id="top-proxies" tone="soft">
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
            <span className="sr-only" aria-live="polite">
              {refreshing ? t('home.featured.refreshing') : ''}
            </span>
          </div>
        </SectionHeading>

        <div className="mt-10">
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

          {isReady && proxies.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {proxies.map((proxy, index) => (
                <FeaturedProxyCard
                  key={proxy.id}
                  proxy={proxy}
                  sourceLabels={sourceLabels}
                  index={index}
                />
              ))}
            </div>
          ) : null}

          {isReady && proxies.length > 0 && proxies.length < 10 ? (
            <InlineNote tone="brand" className="mt-4">
              {t('home.featured.partial', { count: proxies.length })}
            </InlineNote>
          ) : null}
        </div>

        <InlineNote tone="neutral" className="mt-8">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p>{t('home.featured.notice')}</p>
              <Link
                to="/guidelines"
                className="mt-2 inline-flex items-center gap-1 rounded text-[12px] font-semibold text-brand-ink transition hover:text-brand-strong"
              >
                {t('home.featured.noticeCta')}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </InlineNote>
        <p className="mt-3 text-center text-[10.5px] text-muted">{t('home.featured.footerNote')}</p>
      </Container>
    </Section>
  );
}

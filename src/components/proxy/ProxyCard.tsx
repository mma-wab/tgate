import { Link } from 'react-router-dom';
import { Clock3, Gauge, MapPin, Radio } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { ProxyRecord } from '../../types/proxy';
import { countryLabel, formatLatency, formatRelative } from '../../lib/format';
import { useNow } from '../../hooks/useNow';
import { AvailabilityVerifiedBadge, StatusBadge, TrustBadge } from './StatusBadge';
import { ProxyCardActions } from './ProxyActions';
import { LatencyChart } from './LatencyChart';
import { Skeleton } from '../ui/Feedback';

export function ProxyCard({ proxy }: { proxy: ProxyRecord }) {
  const { t, lang } = useI18n();
  const now = useNow();
  const titleId = `proxy-title-${proxy.id}`;
  const lastChecked = proxy.lastChecked
    ? formatRelative(proxy.lastChecked, lang, now)
    : t('proxy.notYetChecked');
  const latency = proxy.status === 'online' ? formatLatency(proxy.latencyMs, lang) : '—';
  const country = countryLabel(proxy.country, lang);

  return (
    <article
      aria-labelledby={titleId}
      className="group relative flex h-full flex-col rounded-3xl border border-line bg-surface p-5 shadow-card transition duration-300 hover:border-line-strong hover:shadow-lift motion-safe:hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={proxy.status} />
        <TrustBadge trust={proxy.trust} />
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 id={titleId} className="min-w-0 text-[16px] font-semibold leading-6 text-ink">
            <Link to={`/proxies/${proxy.id}`} className="rounded transition hover:text-brand-ink">
              {proxy.name}
            </Link>
          </h3>
          {country ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
              <MapPin className="size-3" aria-hidden="true" />
              {country}
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="ltr-data inline-flex min-w-0 items-center truncate text-[12.5px] text-ink-soft"
            title={`${proxy.server}:${proxy.port}`}
          >
            {proxy.server}:{proxy.port}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-muted">
            <Radio className="size-2.5" aria-hidden="true" />
            {t('proxy.protocol')}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-line/80 bg-surface-2/50 p-3">
        <div>
          <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
            <Gauge className="size-3" aria-hidden="true" />
            {t('common.latency')}
          </dt>
          <dd className="num mt-1 text-[13px] font-semibold text-ink" title={t('proxy.latencyHint')}>
            {latency}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted">
            <Clock3 className="size-3" aria-hidden="true" />
            {t('common.lastChecked')}
          </dt>
          <dd className="mt-1 text-[13px] font-medium text-ink-soft">{lastChecked}</dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {t('proxy.history')}
          </span>
          <AvailabilityVerifiedBadge proxy={proxy} />
        </div>
        <LatencyChart history={proxy.history} limit={10} />
      </div>

      <div className="mt-auto pt-5">
        <ProxyCardActions proxy={proxy} name={proxy.name} />
      </div>
    </article>
  );
}

export function ProxyCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-5 w-3/5" />
      <Skeleton className="mt-2 h-3.5 w-2/5" />
      <Skeleton className="mt-4 h-[68px] w-full rounded-2xl" />
      <Skeleton className="mt-4 h-10 w-full" />
      <div className="mt-auto space-y-2 pt-5">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="size-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProxyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProxyCardSkeleton key={index} />
      ))}
    </div>
  );
}

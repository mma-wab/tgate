import type { ReactNode } from 'react';
import { Activity, Clock3, Gauge, Layers, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { DirectoryStats } from '../../types/proxy';
import {
  formatLatency,
  formatNumber,
  formatRelative,
  formatTimeShort,
  percent,
} from '../../lib/format';
import { useNow } from '../../hooks/useNow';
import { Container, Section, SectionHeading } from '../ui/LayoutPrimitives';
import { Skeleton } from '../ui/Feedback';
import { cn } from '../../lib/cn';

export function StatsSection({ stats, loading }: { stats: DirectoryStats; loading: boolean }) {
  const { t, lang } = useI18n();
  const now = useNow();

  const updatedValue = stats.lastUpdated ? formatTimeShort(stats.lastUpdated, lang) : '—';
  const updatedHint = stats.lastUpdated
    ? formatRelative(stats.lastUpdated, lang, now)
    : t('home.stats.neverHint');

  return (
    <Section tone="surface" id="live-statistics">
      <Container>
        <SectionHeading
          eyebrow={t('home.stats.eyebrow')}
          title={t('home.stats.title')}
          description={t('home.stats.subtitle')}
        />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard
            icon={<Layers className="size-4" />}
            tone="brand"
            label={t('home.stats.total')}
            value={loading ? null : formatNumber(stats.total, lang)}
            hint={t('home.stats.totalHint')}
          />
          <StatCard
            icon={<Wifi className="size-4" />}
            tone="success"
            label={t('home.stats.online')}
            value={loading ? null : formatNumber(stats.online, lang)}
            hint={
              loading
                ? t('home.stats.onlineHint')
                : `${percent(stats.availabilityRate, lang)} · ${t('home.stats.onlineHint')}`
            }
          />
          <StatCard
            icon={<WifiOff className="size-4" />}
            tone="danger"
            label={t('home.stats.offline')}
            value={loading ? null : formatNumber(stats.offline, lang)}
            hint={t('home.stats.offlineCountHint')}
          />
          <StatCard
            icon={<Gauge className="size-4" />}
            tone="warning"
            label={t('home.stats.avgLatency')}
            value={
              loading ? null : stats.averageLatencyMs === null ? '—' : formatNumber(stats.averageLatencyMs, lang)
            }
            unit={stats.averageLatencyMs === null ? undefined : 'ms'}
            hint={t('home.stats.avgHint')}
            valueTitle={
              stats.averageLatencyMs === null
                ? undefined
                : formatLatency(stats.averageLatencyMs, lang)
            }
          />
          <StatCard
            icon={<Clock3 className="size-4" />}
            tone="neutral"
            label={t('home.stats.updated')}
            value={loading ? null : updatedValue}
            hint={loading ? t('home.stats.updatedHint') : updatedHint}
            className="col-span-2 lg:col-span-1"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {stats.unknown > 0 ? (
            <p className="flex items-start gap-2 text-[12px] leading-5 text-muted">
              <Activity className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              {t('home.stats.unknownNote', { count: formatNumber(stats.unknown, lang) })}
            </p>
          ) : (
            <p className="text-[12px] text-muted">{t('home.stats.verified')}: {formatNumber(stats.verifiedCount, lang)}</p>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
            {t('directory.verificationNote')}
          </span>
        </div>
      </Container>
    </Section>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  hint,
  tone,
  className,
  valueTitle,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  unit?: string;
  hint: string;
  tone: 'brand' | 'success' | 'danger' | 'warning' | 'neutral';
  className?: string;
  valueTitle?: string;
}) {
  const tones = {
    brand: 'bg-brand-soft text-brand',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-warning',
    neutral: 'bg-surface-2 text-ink-soft',
  };

  return (
    <div
      className={cn(
        'flex min-h-[144px] flex-col rounded-2xl border border-line bg-surface p-4 shadow-card',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('flex size-8 items-center justify-center rounded-lg', tones[tone])}>
          {icon}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</span>
      </div>
      <div className="mt-auto pt-6">
        {value === null ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p
            className="num flex items-baseline gap-1.5 text-[1.65rem] font-semibold leading-none text-ink"
            title={valueTitle}
          >
            {value}
            {unit ? <span className="text-[11px] font-medium text-muted">{unit}</span> : null}
          </p>
        )}
        <p className="mt-2 line-clamp-2 text-[10.5px] leading-4 text-muted">{hint}</p>
      </div>
    </div>
  );
}

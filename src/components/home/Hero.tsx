import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Radio,
  ShieldCheck,
  Sparkles,
  UserRoundX,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import type { DirectoryStats } from '../../types/proxy';
import { formatLatency, formatNumber, formatRelative, percent } from '../../lib/format';
import { useNow } from '../../hooks/useNow';
import { Container } from '../ui/LayoutPrimitives';
import { buttonStyles } from '../ui/Button';
import { GithubIcon } from '../ui/icons';
import { Skeleton } from '../ui/Feedback';
import { cn } from '../../lib/cn';

export function Hero({ stats, loading }: { stats: DirectoryStats; loading: boolean }) {
  const { t, lang, isRTL } = useI18n();
  const reduceMotion = useReducedMotion();
  const now = useNow();
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;
  const ringCircumference = 2 * Math.PI * 76;
  const rate = stats.availabilityRate ?? 0;
  const dash = (rate / 100) * ringCircumference;
  const updatedLabel = stats.lastUpdated
    ? formatRelative(stats.lastUpdated, lang, now)
    : t('home.hero.awaitingSync');

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section className="relative overflow-hidden">
      <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:py-24">
        <motion.div {...motionProps}>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-surface/80 px-3 py-1.5 text-[11px] font-semibold text-brand-ink shadow-card backdrop-blur">
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-pulse-soft rounded-full bg-brand" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
            </span>
            {t('home.hero.eyebrow')}
          </span>

          <h1 className="mt-6 text-[2.15rem] font-semibold leading-[1.14] tracking-[-0.03em] text-ink sm:text-[2.85rem] lg:text-[3.35rem]">
            {t('home.hero.title')}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {t('home.hero.subtitle')}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/proxies" className={buttonStyles('primary', 'lg', 'group')}>
              {t('home.hero.ctaPrimary')}
              <ForwardIcon
                className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link to="/how-it-works" className={buttonStyles('secondary', 'lg')}>
              <Sparkles className="size-4 text-brand" aria-hidden="true" />
              {t('home.hero.ctaSecondary')}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12px] text-muted">
            <li className="inline-flex items-center gap-1.5">
              <UserRoundX className="size-3.5 text-brand" aria-hidden="true" />
              {t('home.hero.trustLogin')}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-brand" aria-hidden="true" />
              {t('home.hero.trustChecks')}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <GithubIcon className="size-3.5 text-brand" />
              {t('home.hero.trustOpen')}
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="relative"
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 18, scale: 0.985 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] as const },
              })}
        >
          <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-[radial-gradient(65%_65%_at_50%_40%,var(--brand-soft),transparent)]" aria-hidden="true" />

          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface/95 shadow-lift backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <div>
                <p className="text-[13px] font-semibold text-ink">{t('home.hero.panelTitle')}</p>
                <p className="mt-0.5 text-[11px] text-muted">{t('home.hero.panelSubtitle')}</p>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                  stats.lastUpdated
                    ? 'border-success/25 bg-success-soft text-success'
                    : 'border-warning/25 bg-warning-soft text-warning',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    stats.lastUpdated ? 'bg-success animate-pulse-soft' : 'bg-warning',
                  )}
                  aria-hidden="true"
                />
                {stats.lastUpdated ? t('home.hero.liveData') : t('home.hero.awaitingSync')}
              </span>
            </div>

            <div className="px-5 pb-5 pt-6 sm:px-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative size-[168px] shrink-0">
                  <svg viewBox="0 0 180 180" className="size-full -rotate-90" aria-hidden="true">
                    <defs>
                      <linearGradient id="hero-ring" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#42c2f4" />
                        <stop offset="100%" stopColor="#168ac0" />
                      </linearGradient>
                    </defs>
                    <circle cx="90" cy="90" r="76" fill="none" stroke="var(--line)" strokeWidth="9" />
                    <circle
                      cx="90"
                      cy="90"
                      r="76"
                      fill="none"
                      stroke="url(#hero-ring)"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${ringCircumference}`}
                      className="transition-[stroke-dasharray] duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {loading ? (
                      <Skeleton className="h-9 w-16" />
                    ) : (
                      <span className="num text-[2.1rem] font-semibold leading-none text-ink">
                        {formatNumber(stats.total, lang)}
                      </span>
                    )}
                    <span className="mt-2 max-w-[7.5rem] text-[11px] leading-4 text-muted">
                      {t('home.hero.panelTotal')}
                    </span>
                    {!loading && stats.total > 0 ? (
                      <span className="mt-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                        {percent(stats.availabilityRate, lang)} {t('common.online')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <MiniStat
                    icon={<Radio className="size-3.5" />}
                    label={t('home.hero.panelOnline')}
                    value={
                      loading ? null : formatNumber(stats.online, lang)
                    }
                    tone="success"
                  />
                  <MiniStat
                    icon={<Gauge className="size-3.5" />}
                    label={t('home.hero.panelLatency')}
                    value={loading ? null : formatLatency(stats.averageLatencyMs, lang)}
                    tone="brand"
                  />
                  <MiniStat
                    icon={<CheckCircle2 className="size-3.5" />}
                    label={t('home.hero.panelUpdated')}
                    value={updatedLabel}
                    tone="neutral"
                  />
                </div>
              </div>

              {!loading && stats.total === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-surface-2/50 px-4 py-3">
                  <p className="text-[12px] font-semibold text-ink">{t('home.hero.emptyTitle')}</p>
                  <Link
                    to="/submit"
                    className="mt-1 inline-flex text-[11px] font-medium text-brand-ink hover:underline"
                  >
                    {t('home.hero.emptyCta')}
                  </Link>
                </div>
              ) : null}

              <Link
                to="/proxies"
                className={buttonStyles('secondary', 'md', 'mt-5 w-full')}
              >
                {t('home.hero.panelCta')}
                <ForwardIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="absolute -start-3 top-16 hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[10px] font-medium text-ink-soft shadow-card lg:flex">
            <span className="flex size-6 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Radio className="size-3" aria-hidden="true" />
            </span>
            <span className="ltr-data">MTProto · TCP</span>
          </div>
          <div className="absolute -end-2 bottom-20 hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[10px] font-medium text-ink-soft shadow-card lg:flex">
            <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
            <span>GitHub Actions</span>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  tone: 'success' | 'brand' | 'neutral';
}) {
  const tones = {
    success: 'bg-success-soft text-success',
    brand: 'bg-brand-soft text-brand',
    neutral: 'bg-surface-2 text-ink-soft',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line/70 bg-surface px-3 py-2.5">
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
        {value === null ? (
          <Skeleton className="mt-1 h-3.5 w-14" />
        ) : (
          <p className="num mt-0.5 truncate text-[12.5px] font-semibold text-ink">{value}</p>
        )}
      </div>
    </div>
  );
}

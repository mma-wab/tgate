import { motion, useReducedMotion } from 'framer-motion';
import { Check, Copy, Send, Zap } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../i18n';
import type { DirectoryStats } from '../../types/proxy';
import type { FeaturedProxyRecord } from '../../types/top-proxy';
import { buildFeaturedTelegramLink, buildFeaturedTelegramTgLink } from '../../lib/top-proxies';
import { formatLatency, formatNumber } from '../../lib/format';
import { Container } from '../ui/LayoutPrimitives';
import { buttonStyles } from '../ui/Button';
import { useCopy } from '../../hooks/useCopy';
import {
  PaperPlaneDoodle,
  SparkleDoodle,
  SquiggleUnderline,
} from '../ui/Doodles';

export function Hero({
  stats,
  loading,
  topProxy,
}: {
  stats: DirectoryStats;
  loading: boolean;
  topProxy?: FeaturedProxyRecord | null;
}) {
  const { t, lang } = useI18n();
  const copy = useCopy();
  const reduceMotion = useReducedMotion();
  const [copiedFastest, setCopiedFastest] = useState(false);

  const link = topProxy ? buildFeaturedTelegramLink(topProxy) : '';
  const tgLink = topProxy ? buildFeaturedTelegramTgLink(topProxy) : '';

  const handleConnect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (topProxy) {
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

  const handleCopy = async () => {
    if (!link) return;
    const ok = await copy(link, t('home.featured.copyLinkDone'));
    if (ok) {
      setCopiedFastest(true);
      window.setTimeout(() => setCopiedFastest(false), 2000);
    }
  };

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section id="top" className="relative overflow-hidden pt-3 pb-2 sm:pt-5 sm:pb-3 scroll-mt-16">
      {/* Subtle decorative doodles */}
      <div className="pointer-events-none absolute -start-6 top-4 opacity-30 dark:opacity-20 sm:start-4 sm:top-6" aria-hidden="true">
        <SparkleDoodle className="size-6 text-brand" />
      </div>
      <div className="pointer-events-none absolute end-2 top-3 opacity-40 sm:end-8 sm:top-5" aria-hidden="true">
        <PaperPlaneDoodle className="size-10 sm:size-12 text-brand" />
      </div>

      <Container className="relative max-w-2xl text-center">
        <motion.div {...motionProps} className="mx-auto flex flex-col items-center">
          {/* Compact Live Status Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-[11.5px] font-medium text-ink-soft shadow-2xs">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-pulse-soft rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span>
              {loading ? (
                t('common.loading')
              ) : stats.online > 0 ? (
                <>
                  <strong className="num text-ink">{formatNumber(stats.online, lang)}</strong>{' '}
                  {t('home.hero.panelOnline')} ·{' '}
                  <strong className="num text-ink font-mono">
                    {formatLatency(stats.averageLatencyMs, lang)}
                  </strong>
                </>
              ) : (
                t('home.hero.liveData')
              )}
            </span>
          </div>

          {/* Clean Title with Hand-Drawn Squiggle */}
          <div className="relative mt-2.5 inline-block">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {t('home.hero.title')}
            </h1>
            <div className="mt-0.5 flex justify-center">
              <SquiggleUnderline className="h-2.5 w-36 text-brand sm:w-48" />
            </div>
          </div>

          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted sm:text-[14.5px]">
            {t('home.hero.subtitle')}
          </p>

          {/* Compact Quick Connect Bar */}
          {topProxy ? (
            <div className="mt-3.5 flex w-full max-w-md items-center justify-between gap-2 rounded-2xl border border-line bg-surface p-1.5 ps-3 shadow-card transition-all hover:border-brand/40">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Zap className="size-3.5 fill-brand text-brand" aria-hidden="true" />
                </span>
                <div className="min-w-0 text-start">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px] font-bold text-ink">
                      {t('home.hero.fastestCta')}
                    </span>
                    {topProxy.latencyMs !== null ? (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10.5px] font-bold text-emerald-600 font-mono">
                        {Math.round(topProxy.latencyMs)}ms
                      </span>
                    ) : null}
                  </div>
                  <p dir="ltr" className="truncate font-mono text-[11px] text-muted max-w-[150px] sm:max-w-[180px]">
                    {topProxy.server}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={tgLink}
                  onClick={handleConnect}
                  className={buttonStyles(
                    'primary',
                    'sm',
                    'h-9 px-3.5 text-[12.5px] font-bold shadow-xs active:scale-[0.98]',
                  )}
                  aria-label={`${t('home.featured.connect')} — ${topProxy.server}`}
                >
                  <Send className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{t('home.featured.connect')}</span>
                </a>

                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  title={t('home.featured.copyLink')}
                  aria-label={t('home.featured.copyLink')}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted transition hover:border-brand/40 hover:text-ink active:scale-[0.96]"
                >
                  {copiedFastest ? (
                    <Check className="size-3.5 text-success" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </Container>
    </section>
  );
}

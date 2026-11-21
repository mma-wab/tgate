import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, Check, Copy, Send, Zap } from 'lucide-react';
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
  HandDrawnArrow,
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
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section id="top" className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-16 scroll-mt-20">
      {/* Decorative Hand-Drawn Elements */}
      <div className="pointer-events-none absolute -start-10 top-12 opacity-40 dark:opacity-20 sm:start-8 sm:top-16" aria-hidden="true">
        <SparkleDoodle className="size-8 text-brand/70" />
      </div>
      <div className="pointer-events-none absolute end-4 top-10 opacity-60 transition-transform duration-500 hover:rotate-6 sm:end-14 sm:top-14" aria-hidden="true">
        <PaperPlaneDoodle className="size-14 text-brand sm:size-16" />
      </div>

      <Container className="relative max-w-3xl text-center">
        <motion.div {...motionProps} className="mx-auto flex flex-col items-center">
          {/* Friendly Hand-Drawn Pill Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft shadow-xs">
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
                  <strong className="num text-ink">
                    {formatLatency(stats.averageLatencyMs, lang)}
                  </strong>{' '}
                  {t('home.featured.latency')}
                </>
              ) : (
                t('home.hero.liveData')
              )}
            </span>
          </div>

          {/* Main Title with Hand-Drawn Squiggle Underline */}
          <div className="relative mt-5 inline-block">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-[1.2]">
              {t('home.hero.title')}
            </h1>
            <div className="mt-1 flex justify-center">
              <SquiggleUnderline className="h-3.5 w-44 text-brand sm:w-56" />
            </div>
          </div>

          <p className="mt-3.5 max-w-xl text-[15px] leading-7 text-muted sm:text-[17px] sm:leading-8">
            {t('home.hero.subtitle')}
          </p>

          {/* Primary Telegram Connection Focus Card */}
          {topProxy ? (
            <div className="mt-7 w-full max-w-lg rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6 transition-all hover:border-brand/40 hover:shadow-lift">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3.5 text-start">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Zap className="size-4 fill-brand text-brand" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-[12px] font-bold text-ink">
                      {t('home.hero.fastestCta')}
                    </span>
                    <p dir="ltr" className="font-mono text-[11.5px] text-muted truncate max-w-[200px] sm:max-w-xs">
                      {topProxy.server}:{topProxy.port}
                    </p>
                  </div>
                </div>

                {topProxy.latencyMs !== null ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>{Math.round(topProxy.latencyMs)} ms</span>
                  </div>
                ) : null}
              </div>

              {/* Main One-Click Connect Button */}
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <a
                  href={tgLink}
                  onClick={handleConnect}
                  className={buttonStyles(
                    'primary',
                    'lg',
                    'flex-1 text-[15px] font-bold tracking-tight shadow-md transition-all active:scale-[0.98]',
                  )}
                  aria-label={`${t('home.featured.connect')} — ${topProxy.server}`}
                >
                  <Send className="size-4 shrink-0" aria-hidden="true" />
                  <span>{t('home.featured.connect')}</span>
                </a>

                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  title={t('home.featured.copyLink')}
                  aria-label={t('home.featured.copyLink')}
                  className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface-2 px-4 text-xs font-semibold text-muted transition hover:border-brand/40 hover:text-ink active:scale-[0.97]"
                >
                  {copiedFastest ? (
                    <>
                      <Check className="size-4 text-success" aria-hidden="true" />
                      <span className="text-success">{t('common.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" aria-hidden="true" />
                      <span>{t('home.featured.copyLinkShort')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {/* Secondary Action with Hand-Drawn Arrow */}
          <div className="mt-6 flex flex-col items-center">
            <a
              href="#proxies"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand transition-colors"
            >
              <span>{t('home.hero.browseCta')}</span>
              <ArrowDown className="size-3.5" aria-hidden="true" />
            </a>
            <div className="mt-1 hidden sm:block">
              <HandDrawnArrow className="h-7 text-muted/60" />
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

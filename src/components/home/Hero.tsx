import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { useI18n } from '../../i18n';
import type { DirectoryStats } from '../../types/proxy';
import type { FeaturedProxyRecord } from '../../types/top-proxy';
import { buildFeaturedTelegramLink, buildFeaturedTelegramTgLink } from '../../lib/top-proxies';
import { formatLatency, formatNumber, formatRelative } from '../../lib/format';
import { Container } from '../ui/LayoutPrimitives';
import { useCopy } from '../../hooks/useCopy';
import { useNow } from '../../hooks/useNow';
import { Skeleton } from '../ui/Feedback';
import { SketchRuleDashed, SquiggleUnderline, TelegramSketch } from '../ui/Doodles';
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  TelegramPlaneIcon,
} from '../ui/SketchIcons';

/**
 * Hero: one clear sentence, live availability, and the single most prominent
 * action in the product — connecting the fastest verified proxy.
 */
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
  const now = useNow();
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
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
      };

  const online = stats.online;
  const latency = stats.averageLatencyMs;
  const lastChecked = topProxy?.verifiedAt
    ? formatRelative(topProxy.verifiedAt, lang, now)
    : null;

  return (
    <section id="top" className="relative scroll-mt-20 overflow-hidden">
      <Container className="grid gap-8 pt-8 pb-4 sm:pt-12 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-center lg:gap-2">
        <motion.div {...motionProps} className="min-w-0">
          {/* Live availability, always visible above the fold */}
          <div className="sketch-pill inline-flex items-center gap-2 bg-surface px-3.5 py-1.5 text-[12px] font-semibold text-ink-soft">
            <span className="relative flex size-2.5" aria-hidden="true">
              <span className="absolute inset-0 animate-pulse-soft rounded-full bg-success/35" />
              <span className="relative m-auto size-2 rounded-full bg-success" />
            </span>
            {loading ? (
              <span>{t('common.loading')}</span>
            ) : online > 0 ? (
              <span>
                <strong className="num font-bold text-ink">
                  {formatNumber(online, lang)}
                </strong>{' '}
                {t('home.hero.panelOnline')}
                {latency !== null ? (
                  <>
                    <span className="text-muted"> · </span>
                    <span className="num font-mono">{formatLatency(latency, lang)}</span>
                  </>
                ) : null}
              </span>
            ) : (
              <span>{t('home.hero.liveData')}</span>
            )}
          </div>

          <h1 className="mt-5 max-w-xl text-[2rem] leading-[1.12] font-extrabold tracking-tight text-ink sm:text-[2.9rem]">
            {t('home.hero.title')}
          </h1>
          <div className="mt-1 flex">
            <SquiggleUnderline className="h-2.5 w-32 text-brand sm:w-44" />
          </div>

          <p className="mt-4 max-w-md text-[14px] leading-7 text-muted sm:text-[15px]">
            {t('home.hero.subtitle')}
          </p>

          {/* The one obvious action */}
          <div className="mt-7 max-w-md">
            {topProxy ? (
              <>
                <a
                  href={tgLink}
                  onClick={handleConnect}
                  aria-label={`${t('home.featured.connect')} — ${topProxy.server}`}
                  className="sketch-pill group flex h-15 w-full items-center justify-center gap-3 border-brand-strong bg-brand px-6 text-white transition-colors duration-150 hover:bg-brand-strong active:translate-y-px sm:h-16"
                >
                  <TelegramPlaneIcon className="size-6 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  <span className="text-[16.5px] font-bold sm:text-[17.5px]">
                    {t('home.featured.connect')}
                  </span>
                </a>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span dir="ltr" className="ltr-data truncate text-[12px] text-muted">
                    {topProxy.server}:{topProxy.port}
                  </span>
                  {topProxy.latencyMs !== null ? (
                    <span dir="ltr" className="num font-mono text-[12px] text-muted">
                      {Math.round(topProxy.latencyMs)} ms
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="sketch-sm inline-flex h-9 items-center gap-1.5 bg-surface px-3 text-[12.5px] font-semibold text-ink-soft transition hover:border-brand/50 hover:text-brand"
                    title={t('home.featured.copyLink')}
                    aria-label={`${t('home.featured.copyLink')} — ${topProxy.server}`}
                  >
                    {copiedFastest ? (
                      <CheckIcon className="size-4 text-success" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                    {copiedFastest ? t('common.copied') : t('home.featured.copyLink')}
                  </button>
                </div>

                {lastChecked ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-muted">
                    <ClockIcon className="size-3.5" />
                    {t('home.featured.lastVerified')}: {lastChecked}
                  </p>
                ) : null}
              </>
            ) : loading ? (
              <Skeleton className="sketch-pill h-15 w-full sm:h-16" />
            ) : (
              <div className="sketch-dashed p-4">
                <p className="text-sm font-semibold text-ink">{t('home.hero.emptyTitle')}</p>
                <a
                  href="#proxies"
                  className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-strong"
                >
                  {t('home.hero.browseCta')}
                </a>
              </div>
            )}
          </div>
        </motion.div>

        {/* Hand-drawn scene: the only decorative element in the hero */}
        <div className="relative mx-auto hidden w-full max-w-[280px] sm:block" aria-hidden="true">
          <TelegramSketch className="w-full" />
        </div>
      </Container>

      <Container>
        <SketchRuleDashed />
      </Container>
    </section>
  );
}

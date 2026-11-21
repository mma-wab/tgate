import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Zap } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { DirectoryStats } from '../../types/proxy';
import type { FeaturedProxyRecord } from '../../types/top-proxy';
import { buildFeaturedTelegramLink, buildFeaturedTelegramTgLink } from '../../lib/top-proxies';
import { formatLatency, formatNumber } from '../../lib/format';
import { Container } from '../ui/LayoutPrimitives';
import { buttonStyles } from '../ui/Button';

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
  const reduceMotion = useReducedMotion();

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

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section id="top" className="relative overflow-hidden pt-8 pb-6 sm:pt-10 sm:pb-8 lg:pt-12 lg:pb-8 scroll-mt-20">
      <Container className="relative max-w-4xl text-center">
        <motion.div {...motionProps} className="mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-surface/90 px-3.5 py-1.5 text-[12px] font-medium text-ink-soft shadow-sm backdrop-blur">
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

          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-5xl sm:leading-[1.15]">
            {t('home.hero.title')}
          </h1>

          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted sm:text-lg sm:leading-8">
            {t('home.hero.subtitle')}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {topProxy ? (
              <a
                href={tgLink}
                onClick={handleConnect}
                className={buttonStyles('primary', 'lg', 'group shadow-md hover:shadow-lg active:scale-[0.98] transition-all')}
              >
                <Zap className="size-4 text-amber-300 fill-amber-300" aria-hidden="true" />
                <span className="font-semibold">{t('home.hero.fastestCta')}</span>
                {topProxy.latencyMs !== null ? (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono font-medium">
                    {Math.round(topProxy.latencyMs)}ms
                  </span>
                ) : null}
              </a>
            ) : null}
            <a href="#proxies" className={buttonStyles(topProxy ? 'secondary' : 'primary', 'lg', 'group')}>
              <span>{t('home.hero.browseCta')}</span>
              <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

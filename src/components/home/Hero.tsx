import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { DirectoryStats } from '../../types/proxy';
import { formatLatency, formatNumber } from '../../lib/format';
import { Container } from '../ui/LayoutPrimitives';
import { buttonStyles } from '../ui/Button';

export function Hero({ stats, loading }: { stats: DirectoryStats; loading: boolean }) {
  const { t, lang, isRTL } = useI18n();
  const reduceMotion = useReducedMotion();
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
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

          <h1 className="mt-6 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-5xl sm:leading-[1.15]">
            {t('home.hero.title')}
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-lg sm:leading-8">
            {t('home.hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#top-proxies" className={buttonStyles('primary', 'lg', 'group')}>
              <span>{t('home.hero.ctaPrimary')}</span>
              <ForwardIcon
                className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <Link to="/how-it-works" className={buttonStyles('secondary', 'lg')}>
              <Sparkles className="size-4 text-brand" aria-hidden="true" />
              <span>{t('home.hero.ctaSecondary')}</span>
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

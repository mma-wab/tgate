import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Eye,
  ExternalLink,
  KeyRound,
  Layers3,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { usePageMeta } from '../hooks/usePageMeta';
import { securityContent } from '../i18n/content';
import { siteConfig } from '../config/site';
import { PageHeader, Section, Container } from '../components/ui/LayoutPrimitives';
import { buttonStyles } from '../components/ui/Button';
import { InlineNote } from '../components/ui/Feedback';
import { Badge } from '../components/ui/Badge';

export default function Security() {
  const { t, lang, isRTL } = useI18n();
  const content = securityContent[lang];
  const Forward = isRTL ? ArrowLeft : ArrowRight;

  usePageMeta({
    title: t('meta.security.title'),
    description: t('meta.security.description'),
    path: '/security',
  });

  const levelTones = ['success', 'brand', 'neutral', 'warning'] as const;

  return (
    <>
      <PageHeader
        eyebrow={t('security.eyebrow')}
        title={t('security.title')}
        description={t('security.subtitle')}
      >
        <a
          href={siteConfig.telegramProxyFaqUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles('secondary', 'md')}
        >
          {t('security.official')}
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
        <Link to="/faq" className={buttonStyles('ghost', 'md')}>
          {t('footer.faq')}
          <Forward className="size-4" aria-hidden="true" />
        </Link>
      </PageHeader>

      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] border border-warning/30 bg-warning-soft/60 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-warning shadow-card">
                <ShieldAlert className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">{t('security.callout.title')}</h2>
                <p className="mt-2 max-w-3xl text-[13.5px] leading-7 text-ink-soft">{t('security.callout.body')}</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-semibold sm:text-2xl">{t('security.compare.title')}</h2>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-7 text-muted">{t('security.compare.intro')}</p>
            <div className="mt-5 overflow-x-auto rounded-3xl border border-line bg-surface shadow-card">
              <table className="w-full min-w-[38rem] border-collapse text-[13px]">
                <caption className="sr-only">{t('security.compare.title')}</caption>
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-[11px] uppercase tracking-wide text-muted">
                    <th scope="col" className="p-4 text-start font-semibold">
                      {t('common.note')}
                    </th>
                    <th scope="col" className="p-4 text-start font-semibold text-brand-ink">
                      MTProto
                    </th>
                    <th scope="col" className="p-4 text-start font-semibold">
                      SOCKS5
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {content.comparison.map((row) => (
                    <tr key={row.label} className="border-b border-line/70 last:border-0">
                      <th scope="row" className="p-4 text-start align-top font-medium text-ink">
                        {row.label}
                      </th>
                      <td className="p-4 align-top leading-6 text-ink-soft">{row.mtproto}</td>
                      <td className="p-4 align-top leading-6 text-muted">{row.socks5}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Eye className="size-5 text-brand" aria-hidden="true" />
                {t('security.visibility.title')}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-muted">{t('security.visibility.intro')}</p>
              <ul className="mt-4 space-y-3">
                {content.visibility.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-ink-soft">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
                {t('security.levels.title')}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-muted">{t('security.levels.intro')}</p>
              <ul className="mt-4 space-y-3">
                {content.levels.map((level, index) => (
                  <li key={level.label} className="rounded-2xl border border-line bg-surface-2/40 p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={levelTones[index] ?? 'neutral'}>{level.label}</Badge>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-6 text-muted">{level.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Layers3 className="size-5 text-brand" aria-hidden="true" />
                {t('security.encryption.title')}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-muted">{t('security.encryption.intro')}</p>
              <ul className="mt-4 space-y-3">
                {content.encryption.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-ink-soft">
                    <KeyRound className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <BadgeCheck className="size-5 text-brand" aria-hidden="true" />
                {t('security.practices.title')}
              </h2>
              <ul className="mt-4 space-y-3">
                {content.practices.map((item, index) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-ink"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="text-[13px] leading-6 text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <InlineNote tone="neutral" className="mt-8">
            <span className="inline-flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
              {t('security.disclaimer')}
            </span>
          </InlineNote>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/proxies" className={buttonStyles('primary', 'md')}>
              {t('nav.proxies')}
              <Forward className="size-4" aria-hidden="true" />
            </Link>
            <Link to="/guidelines" className={buttonStyles('secondary', 'md')}>
              {t('footer.guidelines')}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}

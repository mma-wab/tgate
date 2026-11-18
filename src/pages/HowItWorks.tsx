import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Link2,
  Monitor,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { usePageMeta } from '../hooks/usePageMeta';
import { platformGuides, howContent, type PlatformId } from '../i18n/content';
import { siteConfig } from '../config/site';
import { PageHeader, Section, Container } from '../components/ui/LayoutPrimitives';
import { Tabs, TabPanel, type TabItem } from '../components/ui/Tabs';
import { buttonStyles } from '../components/ui/Button';
import { InlineNote } from '../components/ui/Feedback';

const PLATFORM_ICONS = {
  android: Smartphone,
  ios: TabletSmartphone,
  windows: Monitor,
  desktop: Monitor,
};

export default function HowItWorks() {
  const { t, lang, isRTL } = useI18n();
  const [platform, setPlatform] = useState<PlatformId>('android');
  const guide = platformGuides[platform][lang];
  const content = howContent[lang];

  usePageMeta({
    title: t('meta.how.title'),
    description: t('meta.how.description'),
    path: '/how-it-works',
  });

  const items: Array<TabItem<PlatformId>> = [
    { id: 'android', label: t('how.tab.android'), icon: PLATFORM_ICONS.android },
    { id: 'ios', label: t('how.tab.ios'), icon: PLATFORM_ICONS.ios },
    { id: 'windows', label: t('how.tab.windows'), icon: PLATFORM_ICONS.windows },
    { id: 'desktop', label: t('how.tab.desktop'), icon: PLATFORM_ICONS.desktop },
  ];

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      <PageHeader
        eyebrow={t('how.eyebrow')}
        title={t('how.title')}
        description={t('how.subtitle')}
      >
        <Link to="/proxies" className={buttonStyles('primary', 'md')}>
          {t('nav.proxies')}
          <Arrow className="size-4" aria-hidden="true" />
        </Link>
        <a
          href={siteConfig.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles('secondary', 'md')}
        >
          {t('security.official')}
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </PageHeader>

      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="rounded-3xl border border-brand/15 bg-brand-soft/40 p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surface text-brand shadow-card">
                <Link2 className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{t('how.link.title')}</h2>
              <p className="mt-2 text-[13.5px] leading-7 text-ink-soft">{t('how.link.body')}</p>
              <InlineNote tone="brand" className="mt-4">
                <span className="inline-flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {t('how.link.note')}
                </span>
              </InlineNote>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
              <h2 className="text-lg font-semibold">{t('how.manual.title')}</h2>
              <p className="mt-2 text-[13.5px] leading-7 text-muted">{t('how.manual.body')}</p>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: t('common.server'), value: t('submit.serverHint') },
                  { label: t('common.port'), value: t('submit.portHint') },
                  { label: t('common.secret'), value: t('submit.secretHint') },
                ].map((item) => (
                  <li key={item.label} className="rounded-xl border border-line bg-surface-2/50 px-3 py-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{item.label}</p>
                    <p className="mt-1 text-[11.5px] leading-5 text-ink-soft">{item.value}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-5 text-muted">{content.linkFirst}</p>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-semibold sm:text-2xl">{t('how.platforms')}</h2>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
              <Tabs
                items={items}
                value={platform}
                onChange={setPlatform}
                ariaLabel={t('how.title')}
                className="lg:flex-col lg:items-stretch"
              />
              <div className="min-w-0 flex-1">
                {items.map((item) => (
                  <TabPanel key={item.id} id={item.id} active={platform === item.id}>
                    <div className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
                      <p className="text-[13.5px] leading-7 text-ink-soft">{guide.intro}</p>
                      <ol className="mt-5 space-y-4">
                        {guide.steps.map((step, index) => (
                          <li key={step.title} className="flex gap-3.5">
                            <span
                              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand-ink"
                              aria-hidden="true"
                            >
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="text-[14px] font-semibold text-ink">{step.title}</h3>
                              <p className="mt-1 text-[13px] leading-6 text-muted">{step.body}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <InlineNote tone="neutral" className="mt-5">
                        <span className="inline-flex items-start gap-2">
                          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                          {guide.note}
                        </span>
                      </InlineNote>
                    </div>
                  </TabPanel>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-surface p-6">
              <h2 className="text-lg font-semibold">{t('how.what.title')}</h2>
              <ul className="mt-4 space-y-3">
                {content.what.map((paragraph) => (
                  <li key={paragraph} className="flex items-start gap-2.5 text-[13px] leading-7 text-muted">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />
                    {paragraph}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-line bg-surface p-6">
              <h2 className="text-lg font-semibold">{t('how.why.title')}</h2>
              <ul className="mt-4 space-y-3">
                {content.why.map((paragraph) => (
                  <li key={paragraph} className="flex items-start gap-2.5 text-[13px] leading-7 text-muted">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />
                    {paragraph}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-warning/25 bg-warning-soft/50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
              <div>
                <h2 className="text-[14px] font-semibold text-ink">{t('how.note.title')}</h2>
                <p className="mt-1 text-[13px] leading-6 text-ink-soft">{t('how.note.body')}</p>
              </div>
            </div>
            <Link to="/security" className={buttonStyles('secondary', 'md', 'shrink-0')}>
              {t('how.helpCta')}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}

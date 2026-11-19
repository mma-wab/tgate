import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  ExternalLink,
  Mail,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';
import { useI18n } from '../i18n';
import { usePageMeta } from '../hooks/usePageMeta';
import { siteConfig } from '../config/site';
import { PageHeader, Section, Container } from '../components/ui/LayoutPrimitives';
import { buttonStyles } from '../components/ui/Button';
import { InlineNote } from '../components/ui/Feedback';

export default function About() {
  const { t, isRTL } = useI18n();
  const Forward = isRTL ? ArrowLeft : ArrowRight;

  usePageMeta({
    title: t('meta.about.title'),
    description: t('meta.about.description'),
    path: '/about',
  });

  const cards = [
    {
      icon: ShieldCheck,
      title: t('about.independent.title'),
      body: t('about.independent.body'),
    },
    {
      icon: Database,
      title: t('about.data.title'),
      body: t('about.data.body'),
    },
    {
      icon: Users,
      title: t('about.trust.title'),
      body: t('about.trust.body'),
    },
    {
      icon: Scale,
      title: t('about.tech.title'),
      body: t('about.tech.body'),
    },
  ];

  return (
    <>
      <PageHeader eyebrow={t('about.eyebrow')} title={t('about.title')} description={t('about.subtitle')}>
        <Link to="/proxies" className={buttonStyles('primary', 'md')}>
          {t('nav.proxies')}
          <Forward className="size-4" aria-hidden="true" />
        </Link>
      </PageHeader>

      <Section>
        <Container>
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <section
                  key={card.title}
                  className="rounded-3xl border border-line bg-surface p-6 shadow-card"
                >
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-[15px] font-semibold">{card.title}</h2>
                  <p className="mt-2 text-[13px] leading-7 text-muted">{card.body}</p>
                </section>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
                  {isRTL ? 'ملكية المشروع والتطوير' : 'Project Ownership & Author'}
                </span>
                <h2 className="mt-1 text-xl font-bold text-ink">Mohammed Majid</h2>
                <p className="mt-1 text-[13px] text-muted">
                  {isRTL
                    ? 'المطور والمالك الرسمي لمشروع Telegram Proxy Hub. جميع الحقوق محفوظة.'
                    : 'Official author and owner of Telegram Proxy Hub. All rights reserved.'}
                </p>
              </div>
              <span className="inline-flex self-start rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-ink-soft sm:self-auto">
                © {new Date().getFullYear()} Mohammed Majid
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-line bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold">{t('about.contact.title')}</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted">{t('about.contact.body')}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {siteConfig.repoUrl ? (
                <a
                  href={siteConfig.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles('secondary', 'md')}
                >
                  <GithubIcon className="size-4" />
                  {t('about.contact.repo')}
                </a>
              ) : (
                <InlineNote tone="warning">{t('about.githubUnset')}</InlineNote>
              )}
              {siteConfig.contactEmail ? (
                <a href={`mailto:${siteConfig.contactEmail}`} className={buttonStyles('secondary', 'md')}>
                  <Mail className="size-4" aria-hidden="true" />
                  {t('about.contact.email')}
                </a>
              ) : null}
              <a
                href={siteConfig.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles('ghost', 'md')}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                {t('about.contact.telegram')}
              </a>
            </div>
          </div>

          <InlineNote tone="brand" className="mt-6">
            <span className="inline-flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t('footer.disclaimer')}
            </span>
          </InlineNote>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/privacy" className={buttonStyles('ghost', 'sm')}>
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className={buttonStyles('ghost', 'sm')}>
              {t('footer.terms')}
            </Link>
            <Link to="/guidelines" className={buttonStyles('ghost', 'sm')}>
              {t('footer.guidelines')}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}

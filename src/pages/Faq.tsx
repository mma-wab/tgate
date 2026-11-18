import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MessageCircleQuestion } from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';
import { useI18n } from '../i18n';
import { usePageMeta } from '../hooks/usePageMeta';
import { faqItems } from '../i18n/content';
import { siteConfig } from '../config/site';
import { PageHeader, Section, Container } from '../components/ui/LayoutPrimitives';
import { Accordion } from '../components/ui/Accordion';
import { buttonStyles } from '../components/ui/Button';
import { InlineNote } from '../components/ui/Feedback';

export default function Faq() {
  const { t, lang, isRTL } = useI18n();
  const items = faqItems[lang].map((item, index) => ({
    id: `faq-${index}`,
    question: item.q,
    answer: item.a,
  }));
  const Forward = isRTL ? ArrowLeft : ArrowRight;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems[lang].map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  usePageMeta({
    title: t('meta.faq.title'),
    description: t('meta.faq.description'),
    path: '/faq',
    jsonLd,
  });

  return (
    <>
      <PageHeader
        eyebrow={t('faq.eyebrow')}
        title={t('faq.title')}
        description={t('faq.subtitle')}
      />

      <Section>
        <Container size="narrow">
          <Accordion items={items} defaultOpenFirst />

          <InlineNote tone="neutral" className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-start gap-2">
                <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                {t('faq.note')}
              </span>
              <div className="flex flex-wrap gap-2">
                {siteConfig.repoUrl ? (
                  <a
                    href={siteConfig.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles('secondary', 'sm')}
                  >
                    <GithubIcon className="size-3.5" />
                    {t('faq.noteCta')}
                  </a>
                ) : null}
                <Link to="/security" className={buttonStyles('ghost', 'sm')}>
                  {t('footer.security')}
                  <Forward className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </InlineNote>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/proxies" className={buttonStyles('primary', 'md')}>
              {t('nav.proxies')}
            </Link>
            <Link to="/submit" className={buttonStyles('secondary', 'md')}>
              {t('footer.submit')}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}

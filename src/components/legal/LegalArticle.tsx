import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n';
import { usePageMeta } from '../../hooks/usePageMeta';
import { legalContent } from '../../i18n/content';
import { PageHeader, Container, Section } from '../ui/LayoutPrimitives';
import { buttonStyles } from '../ui/Button';
import { InlineNote } from '../ui/Feedback';
import type { TranslationKey } from '../../i18n';

type LegalKind = 'privacy' | 'terms' | 'guidelines';

const metaKeys: Record<
  LegalKind,
  { title: TranslationKey; description: TranslationKey; updated: TranslationKey; path: string }
> = {
  privacy: {
    title: 'meta.privacy.title',
    description: 'meta.privacy.description',
    updated: 'legal.privacy.updated',
    path: '/privacy',
  },
  terms: {
    title: 'meta.terms.title',
    description: 'meta.terms.description',
    updated: 'legal.terms.updated',
    path: '/terms',
  },
  guidelines: {
    title: 'meta.guidelines.title',
    description: 'meta.guidelines.description',
    updated: 'legal.guidelines.updated',
    path: '/guidelines',
  },
};

export function LegalArticle({ kind }: { kind: LegalKind }) {
  const { t, lang, isRTL } = useI18n();
  const sections = legalContent[kind][lang];
  const meta = metaKeys[kind];
  const titleKey =
    kind === 'privacy' ? 'legal.privacy.title' : kind === 'terms' ? 'legal.terms.title' : 'legal.guidelines.title';
  const Forward = isRTL ? ArrowLeft : ArrowRight;
  const Back = isRTL ? ArrowRight : ArrowLeft;

  usePageMeta({
    title: t(meta.title),
    description: t(meta.description),
    path: meta.path,
  });

  return (
    <>
      <PageHeader eyebrow={t('legal.toc')} title={t(titleKey)} description={t(meta.updated)}>
        <Link to="/" className={buttonStyles('secondary', 'md')}>
          <Back className="size-4" aria-hidden="true" />
          {t('legal.backHome')}
        </Link>
        {kind !== 'guidelines' ? (
          <Link to="/guidelines" className={buttonStyles('ghost', 'md')}>
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t('footer.guidelines')}
          </Link>
        ) : (
          <Link to="/security" className={buttonStyles('ghost', 'md')}>
            {t('footer.security')}
            <Forward className="size-4" aria-hidden="true" />
          </Link>
        )}
      </PageHeader>

      <Section>
        <Container size="narrow">
          {kind === 'privacy' ? (
            <InlineNote tone="brand" className="mb-8">
              <span className="inline-flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t('submit.privacy')}
              </span>
            </InlineNote>
          ) : null}

          <article className="prose-shell space-y-8">
            {sections.map((section, index) => (
              <section key={section.heading} id={`section-${index + 1}`}>
                <h2 className="text-lg font-semibold text-ink">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-2.5 text-[13.5px] leading-7 text-muted">
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-[13.5px] leading-7 text-muted">
                        <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>

          <div className="mt-10 flex flex-wrap gap-2.5 border-t border-line pt-6">
            <Link to="/proxies" className={buttonStyles('primary', 'md')}>
              {t('nav.proxies')}
            </Link>
            <Link to="/" className={buttonStyles('secondary', 'md')}>
              <FileText className="size-4" aria-hidden="true" />
              {t('legal.backHome')}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}

import { useI18n } from '../../i18n';
import { faqItems } from '../../i18n/content';
import { Accordion } from '../ui/Accordion';
import { Container, Section, SectionHeading } from '../ui/LayoutPrimitives';
import { SketchCircle, SketchRuleDashed } from '../ui/Doodles';
import { ShieldIcon } from '../ui/SketchIcons';

export function HowPreview() {
  const { t } = useI18n();
  const steps = [
    { title: t('home.how.step1.title'), body: t('home.how.step1.body') },
    { title: t('home.how.step2.title'), body: t('home.how.step2.body') },
    { title: t('home.how.step3.title'), body: t('home.how.step3.body') },
  ];

  return (
    <Section id="how-it-works" className="scroll-mt-20 py-8 sm:py-10">
      <Container>
        <SectionHeading
          eyebrow={t('home.how.eyebrow')}
          title={t('home.how.title')}
          description={t('home.how.subtitle')}
        />

        <ol className="mt-7 grid gap-6 sm:grid-cols-3 sm:gap-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <SketchCircle className="mt-0.5 h-8 w-9 shrink-0 text-[12px] font-bold text-brand">
                {index + 1}
              </SketchCircle>
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold text-ink">{step.title}</h3>
                <p className="mt-1 text-[12.5px] leading-6 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex items-start gap-2.5 text-[12px] leading-6 text-muted">
          <ShieldIcon className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>{t('details.securityBody')}</span>
        </div>
      </Container>
    </Section>
  );
}

export function FaqPreview() {
  const { t, lang } = useI18n();
  const items = faqItems[lang].slice(0, 3).map((item, index) => ({
    id: `home-faq-${index}`,
    question: item.q,
    answer: item.a,
  }));

  return (
    <Section id="faq" className="scroll-mt-20 py-8 sm:py-10">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow={t('home.faq.eyebrow')}
          title={t('home.faq.title')}
          description={t('faq.subtitle')}
        />
        <div className="mt-5">
          <SketchRuleDashed />
        </div>
        <Accordion items={items} defaultOpenFirst />
      </Container>
    </Section>
  );
}

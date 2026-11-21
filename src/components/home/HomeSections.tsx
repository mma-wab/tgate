import {
  BadgeCheck,
  CheckCheck,
  Eye,
  ListFilter,
  ShieldCheck,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { faqItems } from '../../i18n/content';
import { Accordion } from '../ui/Accordion';
import { Container, Section, SectionHeading } from '../ui/LayoutPrimitives';

export function HowPreview() {
  const { t } = useI18n();
  const steps = [
    {
      icon: ListFilter,
      title: t('home.how.step1.title'),
      body: t('home.how.step1.body'),
    },
    {
      icon: BadgeCheck,
      title: t('home.how.step2.title'),
      body: t('home.how.step2.body'),
    },
    {
      icon: CheckCheck,
      title: t('home.how.step3.title'),
      body: t('home.how.step3.body'),
    },
  ];

  return (
    <Section id="how-it-works" tone="surface" className="scroll-mt-20">
      <Container>
        <SectionHeading
          eyebrow={t('home.how.eyebrow')}
          title={t('home.how.title')}
          description={t('home.how.subtitle')}
        />

        <ol className="mt-3.5 grid gap-2.5 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-3 sm:p-3.5 transition-colors hover:border-brand/40"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="num text-[11px] font-bold text-brand font-mono">0{index + 1}.</span>
                    <h3 className="text-[13px] font-bold text-ink truncate">{step.title}</h3>
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl border border-brand/20 bg-brand-soft/40 p-3 text-[11.5px] leading-relaxed text-brand-ink">
          <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden="true" />
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
    <Section id="faq" tone="soft" className="scroll-mt-20">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <div>
            <SectionHeading
              eyebrow={t('home.faq.eyebrow')}
              title={t('home.faq.title')}
              description={t('faq.subtitle')}
            />
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-surface p-4 text-[12px] leading-relaxed text-muted shadow-xs">
              <Eye className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
              <span>{t('directory.verificationNote')}</span>
            </div>
          </div>
          <Accordion items={items} defaultOpenFirst />
        </div>
      </Container>
    </Section>
  );
}

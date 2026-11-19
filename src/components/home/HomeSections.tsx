import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCheck,
  Eye,
  ListFilter,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { faqItems } from '../../i18n/content';
import { buttonStyles } from '../ui/Button';
import { Accordion } from '../ui/Accordion';
import { Container, Section, SectionHeading } from '../ui/LayoutPrimitives';

export function HowPreview() {
  const { t, isRTL } = useI18n();
  const Forward = isRTL ? ArrowLeft : ArrowRight;
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
    <Section tone="soft">
      <Container>
        <SectionHeading
          eyebrow={t('home.how.eyebrow')}
          title={t('home.how.title')}
          description={t('home.how.subtitle')}
        >
          <Link to="/how-it-works" className={buttonStyles('secondary', 'md', 'group')}>
            {t('home.how.cta')}
            <Forward
              className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </SectionHeading>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <span className="num rounded-lg border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

export function FaqPreview() {
  const { t, lang, isRTL } = useI18n();
  const Forward = isRTL ? ArrowLeft : ArrowRight;
  const items = faqItems[lang].slice(0, 4).map((item, index) => ({
    id: `home-faq-${index}`,
    question: item.q,
    answer: item.a,
  }));

  return (
    <Section tone="surface">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <SectionHeading
              eyebrow={t('home.faq.eyebrow')}
              title={t('home.faq.title')}
            />
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/faq" className={buttonStyles('secondary', 'md', 'group')}>
                {t('home.faq.cta')}
                <Forward
                  className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link to="/how-it-works" className={buttonStyles('ghost', 'md')}>
                {t('footer.how')}
              </Link>
            </div>
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-line bg-surface-2/60 p-4 text-[12px] leading-6 text-muted">
              <Eye className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
              {t('directory.verificationNote')}
            </div>
          </div>
          <Accordion items={items} defaultOpenFirst />
        </div>
      </Container>
    </Section>
  );
}

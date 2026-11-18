import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCheck,
  Eye,
  ListFilter,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
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

export function SecurityPreview() {
  const { t, isRTL } = useI18n();
  const Forward = isRTL ? ArrowLeft : ArrowRight;

  const rows = [
    { label: t('home.security.row.reachable'), status: 'yes' as const },
    { label: t('home.security.row.identity'), status: 'unknown' as const },
    { label: t('home.security.row.audit'), status: 'no' as const },
    { label: t('home.security.row.metadata'), status: 'no' as const },
  ];

  const statusMeta = {
    yes: { icon: Check, className: 'bg-emerald-400/15 text-emerald-300', label: t('home.security.status.yes') },
    no: { icon: X, className: 'bg-rose-400/15 text-rose-300', label: t('home.security.status.no') },
    unknown: {
      icon: AlertTriangle,
      className: 'bg-amber-400/15 text-amber-300',
      label: t('home.security.status.unknown'),
    },
  };

  return (
    <Section>
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#081726] px-6 py-10 text-white shadow-lift sm:px-10 lg:px-12 lg:py-14 dark:border dark:border-white/10">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_85%_10%,rgba(34,158,217,0.28),transparent_70%),radial-gradient(40%_50%_at_10%_90%,rgba(34,158,217,0.14),transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7fd2f3]">
                <span className="h-px w-5 bg-[#7fd2f3]/60" aria-hidden="true" />
                {t('home.security.eyebrow')}
              </p>
              <h2 className="mt-4 max-w-lg text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {t('home.security.title')}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{t('home.security.body')}</p>
              <ul className="mt-6 space-y-2.5 text-[13px] text-slate-200">
                {[t('home.security.point1'), t('home.security.point2'), t('home.security.point3')].map(
                  (point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#5ec8f0]" aria-hidden="true" />
                      {point}
                    </li>
                  ),
                )}
              </ul>
              <Link
                to="/security"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
              >
                {t('home.security.cta')}
                <Forward className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <p className="text-[12px] font-semibold text-white">{t('home.security.verifyTitle')}</p>
                <ShieldAlert className="size-4 text-[#7fd2f3]" aria-hidden="true" />
              </div>
              <ul className="mt-2 divide-y divide-white/[0.07]">
                {rows.map((row) => {
                  const meta = statusMeta[row.status];
                  const Icon = meta.icon;
                  return (
                    <li key={row.label} className="flex items-center justify-between gap-3 py-3">
                      <span className="text-[12.5px] text-slate-300">{row.label}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${meta.className}`}
                        title={meta.label}
                      >
                        <Icon className="size-3" aria-hidden="true" />
                        {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 border-t border-white/10 pt-4 text-[11px] leading-5 text-slate-400">
                {t('home.security.note')}
              </p>
            </div>
          </div>
        </div>
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

export function SubmitCta() {
  const { t } = useI18n();
  return (
    <Section>
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-brand/15 bg-brand-soft/70 px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-ink">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {t('home.submit.eyebrow')}
              </p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{t('home.submit.title')}</h2>
              <p className="mt-2 text-sm leading-7 text-ink-soft">{t('home.submit.body')}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2.5">
              <Link to="/submit" className={buttonStyles('primary', 'lg')}>
                {t('home.submit.cta')}
              </Link>
              <Link to="/security" className={buttonStyles('secondary', 'lg')}>
                {t('home.submit.secondary')}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

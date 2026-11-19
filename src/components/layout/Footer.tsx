import { useState } from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n';
import { siteConfig } from '../../config/site';
import { LogoMark } from '../ui/Logo';
import { Container } from '../ui/LayoutPrimitives';
import { GithubIcon } from '../ui/icons';
import { LegalModal, type LegalKind } from '../legal/LegalModal';

const footerLinkClass = 'text-[13px] leading-7 text-muted transition hover:text-ink';
const footerBtnClass = 'text-start text-[13px] leading-7 text-muted transition hover:text-ink';

export function Footer() {
  const { t } = useI18n();
  const [activeLegal, setActiveLegal] = useState<LegalKind | null>(null);
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="border-t border-line bg-surface">
        <Container className="py-8 lg:py-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-8">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <LogoMark className="size-9" />
                <span
                  dir="ltr"
                  className="text-[17px] font-bold tracking-tight text-ink"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  T-<span className="text-brand">Gate</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">{t('footer.tagline')}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-muted">
                <ShieldCheck className="size-3.5 text-brand" aria-hidden="true" />
                {t('app.independent')}
              </div>
            </div>

            <nav aria-label={t('footer.proxies')}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
                {t('footer.proxies')}
              </h2>
              <ul className="mt-4 space-y-1.5">
                <li>
                  <a href="#top" className={footerLinkClass}>
                    {t('nav.home')}
                  </a>
                </li>
                <li>
                  <a href="#proxies" className={footerLinkClass}>
                    {t('nav.proxies')}
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className={footerLinkClass}>
                    {t('footer.how')}
                  </a>
                </li>
                <li>
                  <a href="#faq" className={footerLinkClass}>
                    {t('footer.faq')}
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-label={t('footer.resources')}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
                {t('footer.resources')}
              </h2>
              <ul className="mt-4 space-y-1.5">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegal('privacy')}
                    className={footerBtnClass}
                  >
                    {t('footer.privacy')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegal('terms')}
                    className={footerBtnClass}
                  >
                    {t('footer.terms')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegal('guidelines')}
                    className={footerBtnClass}
                  >
                    {t('footer.guidelines')}
                  </button>
                </li>
                {siteConfig.repoUrl ? (
                  <li>
                    <a
                      href={siteConfig.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${footerLinkClass} inline-flex items-center gap-1.5`}
                    >
                      <GithubIcon className="size-3.5" />
                      {t('footer.repo')}
                    </a>
                  </li>
                ) : null}
                <li>
                  <a
                    href={siteConfig.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${footerLinkClass} inline-flex items-center gap-1.5`}
                  >
                    {t('footer.telegram')}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 border-t border-line pt-6">
            <p className="max-w-4xl text-[12px] leading-6 text-muted">{t('footer.disclaimer')}</p>
            <div className="mt-5 flex flex-col gap-2 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {year} Mohammed Majid. All rights reserved.
              </p>
              <p>{t('footer.built')}</p>
            </div>
          </div>
        </Container>
      </footer>

      <LegalModal kind={activeLegal} onClose={() => setActiveLegal(null)} />
    </>
  );
}

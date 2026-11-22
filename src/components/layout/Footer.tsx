import { useState } from 'react';
import { useI18n } from '../../i18n';
import { siteConfig } from '../../config/site';
import { LogoMark } from '../ui/Logo';
import { Container } from '../ui/LayoutPrimitives';
import { GithubIcon } from '../ui/icons';
import { LegalModal, type LegalKind } from '../legal/LegalModal';
import { ArrowUpRightIcon, ShieldIcon } from '../ui/SketchIcons';
import { SketchRuleDashed } from '../ui/Doodles';

const linkClass =
  'inline-flex items-center gap-1.5 text-[12.5px] leading-6 text-muted transition-colors hover:text-brand';

export function Footer() {
  const { t } = useI18n();
  const [activeLegal, setActiveLegal] = useState<LegalKind | null>(null);
  const year = new Date().getFullYear();

  return (
    <>
      <footer>
        <Container>
          <SketchRuleDashed />
          <div className="grid gap-7 py-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <LogoMark className="size-8" />
                <span
                  dir="ltr"
                  className="text-[16px] font-extrabold tracking-tight text-ink"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  T-<span className="text-brand">Gate</span>
                </span>
              </div>
              <p className="mt-3 text-[12.5px] leading-6 text-muted">{t('footer.tagline')}</p>
              <p className="mt-2 inline-flex items-start gap-1.5 text-[11px] leading-5 text-muted">
                <ShieldIcon className="mt-px size-3.5 shrink-0 text-brand" />
                {t('app.independent')}
              </p>
            </div>

            <nav aria-label={t('footer.proxies')}>
              <h2 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink">
                {t('footer.proxies')}
              </h2>
              <ul className="mt-2.5 space-y-1">
                <li>
                  <a href="#proxies" className={linkClass}>
                    {t('nav.proxies')}
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className={linkClass}>
                    {t('footer.how')}
                  </a>
                </li>
                <li>
                  <a href="#faq" className={linkClass}>
                    {t('footer.faq')}
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-label={t('footer.resources')}>
              <h2 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink">
                {t('footer.resources')}
              </h2>
              <ul className="mt-2.5 space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegal('privacy')}
                    className={linkClass}
                  >
                    {t('footer.privacy')}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveLegal('terms')} className={linkClass}>
                    {t('footer.terms')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegal('guidelines')}
                    className={linkClass}
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
                      className={linkClass}
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
                    className={linkClass}
                  >
                    {t('footer.telegram')}
                    <ArrowUpRightIcon className="size-3" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-dashed border-line py-5">
            <p className="max-w-3xl text-[11px] leading-5 text-muted">{t('footer.disclaimer')}</p>
            <div className="mt-3 flex flex-col gap-1 text-[10.5px] text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>© {year} Mohammed Majid.</p>
              <p>{t('footer.built')}</p>
            </div>
          </div>
        </Container>
      </footer>

      <LegalModal kind={activeLegal} onClose={() => setActiveLegal(null)} />
    </>
  );
}

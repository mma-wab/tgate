import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n';
import { siteConfig } from '../../config/site';
import { LogoMark } from '../ui/Logo';
import { Container } from '../ui/LayoutPrimitives';
import { GithubIcon } from '../ui/icons';

const footerLinkClass = 'text-[13px] leading-7 text-muted transition hover:text-ink';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-9" />
              <span
                dir="ltr"
                className="text-[15px] font-semibold tracking-tight text-ink"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Telegram <span className="text-brand">Proxy Hub</span>
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
                <Link to="/proxies" className={footerLinkClass}>
                  {t('nav.proxies')}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className={footerLinkClass}>
                  {t('footer.how')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className={footerLinkClass}>
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/submit" className={footerLinkClass}>
                  {t('footer.submit')}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={t('footer.resources')}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
              {t('footer.resources')}
            </h2>
            <ul className="mt-4 space-y-1.5">
              <li>
                <Link to="/security" className={footerLinkClass}>
                  {t('footer.security')}
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className={footerLinkClass}>
                  {t('footer.guidelines')}
                </Link>
              </li>
              <li>
                <Link to="/about" className={footerLinkClass}>
                  {t('footer.about')}
                </Link>
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

          <nav aria-label={t('footer.legal')}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
              {t('footer.legal')}
            </h2>
            <ul className="mt-4 space-y-1.5">
              <li>
                <Link to="/privacy" className={footerLinkClass}>
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className={footerLinkClass}>
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <a
                  href={siteConfig.telegramFaqUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${footerLinkClass} inline-flex items-center gap-1.5`}
                >
                  Telegram FAQ
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
              © {year} Telegram Proxy Hub · {t('footer.rights')}
            </p>
            <p>{t('footer.built')}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

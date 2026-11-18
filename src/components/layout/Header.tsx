import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher, ThemeToggle } from './Controls';
import { MobileMenu } from './MobileMenu';
import { Container } from '../ui/LayoutPrimitives';
import { buttonStyles } from '../ui/Button';
import { NAV_ENTRIES } from './navigation';

export function Header() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-line/80 bg-page/80 backdrop-blur-xl transition-shadow duration-300',
          scrolled && 'shadow-[0_10px_30px_-24px_rgba(23,43,77,0.35)]',
        )}
      >
        <Container className="flex h-[68px] items-center justify-between gap-4">
          <Logo onClick={closeMenu} />

          <nav aria-label={t('nav.main')} className="hidden items-center gap-0.5 lg:flex">
            {NAV_ENTRIES.map((entry) => {
              const active = entry.match(pathname);
              return (
                <Link
                  key={entry.href}
                  to={entry.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-brand-soft/80 text-brand-ink'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  {t(entry.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/submit"
              className={buttonStyles('secondary', 'sm', 'hidden xl:inline-flex')}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('nav.submit')}
            </Link>
            <LanguageSwitcher className="hidden min-[390px]:inline-flex" />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('nav.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition hover:bg-surface-2 hover:text-ink lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}

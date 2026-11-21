import { useCallback, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher, ThemeToggle } from './Controls';
import { MobileMenu } from './MobileMenu';
import { Container } from '../ui/LayoutPrimitives';
import { NAV_ENTRIES } from './navigation';

export function Header() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-line bg-page/90 backdrop-blur-md transition-shadow duration-200',
          scrolled && 'shadow-xs',
        )}
      >
        <Container className="flex h-[56px] sm:h-[60px] items-center justify-between gap-4">
          <Logo onClick={closeMenu} />

          <nav aria-label={t('nav.main')} className="hidden items-center gap-0.5 lg:flex">
            {NAV_ENTRIES.map((entry) => (
              <a
                key={entry.href}
                href={entry.href}
                className="relative rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {t(entry.key)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
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

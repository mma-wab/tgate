import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher, ThemeToggle } from './Controls';
import { MobileMenu } from './MobileMenu';
import { Container } from '../ui/LayoutPrimitives';
import { NAV_ENTRIES } from './navigation';
import { MenuIcon } from '../ui/SketchIcons';
import { SketchRule } from '../ui/Doodles';

export function Header() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 bg-page/85 backdrop-blur-md transition-colors duration-200',
          scrolled && 'bg-page/95',
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-4">
          <Logo onClick={closeMenu} />

          <nav aria-label={t('nav.main')} className="hidden items-center gap-6 md:flex">
            {NAV_ENTRIES.map((entry) => (
              <a
                key={entry.href}
                href={entry.href}
                className="border-b-2 border-dashed border-transparent pb-0.5 text-[13.5px] font-semibold text-ink-soft transition-colors hover:border-brand/50 hover:text-ink"
              >
                {t(entry.key)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden min-[420px]:inline-flex" />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('nav.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="sketch-sm inline-flex size-10 items-center justify-center text-ink-soft transition hover:border-brand/50 hover:text-ink md:hidden"
            >
              <MenuIcon className="size-5" />
            </button>
          </div>
        </Container>

        {/* Pencil rule instead of a conventional 1px border */}
        <div className={cn('transition-opacity duration-200', scrolled ? 'opacity-100' : 'opacity-0')}>
          <SketchRule />
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}

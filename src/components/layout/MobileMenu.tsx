import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher, ThemeToggle } from './Controls';
import { NAV_ENTRIES } from './navigation';
import { buttonStyles } from '../ui/Button';
import { cn } from '../../lib/cn';

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, isRTL } = useI18n();
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const ForwardChevron = isRTL ? ChevronLeft : ChevronRight;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-page lg:hidden"
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.mobile')}
          id="mobile-navigation"
          ref={panelRef}
        >
          <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-line px-4">
            <Logo onClick={onClose} />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t('nav.closeMenu')}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <nav aria-label={t('nav.mobile')} className="flex flex-col gap-1">
              {NAV_ENTRIES.map((entry) => {
                const active = entry.match(pathname);
                return (
                  <Link
                    key={entry.href}
                    to={entry.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-medium transition',
                      active
                        ? 'bg-brand-soft text-brand-ink'
                        : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    {t(entry.key)}
                    <ForwardChevron
                      className={cn('size-4 text-muted', !active && 'opacity-50')}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="my-6 h-px bg-line" />

            <Link
              to="/submit"
              onClick={onClose}
              className={buttonStyles('primary', 'md', 'w-full')}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('nav.submit')}
            </Link>

            <div className="mt-6 flex items-center gap-2">
              <LanguageSwitcher className="flex-1" />
              <ThemeToggle />
            </div>

            <div className="mt-8 space-y-1">
              <Link
                to="/about"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-2 py-2 text-sm text-muted transition hover:text-ink"
              >
                {t('nav.about')}
                <ArrowUpLeft className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/privacy"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-2 py-2 text-sm text-muted transition hover:text-ink"
              >
                {t('footer.privacy')}
                <ArrowUpLeft className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/guidelines"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-2 py-2 text-sm text-muted transition hover:text-ink"
              >
                {t('footer.guidelines')}
                <ArrowUpLeft className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

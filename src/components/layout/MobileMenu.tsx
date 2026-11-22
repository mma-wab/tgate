import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '../../i18n';
import { Logo } from '../ui/Logo';
import { LanguageSwitcher, ThemeToggle } from './Controls';
import { NAV_ENTRIES } from './navigation';
import { ArrowUpRightIcon, CloseIcon } from '../ui/SketchIcons';
import { SketchRuleDashed } from '../ui/Doodles';

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
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
          className="fixed inset-0 z-[70] flex flex-col bg-page md:hidden"
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.mobile')}
          id="mobile-navigation"
          ref={panelRef}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-5">
            <Logo onClick={onClose} />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t('nav.closeMenu')}
              className="sketch-sm inline-flex size-10 items-center justify-center text-ink-soft transition hover:border-brand/50 hover:text-ink"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
          <SketchRuleDashed className="mx-5" />

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <nav aria-label={t('nav.mobile')} className="flex flex-col">
              {NAV_ENTRIES.map((entry, index) => (
                <a
                  key={entry.href}
                  href={entry.href}
                  onClick={onClose}
                  className="group flex items-center justify-between gap-3 py-4 text-[17px] font-semibold text-ink transition hover:text-brand"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="num text-[11px] font-semibold text-brand/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {t(entry.key)}
                  </span>
                  <ArrowUpRightIcon className="size-4 text-muted transition group-hover:text-brand" />
                </a>
              ))}
            </nav>

            <div className="my-4">
              <SketchRuleDashed />
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher className="flex-1" />
              <ThemeToggle />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

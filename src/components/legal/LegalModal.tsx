import { useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n';
import { legalContent } from '../../i18n/content';

export type LegalKind = 'privacy' | 'terms' | 'guidelines';

export function LegalModal({
  kind,
  onClose,
}: {
  kind: LegalKind | null;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();

  useEffect(() => {
    if (!kind) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kind, onClose]);

  if (!kind) return null;

  const sections = legalContent[kind][lang];
  const titleKey =
    kind === 'privacy'
      ? 'legal.privacy.title'
      : kind === 'terms'
        ? 'legal.terms.title'
        : 'legal.guidelines.title';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
            <h2 id="legal-modal-title" className="text-base font-semibold text-ink">
              {t(titleKey)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-xl p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-sm font-semibold text-ink">{section.heading}</h3>
              {section.paragraphs?.map((p, i) => (
                <p key={i} className="text-[13px] leading-6 text-muted">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-2 space-y-1.5">
                  {section.bullets.map((b, bi) => (
                    <li key={bi} className="flex items-start gap-2 text-[13px] leading-6 text-muted">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-line bg-surface-2/50 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-surface-2"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

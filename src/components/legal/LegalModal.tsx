import { useEffect } from 'react';
import { useI18n } from '../../i18n';
import { legalContent } from '../../i18n/content';
import { CloseIcon, ShieldIcon } from '../ui/SketchIcons';
import { SketchRuleDashed } from '../ui/Doodles';

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
      <div className="sketch relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldIcon className="size-5 text-brand" />
            <h2 id="legal-modal-title" className="text-base font-bold text-ink">
              {t(titleKey)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="sketch-sm inline-flex size-9 items-center justify-center text-muted transition hover:border-brand/50 hover:text-ink"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
        <SketchRuleDashed className="mx-6" />

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
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

        <div className="flex justify-end px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="sketch-pill h-9 bg-surface px-4 text-xs font-semibold text-ink transition hover:border-brand/50"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

import { Languages, Moon, Sun } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/cn';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, toggleLang, lang } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t('lang.switchAria')}
      title={t('lang.switchAria')}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[12px] font-semibold text-ink-soft transition hover:border-line-strong hover:bg-surface-2',
        className,
      )}
    >
      <Languages className="size-4 text-brand" aria-hidden="true" />
      <span className={lang === 'ar' ? 'font-sans' : 'font-arabic'}>{t('lang.switch')}</span>
    </button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('theme.toggleToLight') : t('theme.toggleToDark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition hover:border-line-strong hover:bg-surface-2',
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}

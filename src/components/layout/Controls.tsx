import { useI18n } from '../../i18n';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/cn';
import { GlobeIcon, MoonIcon, SunIcon } from '../ui/SketchIcons';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, toggleLang, lang } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t('lang.switchAria')}
      title={t('lang.switchAria')}
      className={cn(
        'sketch-sm inline-flex h-10 items-center gap-2 px-3 text-[12.5px] font-semibold text-ink-soft transition hover:border-brand/50 hover:text-ink',
        className,
      )}
    >
      <GlobeIcon className="size-4 text-brand" />
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
        'sketch-sm inline-flex size-10 items-center justify-center text-ink-soft transition hover:border-brand/50 hover:text-ink',
        className,
      )}
    >
      {isDark ? <SunIcon className="size-[18px]" /> : <MoonIcon className="size-[18px]" />}
    </button>
  );
}

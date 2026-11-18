import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Lang } from '../types/proxy';
import { dictionaries, type TranslationKey } from './translations';

const STORAGE_KEY = 'tph:lang';

interface I18nContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const readInitialLang = (): Lang => {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('lang');
    if (attr === 'en' || attr === 'ar') return attr;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {
    /* ignore unavailable storage */
  }
  return 'ar';
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* preferences remain in memory */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleLang = useCallback(
    () => setLangState((current) => (current === 'ar' ? 'en' : 'ar')),
    [],
  );

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, token: string) =>
        Object.prototype.hasOwnProperty.call(vars, token) ? String(vars[token]) : match,
      );
    },
    [lang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      isRTL: lang === 'ar',
      t,
      setLang,
      toggleLang,
    }),
    [lang, t, setLang, toggleLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}

export type { TranslationKey };

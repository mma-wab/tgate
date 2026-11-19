import type { TranslationKey } from '../../i18n';

export interface NavEntry {
  key: TranslationKey;
  href: string;
}

export const NAV_ENTRIES: NavEntry[] = [
  { key: 'nav.home', href: '#top' },
  { key: 'nav.proxies', href: '#proxies' },
  { key: 'nav.how', href: '#how-it-works' },
  { key: 'nav.faq', href: '#faq' },
];

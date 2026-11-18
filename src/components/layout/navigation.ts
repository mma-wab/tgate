import type { TranslationKey } from '../../i18n';

export interface NavEntry {
  key: TranslationKey;
  href: string;
  match: (pathname: string) => boolean;
}

export const NAV_ENTRIES: NavEntry[] = [
  { key: 'nav.home', href: '/', match: (path) => path === '/' },
  { key: 'nav.proxies', href: '/proxies', match: (path) => path.startsWith('/proxies') },
  { key: 'nav.faq', href: '/faq', match: (path) => path === '/faq' },
  { key: 'nav.about', href: '/about', match: (path) => path === '/about' },
];

import type { TranslationKey } from '../../i18n';

export interface NavEntry {
  key: TranslationKey;
  href: string;
  match: (pathname: string) => boolean;
}

export const NAV_ENTRIES: NavEntry[] = [
  { key: 'nav.home', href: '/', match: (path) => path === '/' },
  { key: 'nav.proxies', href: '/proxies', match: (path) => path.startsWith('/proxies') },
  { key: 'nav.how', href: '/how-it-works', match: (path) => path.startsWith('/how-it-works') },
  { key: 'nav.security', href: '/security', match: (path) => path === '/security' },
  { key: 'nav.faq', href: '/faq', match: (path) => path === '/faq' },
];

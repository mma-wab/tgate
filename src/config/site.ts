const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const rawSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
const rawRepoUrl = (import.meta.env.VITE_REPO_URL as string | undefined)?.trim();
const rawDataUrl = (import.meta.env.VITE_DATA_URL as string | undefined)?.trim();
const rawTopDataUrl = (import.meta.env.VITE_TOP_DATA_URL as string | undefined)?.trim();
const rawContactEmail = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim();

export const siteConfig = {
  name: 'T-Gate',
  nameAr: 'T-Gate · بوابة بروكسيات تيليجرام',
  author: 'Mohammed Majid',
  copyright: '© 2026 Mohammed Majid. All rights reserved.',
  url: rawSiteUrl ? trimTrailingSlash(rawSiteUrl) : '',
  repoUrl: rawRepoUrl ? trimTrailingSlash(rawRepoUrl) : '',
  dataUrl: rawDataUrl ?? '',
  topDataUrl: rawTopDataUrl ?? '',
  contactEmail: rawContactEmail ?? '',
  telegramUrl: 'https://telegram.org/',
  telegramFaqUrl: 'https://telegram.org/faq',
  telegramProxyFaqUrl: 'https://telegram.org/faq#q-what-are-proxies',
  issuesUrl: rawRepoUrl ? `${trimTrailingSlash(rawRepoUrl)}/issues/new/choose` : '',
} as const;

/** Canonical URL for a route. Falls back to a path-relative value when unconfigured. */
export const canonicalUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return siteConfig.url ? `${siteConfig.url}${normalized === '/' ? '/' : normalized}` : normalized;
};

export const isRepoConfigured = Boolean(siteConfig.repoUrl);

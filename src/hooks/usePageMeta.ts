import { useEffect } from 'react';
import { siteConfig } from '../config/site';
import { useI18n } from '../i18n';

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | null;
  noindex?: boolean;
}

const baseUrl = (): string =>
  siteConfig.url ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://telegram-proxy-hub.pages.dev');

const absoluteUrl = (path: string): string =>
  `${baseUrl().replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

/** Canonical page URLs use the same trailing-slash form as the generated route shells. */
const pageUrl = (path: string): string => {
  const normalized = path.replace(/\/+$/, '');
  return absoluteUrl(normalized === '' ? '/' : `${normalized}/`);
};

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/** Keeps document metadata in sync with the active route and language. */
export function usePageMeta({ title, description, path, type = 'website', jsonLd, noindex }: PageMetaOptions) {
  const { lang } = useI18n();

  useEffect(() => {
    const canonical = pageUrl(path);
    const image = absoluteUrl('/og-image.png');

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertLink('canonical', canonical);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:locale', lang === 'ar' ? 'ar_AR' : 'en_US');
    upsertMeta('property', 'og:locale:alternate', lang === 'ar' ? 'en_US' : 'ar_AR');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    const scriptId = 'page-structured-data';
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [title, description, path, type, jsonLd, noindex, lang]);
}

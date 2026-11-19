import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dictionaries } from '../src/i18n/translations';
import type { TranslationKey } from '../src/i18n/translations';

/**
 * Post-build SEO pass for the Single Page Application.
 * Injects metadata for the main page, then writes sitemap.xml and robots.txt.
 */

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const templatePath = resolve(dist, 'index.html');
const baseUrl = (process.env.VITE_SITE_URL ?? 'https://telegram-proxy-hub.pages.dev').replace(/\/+$/, '');
const ar = dictionaries.ar;

interface RouteEntry {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
  priority?: string;
  changefreq?: string;
  lastmod?: string;
}

const staticRoutes: Array<Omit<RouteEntry, 'title' | 'description'> & { titleKey: TranslationKey; descriptionKey: TranslationKey }> = [
  { path: '/', titleKey: 'meta.home.title', descriptionKey: 'meta.home.description', priority: '1.0', changefreq: 'hourly' },
];

function absolutePath(path: string): string {
  return `${baseUrl}${path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceMeta(html: string, attribute: 'name' | 'property', key: string, value: string): string {
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`, 'i');
  if (pattern.test(html)) return html.replace(pattern, `$1${escapeHtml(value)}$2`);
  return html.replace('</head>', `    <meta ${attribute}="${key}" content="${escapeHtml(value)}" />\n  </head>`);
}

function replaceLink(html: string, rel: string, href: string, hreflang?: string): string {
  const tag = hreflang
    ? `    <link rel="${rel}" hreflang="${hreflang}" href="${escapeHtml(href)}" />`
    : `    <link rel="${rel}" href="${escapeHtml(href)}" />`;
  const pattern = hreflang
    ? new RegExp(`<link\\s+rel="${rel}"\\s+hreflang="${hreflang}"[^>]*>`, 'i')
    : new RegExp(`<link\\s+rel="${rel}"\\s+href="[^"]*"[^>]*>`, 'i');
  if (pattern.test(html)) return html.replace(pattern, tag.trim());
  return html.replace('</head>', `${tag}\n  </head>`);
}

function render(template: string, route: RouteEntry): string {
  const url = absolutePath(route.path);
  let html = template;

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
  html = replaceMeta(html, 'name', 'description', route.description);
  html = replaceMeta(html, 'property', 'og:title', route.title);
  html = replaceMeta(html, 'property', 'og:description', route.description);
  html = replaceMeta(html, 'property', 'og:url', url);
  html = replaceMeta(html, 'name', 'twitter:title', route.title);
  html = replaceMeta(html, 'name', 'twitter:description', route.description);
  html = replaceLink(html, 'canonical', url);

  if (route.noindex) {
    html = replaceMeta(html, 'name', 'robots', 'noindex, nofollow');
  }

  return html;
}

const template = readFileSync(templatePath, 'utf8');

const routes: RouteEntry[] = staticRoutes.map((route) => ({
  path: route.path,
  title: ar[route.titleKey],
  description: ar[route.descriptionKey],
  noindex: route.noindex,
  priority: route.priority,
  changefreq: route.changefreq,
}));

for (const route of routes) {
  const html = render(template, route);
  if (route.path === '/') {
    writeFileSync(templatePath, html, 'utf8');
  }
}

const today = new Date().toISOString().slice(0, 10);
const sitemapEntries = routes
  .filter((route) => !route.noindex)
  .map((route) => {
    const url = absolutePath(route.path);
    const lastmod = route.lastmod ?? today;
    const changefreq = route.changefreq ?? 'hourly';
    const priority = route.priority ?? '1.0';
    return `  <url>\n    <loc>${escapeHtml(url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join('\n');

writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`,
  'utf8',
);

writeFileSync(
  resolve(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
  'utf8',
);

// Cloudflare Pages serves 404.html for unknown paths. Keep it out of search.
const notFound = replaceMeta(
  template.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(ar['meta.notFound.title'])}</title>`),
  'name',
  'robots',
  'noindex, nofollow',
);
writeFileSync(resolve(dist, '404.html'), notFound, 'utf8');

console.log(`[seo] Wrote metadata for ${routes.length} routes, sitemap.xml and robots.txt (${baseUrl}).`);

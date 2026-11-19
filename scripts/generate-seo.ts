import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { dictionaries } from '../src/i18n/translations';
import type { TranslationKey } from '../src/i18n/translations';
import { parseProxyDataset } from '../src/lib/validation';

/**
 * Post-build SEO pass. Vite emits a single SPA shell; this script clones it for
 * every static route and every proxy detail page with route-specific metadata,
 * then writes sitemap.xml and robots.txt. Client-side navigation still updates
 * the metadata at runtime through usePageMeta.
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
  { path: '/proxies', titleKey: 'meta.proxies.title', descriptionKey: 'meta.proxies.description', priority: '0.9', changefreq: 'hourly' },
  { path: '/how-it-works', titleKey: 'meta.how.title', descriptionKey: 'meta.how.description' },
  { path: '/security', titleKey: 'meta.security.title', descriptionKey: 'meta.security.description' },
  { path: '/faq', titleKey: 'meta.faq.title', descriptionKey: 'meta.faq.description' },
  { path: '/about', titleKey: 'meta.about.title', descriptionKey: 'meta.about.description' },
  { path: '/privacy', titleKey: 'meta.privacy.title', descriptionKey: 'meta.privacy.description' },
  { path: '/terms', titleKey: 'meta.terms.title', descriptionKey: 'meta.terms.description' },
  { path: '/guidelines', titleKey: 'meta.guidelines.title', descriptionKey: 'meta.guidelines.description' },
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
  const selector = hreflang ? `rel="${rel}" hreflang="${hreflang}"` : `rel="${rel}"`;
  const pattern = new RegExp(`(<link\\s+${selector}\\s+href=")[^"]*(")`, 'i');
  if (pattern.test(html)) return html.replace(pattern, `$1${escapeHtml(href)}$2`);
  const tag = hreflang
    ? `<link rel="${rel}" hreflang="${hreflang}" href="${escapeHtml(href)}" />`
    : `<link rel="${rel}" href="${escapeHtml(href)}" />`;
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function render(template: string, route: RouteEntry): string {
  const url = absolutePath(route.path);
  const title = route.title;
  const description = route.description;

  let html = template.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceMeta(html, 'name', 'description', description);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:url', url);
  html = replaceMeta(html, 'property', 'og:image', `${baseUrl}/og-image.png`);
  html = replaceMeta(html, 'name', 'twitter:title', title);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', `${baseUrl}/og-image.png`);
  html = replaceMeta(html, 'name', 'author', 'Mohammed Majid');
  html = replaceMeta(html, 'name', 'copyright', '© 2026 Mohammed Majid. All rights reserved.');
  html = replaceMeta(html, 'name', 'robots', route.noindex ? 'noindex, nofollow' : 'index, follow');
  html = replaceLink(html, 'canonical', url);
  html = replaceLink(html, 'alternate', url, 'ar');
  html = replaceLink(html, 'alternate', url, 'en');
  html = replaceLink(html, 'alternate', url, 'x-default');
  return html;
}

function readProxies(): RouteEntry[] {
  const result: RouteEntry[] = [];
  try {
    const raw = JSON.parse(readFileSync(resolve(root, 'data/proxies.json'), 'utf8')) as unknown;
    const { dataset } = parseProxyDataset(raw);
    for (const proxy of dataset.proxies) {
      result.push({
        path: `/proxies/${proxy.id}`,
        title: ar['meta.details.title'].replace('{name}', proxy.name).replace('{server}', proxy.server),
        description: ar['meta.details.description'],
        priority: '0.7',
        changefreq: 'daily',
        lastmod: (proxy.lastChecked ?? proxy.lastOnline ?? '').slice(0, 10) || undefined,
      });
    }
  } catch (error) {
    console.warn('[seo] Could not read proxy details for prerendering:', error);
  }

  try {
    const topRaw = JSON.parse(readFileSync(resolve(root, 'data/top-proxies.json'), 'utf8')) as {
      proxies?: Array<{ id: string; server: string; verifiedAt?: string }>;
    };
    if (Array.isArray(topRaw?.proxies)) {
      for (const p of topRaw.proxies) {
        if (!result.some((r) => r.path === `/proxies/${p.id}`)) {
          result.push({
            path: `/proxies/${p.id}`,
            title: ar['meta.details.title'].replace('{name}', p.server).replace('{server}', p.server),
            description: ar['meta.details.description'],
            priority: '0.8',
            changefreq: 'daily',
            lastmod: (p.verifiedAt ?? '').slice(0, 10) || undefined,
          });
        }
      }
    }
  } catch {
    // optional top-proxies dataset
  }

  return result;
}

const template = readFileSync(templatePath, 'utf8');

const routes: RouteEntry[] = [
  ...staticRoutes.map((route) => ({
    path: route.path,
    title: ar[route.titleKey],
    description: ar[route.descriptionKey],
    noindex: route.noindex,
    priority: route.priority,
    changefreq: route.changefreq,
  })),
  ...readProxies(),
];

for (const route of routes) {
  const html = render(template, route);
  if (route.path === '/') {
    writeFileSync(templatePath, html, 'utf8');
    continue;
  }
  const output = resolve(dist, `${route.path.replace(/^\//, '')}/index.html`);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, html, 'utf8');
}

const today = new Date().toISOString().slice(0, 10);
const sitemapEntries = routes
  .filter((route) => !route.noindex)
  .map((route) => {
    const url = absolutePath(route.path);
    const lastmod = route.lastmod ?? today;
    const changefreq = route.changefreq ?? 'monthly';
    const priority = route.priority ?? '0.6';
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
  `User-agent: *\nAllow: /\nDisallow: /submit\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
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

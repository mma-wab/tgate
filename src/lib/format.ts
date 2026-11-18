import type { Lang, ProxyRecord, TrustLevel } from '../types/proxy';
import type { FeaturedStatus } from '../types/top-proxy';

const localeFor = (lang: Lang): string => (lang === 'ar' ? 'ar-EG-u-nu-latn-ca-gregory' : 'en-US');

export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(localeFor(lang)).format(value);
}

export function formatLatency(value: number | null, lang: Lang): string {
  if (value === null || !Number.isFinite(value)) return lang === 'ar' ? 'غير متاح' : 'n/a';
  if (value >= 1000) {
    return `${new Intl.NumberFormat(localeFor(lang), {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }).format(value / 1000)} ${lang === 'ar' ? 'ث' : 's'}`;
  }
  return `${formatNumber(Math.round(value), lang)} ${lang === 'ar' ? 'مللي ثانية' : 'ms'}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatDateTime(iso: string | null, lang: Lang): string {
  if (!iso) return lang === 'ar' ? 'لم يتم بعد' : 'Not yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return lang === 'ar' ? 'غير معروف' : 'Unknown';
  return new Intl.DateTimeFormat(localeFor(lang), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function formatTimeShort(iso: string | null, lang: Lang): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(localeFor(lang), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDate(iso: string | null, lang: Lang): string {
  if (!iso) return lang === 'ar' ? 'غير محدد' : 'Not set';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return lang === 'ar' ? 'غير معروف' : 'Unknown';
  return new Intl.DateTimeFormat(localeFor(lang), {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date);
}

/** Relative time for recent events, absolute date beyond one week. */
export function formatRelative(iso: string | null, lang: Lang, now = Date.now()): string {
  if (!iso) return lang === 'ar' ? 'لم يتم بعد' : 'Not yet';
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return lang === 'ar' ? 'غير معروف' : 'Unknown';
  const delta = now - time;
  const abs = Math.abs(delta);
  if (abs < 45_000) return lang === 'ar' ? 'الآن' : 'just now';
  if (abs > 7 * DAY) return formatDate(iso, lang);

  const formatter = new Intl.RelativeTimeFormat(localeFor(lang), { numeric: 'auto' });
  if (abs < HOUR) return formatter.format(-Math.round(delta / MINUTE), 'minute');
  if (abs < DAY) return formatter.format(-Math.round(delta / HOUR), 'hour');
  return formatter.format(-Math.round(delta / DAY), 'day');
}

export function countryLabel(code: string | null, lang: Lang): string {
  if (!code) return '';
  try {
    return new Intl.DisplayNames([localeFor(lang)], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function trustLabel(trust: TrustLevel, lang: Lang): string {
  const labels: Record<TrustLevel, { ar: string; en: string }> = {
    'trusted-source': { ar: 'مصدر موثوق', en: 'Trusted source' },
    community: { ar: 'مُرسَل من المجتمع', en: 'Community submitted' },
    unverified: { ar: 'غير مُتحقق منه أمنيًا', en: 'Unverified' },
  };
  return labels[trust][lang];
}

export function statusLabel(
  status: ProxyRecord['status'],
  lang: Lang,
): string {
  const labels: Record<ProxyRecord['status'], { ar: string; en: string }> = {
    online: { ar: 'متصل', en: 'Online' },
    offline: { ar: 'غير متصل', en: 'Offline' },
    timeout: { ar: 'انتهت المهلة', en: 'Timeout' },
    unknown: { ar: 'غير معروف', en: 'Unknown' },
  };
  return labels[status][lang];
}

export function percent(value: number | null, lang: Lang): string {
  if (value === null) return '—';
  return new Intl.NumberFormat(localeFor(lang), {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function percentPrecise(value: number | null, lang: Lang): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(localeFor(lang), {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function featuredStatusLabel(status: FeaturedStatus, lang: Lang): string {
  const labels: Record<FeaturedStatus, { ar: string; en: string }> = {
    online: { ar: 'متصل', en: 'Online' },
    checking: { ar: 'قيد الفحص', en: 'Checking' },
    offline: { ar: 'غير متصل', en: 'Offline' },
    unknown: { ar: 'غير معروف', en: 'Unknown' },
  };
  return labels[status][lang];
}

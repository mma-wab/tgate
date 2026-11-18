import { siteConfig } from '../config/site';
import { parseTopProxyDataset } from '../lib/top-proxies';
import type { ValidationIssue } from '../lib/validation';
import type { TopProxyDataset } from '../types/top-proxy';

export interface TopProxyDataResult {
  dataset: TopProxyDataset;
  skipped: number;
  issues: ValidationIssue[];
  source: string;
  fetchedAt: string;
}

export type TopProxyDataErrorKind = 'network' | 'invalid' | 'aborted';

export class TopProxyDataError extends Error {
  kind: TopProxyDataErrorKind;

  constructor(kind: TopProxyDataErrorKind, message: string) {
    super(message);
    this.name = 'TopProxyDataError';
    this.kind = kind;
  }
}

const withCacheBuster = (url: string, bypassCache: boolean): string => {
  if (!bypassCache) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
};

/**
 * Loads only the published featured-proxy database. No proxy discovery or
 * MTProto testing happens in the browser; that work belongs to the scheduled
 * collector. The bundled `/data/top-proxies.json` is the default source, with
 * an optional configured remote URL preferred when present.
 */
export async function fetchTopProxyData(
  options: { signal?: AbortSignal; bypassCache?: boolean } = {},
): Promise<TopProxyDataResult> {
  const candidates = [siteConfig.topDataUrl, '/data/top-proxies.json'].filter(
    (value, index, array): value is string => Boolean(value) && array.indexOf(value) === index,
  );

  let lastError: TopProxyDataError | null = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(withCacheBuster(candidate, options.bypassCache ?? false), {
        signal: options.signal,
        headers: { Accept: 'application/json' },
        cache: options.bypassCache ? 'no-store' : 'default',
      });
      if (!response.ok) {
        lastError = new TopProxyDataError(
          'network',
          `Request for ${candidate} failed with status ${response.status}.`,
        );
        continue;
      }
      const raw: unknown = await response.json().catch(() => {
        throw new TopProxyDataError('invalid', 'The featured proxy database is not valid JSON.');
      });
      const parsed = parseTopProxyDataset(raw);
      const rawCount = Array.isArray((raw as { proxies?: unknown[] })?.proxies)
        ? ((raw as { proxies: unknown[] }).proxies.length ?? 0)
        : 0;
      const hasSchemaFailure = parsed.issues.some((issue) => issue.code === 'dataset.schema');
      if (hasSchemaFailure || (rawCount > 0 && parsed.dataset.proxies.length === 0)) {
        throw new TopProxyDataError(
          'invalid',
          'The featured proxy database failed validation and no safe records remained.',
        );
      }
      return {
        dataset: parsed.dataset,
        skipped: parsed.skipped,
        issues: parsed.issues,
        source: candidate,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TopProxyDataError('aborted', 'The request was cancelled.');
      }
      if (error instanceof TopProxyDataError) {
        lastError = error;
        if (error.kind === 'invalid') throw error;
        continue;
      }
      lastError = new TopProxyDataError('network', 'Network request failed.');
    }
  }

  if (lastError) throw lastError;
  throw new TopProxyDataError('network', 'No featured proxy database could be loaded.');
}

import { siteConfig } from '../config/site';
import { parseProxyDataset } from '../lib/validation';
import type { ProxyDataset } from '../types/proxy';
import type { ValidationIssue } from '../lib/validation';

export interface ProxyDataResult {
  dataset: ProxyDataset;
  skipped: number;
  issues: ValidationIssue[];
  source: string;
}

export type ProxyDataErrorKind = 'network' | 'invalid' | 'aborted';

export class ProxyDataError extends Error {
  kind: ProxyDataErrorKind;

  constructor(kind: ProxyDataErrorKind, message: string) {
    super(message);
    this.name = 'ProxyDataError';
    this.kind = kind;
  }
}

const withCacheBuster = (url: string, bypassCache: boolean): string => {
  if (!bypassCache) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
};

/**
 * Loads the public proxy database. A configured remote URL is preferred; the
 * bundled public file is used as a fallback. Invalid records are never shown.
 */
export async function fetchProxyData(options: {
  signal?: AbortSignal;
  bypassCache?: boolean;
} = {}): Promise<ProxyDataResult> {
  const candidates = [siteConfig.dataUrl, '/data/proxies.json'].filter(
    (value, index, array): value is string => Boolean(value) && array.indexOf(value) === index,
  );

  let lastError: ProxyDataError | null = null;
  let sawNetworkError = false;

  for (const candidate of candidates) {
    try {
      const response = await fetch(withCacheBuster(candidate, options.bypassCache ?? false), {
        signal: options.signal,
        headers: { Accept: 'application/json' },
        cache: options.bypassCache ? 'no-store' : 'default',
      });
      if (!response.ok) {
        sawNetworkError = true;
        lastError = new ProxyDataError(
          'network',
          `Request for ${candidate} failed with status ${response.status}.`,
        );
        continue;
      }
      const raw: unknown = await response.json().catch(() => {
        throw new ProxyDataError('invalid', 'The proxy database is not valid JSON.');
      });
      const parsed = parseProxyDataset(raw);
      const rawCount = Array.isArray((raw as { proxies?: unknown[] })?.proxies)
        ? ((raw as { proxies: unknown[] }).proxies.length ?? 0)
        : 0;
      const hasSchemaFailure = parsed.issues.some((issue) => issue.code === 'dataset.schema');
      if (hasSchemaFailure || (rawCount > 0 && parsed.dataset.proxies.length === 0)) {
        throw new ProxyDataError(
          'invalid',
          'The proxy database failed validation and no safe records remained.',
        );
      }
      return {
        dataset: parsed.dataset,
        skipped: parsed.skipped,
        issues: parsed.issues,
        source: candidate,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProxyDataError('aborted', 'The request was cancelled.');
      }
      if (error instanceof ProxyDataError) {
        lastError = error;
        if (error.kind === 'invalid') {
          /* An invalid configured source should not be replaced silently by an
             older bundled snapshot. Stop and surface the problem. */
          throw error;
        }
        sawNetworkError = true;
        continue;
      }
      sawNetworkError = true;
      lastError = new ProxyDataError('network', 'Network request failed.');
    }
  }

  if (lastError) throw lastError;
  throw new ProxyDataError(
    sawNetworkError ? 'network' : 'invalid',
    'No proxy database could be loaded.',
  );
}

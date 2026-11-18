import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertAllowedSourceUrl, assertPublicSourceHost } from './network-guard';

/**
 * Fetches an explicitly allowlisted HTTPS source. Guards against SSRF by
 * rejecting credentials, non-443 ports, unknown hosts, redirects, private DNS
 * destinations, oversized bodies and slow responses. Never logs the response.
 */

export interface FetchOptions {
  allowedHosts: string[];
  timeoutMs: number;
  maxBytes: number;
  cacheDir?: string;
}

export type FetchResult =
  | { ok: true; text: string; bytes: number; cached: boolean }
  | { ok: false; reason: string };

const cachePathFor = (cacheDir: string, url: string): string => {
  const digest = createHash('sha256').update(url).digest('hex').slice(0, 24);
  return resolve(cacheDir, `${digest}.json`);
};

interface CacheEntry {
  etag?: string;
  lastModified?: string;
  text: string;
  savedAt: string;
}

const readCache = (path: string): CacheEntry | null => {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<CacheEntry>;
    return typeof parsed.text === 'string' ? (parsed as CacheEntry) : null;
  } catch {
    return null;
  }
};

export async function fetchFeedText(rawUrl: string, options: FetchOptions): Promise<FetchResult> {
  let url: URL;
  try {
    url = assertAllowedSourceUrl(rawUrl, options.allowedHosts);
    await assertPublicSourceHost(url.hostname);
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'Source URL rejected.' };
  }

  const cachePath = options.cacheDir ? cachePathFor(options.cacheDir, url.toString()) : null;
  const cached = cachePath ? readCache(cachePath) : null;
  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.1',
    'User-Agent': 'TelegramProxyHubCollector/1.0',
    'Cache-Control': 'no-cache',
  };
  if (cached?.etag) headers['If-None-Match'] = cached.etag;
  if (cached?.lastModified) headers['If-Modified-Since'] = cached.lastModified;

  try {
    const response = await fetch(url, {
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(options.timeoutMs),
    });

    if (response.status === 304 && cached) {
      return { ok: true, text: cached.text, bytes: Buffer.byteLength(cached.text), cached: true };
    }
    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }
    const declared = Number(response.headers.get('content-length') ?? '0');
    if (declared > options.maxBytes) {
      return { ok: false, reason: 'Response exceeds maxResponseBytes.' };
    }

    const reader = response.body?.getReader();
    if (!reader) return { ok: false, reason: 'Empty response body.' };
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > options.maxBytes) {
        await reader.cancel();
        return { ok: false, reason: 'Response exceeds maxResponseBytes.' };
      }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8');

    if (cachePath) {
      try {
        mkdirSync(options.cacheDir as string, { recursive: true });
        const entry: CacheEntry = {
          etag: response.headers.get('etag') ?? undefined,
          lastModified: response.headers.get('last-modified') ?? undefined,
          text,
          savedAt: new Date().toISOString(),
        };
        writeFileSync(cachePath, JSON.stringify(entry), 'utf8');
      } catch {
        /* Caching is best-effort and never blocks collection. */
      }
    }

    return { ok: true, text, bytes: total, cached: false };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return { ok: false, reason: `Timed out after ${options.timeoutMs}ms.` };
    }
    return { ok: false, reason: error instanceof Error ? error.message : 'Network request failed.' };
  }
}

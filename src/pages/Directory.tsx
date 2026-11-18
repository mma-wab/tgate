import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Database,
  Filter,
  LayoutGrid,
  RefreshCw,
  Search,
  SearchX,
  ShieldCheck,
  WifiOff,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useProxies } from '../contexts/ProxiesContext';
import { useNow } from '../hooks/useNow';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  DEFAULT_FILTERS,
  availableCountries,
  countByStatus,
  filterProxies,
  hasActiveFilters,
} from '../lib/directory';
import { formatDateTime, formatNumber, formatRelative, statusLabel, trustLabel } from '../lib/format';
import type { DirectoryFilters, SortOption, StatusFilter } from '../types/proxy';
import { PageHeader } from '../components/ui/LayoutPrimitives';
import { Button, buttonStyles } from '../components/ui/Button';
import { Select } from '../components/ui/Field';
import { EmptyState, ErrorState, InlineNote, Skeleton } from '../components/ui/Feedback';
import { ProxyCard, ProxyGridSkeleton } from '../components/proxy/ProxyCard';
import { cn } from '../lib/cn';

const STATUSES: StatusFilter[] = ['all', 'online', 'offline', 'unknown'];
const SORTS: SortOption[] = ['fastest', 'recent', 'name'];
const TRUSTS = ['', 'trusted-source', 'community', 'unverified'] as const;

function isStatus(value: string | null): value is StatusFilter {
  return value !== null && (STATUSES as string[]).includes(value);
}

function isSort(value: string | null): value is SortOption {
  return value !== null && (SORTS as string[]).includes(value);
}

function statusLabelFor(status: StatusFilter, lang: 'ar' | 'en'): string {
  return status === 'all' ? '' : statusLabel(status === 'offline' ? 'offline' : status, lang);
}

export default function Directory() {
  const { t, lang } = useI18n();
  const { dataset, status, skipped, issues, isRefreshing, refresh } = useProxies();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = useNow();

  const filters: DirectoryFilters = useMemo(() => {
    const statusParam = searchParams.get('status');
    const sortParam = searchParams.get('sort');
    const trustParam = searchParams.get('trust') ?? '';
    return {
      query: searchParams.get('q') ?? '',
      status: isStatus(statusParam) ? statusParam : 'all',
      country: searchParams.get('country') ?? '',
      trust: (TRUSTS as readonly string[]).includes(trustParam) ? trustParam : '',
      recentOnly: searchParams.get('recent') === '1',
      sort: isSort(sortParam) ? sortParam : DEFAULT_FILTERS.sort,
    };
  }, [searchParams]);

  usePageMeta({
    title: t('meta.proxies.title'),
    description: t('meta.proxies.description'),
    path: '/proxies',
  });

  const proxies = dataset?.proxies ?? [];
  const visible = useMemo(() => filterProxies(proxies, filters, now), [proxies, filters, now]);
  const counts = useMemo(() => countByStatus(proxies), [proxies]);
  const countries = useMemo(
    () => availableCountries(proxies, lang === 'ar' ? 'ar-EG' : 'en-US'),
    [proxies, lang],
  );

  const updateFilters = (patch: Partial<DirectoryFilters>) => {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    if (next.query.trim()) params.set('q', next.query.trim());
    if (next.status !== 'all') params.set('status', next.status);
    if (next.country) params.set('country', next.country);
    if (next.trust) params.set('trust', next.trust);
    if (next.recentOnly) params.set('recent', '1');
    if (next.sort !== DEFAULT_FILTERS.sort) params.set('sort', next.sort);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });
  const active = hasActiveFilters(filters);
  const loading = status === 'loading';
  const offlineAll = status === 'ready' && proxies.length > 0 && counts.online === 0;

  const handleRefresh = async () => {
    await refresh({ bypassCache: true });
  };

  return (
    <>
      <PageHeader
        eyebrow={t('nav.proxies')}
        title={t('directory.title')}
        description={t('directory.subtitle')}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => void handleRefresh()}
            loading={isRefreshing}
            iconLeft={<RefreshCw className="size-4" />}
          >
            {t('directory.refresh')}
          </Button>
          {dataset?.lastUpdated ? (
            <span className="text-[12px] text-muted">
              {t('directory.lastSync')}:{' '}
              <time className="num" dateTime={dataset.lastUpdated} title={formatDateTime(dataset.lastUpdated, lang)}>
                {formatRelative(dataset.lastUpdated, lang, now)}
              </time>
            </span>
          ) : (
            <span className="text-[12px] text-muted">{t('home.stats.neverHint')}</span>
          )}
        </div>
      </PageHeader>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-3xl border border-line bg-surface p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="relative">
                <label htmlFor="directory-search" className="mb-1.5 block text-[13px] font-semibold text-ink">
                  {t('directory.searchLabel')}
                </label>
                <Search
                  className="pointer-events-none absolute bottom-3.5 start-3.5 size-4 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="directory-search"
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  spellCheck={false}
                  value={filters.query}
                  onChange={(event) => updateFilters({ query: event.target.value })}
                  placeholder={t('directory.searchPlaceholder')}
                  className="h-11 w-full rounded-xl border border-line bg-surface ps-10 pe-10 text-sm text-ink shadow-[0_1px_2px_rgba(23,43,77,0.03)] transition-colors placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
                {filters.query ? (
                  <button
                    type="button"
                    onClick={() => updateFilters({ query: '' })}
                    aria-label={t('common.clearAll')}
                    className="absolute bottom-2.5 end-2 flex size-7 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
                <p className="mt-2 text-[11px] text-muted">
                  {t('directory.resultsCount', {
                    shown: formatNumber(visible.length, lang),
                    total: formatNumber(proxies.length, lang),
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-2.5">
                <Select
                  label={t('directory.filterSort')}
                  value={filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value as SortOption })}
                  containerClassName="min-w-[9.5rem] flex-1"
                >
                  <option value="fastest">{t('directory.sortFastest')}</option>
                  <option value="recent">{t('directory.sortRecent')}</option>
                  <option value="name">{t('directory.sortName')}</option>
                </Select>
                <Select
                  label={t('directory.filterCountry')}
                  value={filters.country}
                  onChange={(event) => updateFilters({ country: event.target.value })}
                  containerClassName="min-w-[9.5rem] flex-1"
                >
                  <option value="">{t('directory.allCountries')}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </Select>
                <Select
                  label={t('directory.filterTrust')}
                  value={filters.trust}
                  onChange={(event) => updateFilters({ trust: event.target.value })}
                  containerClassName="min-w-[9.5rem] flex-1"
                >
                  <option value="">{t('directory.allTrust')}</option>
                  <option value="trusted-source">{trustLabel('trusted-source', lang)}</option>
                  <option value="community">{trustLabel('community', lang)}</option>
                  <option value="unverified">{trustLabel('unverified', lang)}</option>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-line pt-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('directory.filterStatus')}>
                <span className="me-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                  <Filter className="size-3.5" aria-hidden="true" />
                  {t('directory.filterStatus')}
                </span>
                {STATUSES.map((statusOption) => {
                  const selected = filters.status === statusOption;
                  return (
                    <button
                      key={statusOption}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateFilters({ status: statusOption })}
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition',
                        selected
                          ? 'border-brand/30 bg-brand-soft text-brand-ink'
                          : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink',
                      )}
                    >
                      {statusOption === 'all' ? t('directory.allStatuses') : statusLabelFor(statusOption, lang)}
                      <span className="num rounded-full bg-surface/80 px-1.5 text-[10px] text-muted">
                        {formatNumber(counts[statusOption], lang)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-ink-soft">
                  <input
                    type="checkbox"
                    checked={filters.recentOnly}
                    onChange={(event) => updateFilters({ recentOnly: event.target.checked })}
                    className="size-4 rounded border-line-strong text-brand accent-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                  />
                  {t('directory.recentOnly')}
                </label>
                {active ? (
                  <Button variant="ghost" size="sm" onClick={clearFilters} iconLeft={<X className="size-3.5" />}>
                    {t('directory.clear')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {skipped > 0 || issues.length > 0 ? (
          <InlineNote tone="warning" className="mt-4">
            <span className="inline-flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t('directory.partialWarning', {
                count: formatNumber(Math.max(skipped, issues.length), lang),
              })}
            </span>
          </InlineNote>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] text-ink-soft">
            <LayoutGrid className="size-4 text-brand" aria-hidden="true" />
            <h2 className="font-semibold" id="directory-results-label">
              {t('directory.results')}
            </h2>
            <span className="text-muted" aria-hidden="true">
              ·
            </span>
            <span className="num text-muted">
              {formatNumber(visible.length, lang)} / {formatNumber(proxies.length, lang)}
            </span>
          </div>
          <p className="inline-flex items-center gap-1.5 text-[11px] leading-5 text-muted">
            <ShieldCheck className="size-3.5 shrink-0 text-success" aria-hidden="true" />
            {t('directory.verificationNote')}
          </p>
        </div>

        <div className="mt-4" role="region" aria-label={t('directory.resultsAria')} aria-live="polite">
          {loading ? <ProxyGridSkeleton count={6} /> : null}

          {status === 'error' ? (
            <ErrorState
              title={t('directory.dataError.title')}
              description={t('directory.dataError.body')}
              onRetry={() => void refresh({ bypassCache: true })}
            />
          ) : null}

          {status === 'ready' && proxies.length === 0 ? (
            <EmptyState
              icon={Database}
              title={t('directory.empty.title')}
              description={t('directory.empty.body')}
              actions={
                <>
                  <Link to="/submit" className={buttonStyles('primary', 'md')}>
                    {t('directory.empty.cta')}
                  </Link>
                  <Link to="/about" className={buttonStyles('secondary', 'md')}>
                    {t('directory.empty.secondary')}
                  </Link>
                </>
              }
            />
          ) : null}

          {status === 'ready' && proxies.length > 0 && visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={active ? t('directory.noMatch.title') : t('directory.statusCounts')}
              description={active ? t('directory.noMatch.body') : t('directory.allOffline.body')}
              actions={
                active ? (
                  <Button variant="secondary" onClick={clearFilters} iconLeft={<X className="size-4" />}>
                    {t('directory.noMatch.clear')}
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => updateFilters({ status: 'all' })}>
                    {t('directory.allOffline.showAll')}
                  </Button>
                )
              }
            />
          ) : null}

          {status === 'ready' && visible.length > 0 ? (
            <>
              {offlineAll ? (
                <InlineNote tone="warning" className="mb-4">
                  <span className="inline-flex items-start gap-2">
                    <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {t('directory.allOffline.body')}
                  </span>
                </InlineNote>
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((proxy) => (
                  <ProxyCard key={proxy.id} proxy={proxy} />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-muted">
            <Skeleton className="size-3 rounded-full" />
            {t('common.loading')}
          </div>
        ) : null}
      </section>
    </>
  );
}

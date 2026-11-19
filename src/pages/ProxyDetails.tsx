import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Clock3,
  Eye,
  EyeOff,
  Flag,
  Gauge,
  Globe2,
  Link2,
  Radio,
  Server,
  Share2,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useProxies } from '../contexts/ProxiesContext';
import { useTopProxies } from '../hooks/useTopProxies';
import { featuredProxyToRecord } from '../lib/top-proxies';
import { useNow } from '../hooks/useNow';
import { usePageMeta } from '../hooks/usePageMeta';
import { useCopy } from '../hooks/useCopy';
import { siteConfig } from '../config/site';
import {
  buildTelegramProxyLink,
  formatHostPort,
  maskSecret,
} from '../lib/validation';
import {
  countryLabel,
  formatDateTime,
  formatLatency,
  formatNumber,
  formatRelative,
  statusLabel,
} from '../lib/format';
import { Container } from '../components/ui/LayoutPrimitives';
import { Button, buttonStyles } from '../components/ui/Button';
import { EmptyState, ErrorState, InlineNote, Skeleton } from '../components/ui/Feedback';
import { StatusBadge, TrustBadge, AvailabilityVerifiedBadge } from '../components/proxy/StatusBadge';
import { ConnectButton, CopyIconButton } from '../components/proxy/ProxyActions';
import { LatencyChart } from '../components/proxy/LatencyChart';
import { cn } from '../lib/cn';

export default function ProxyDetails() {
  const { id } = useParams<{ id: string }>();
  const { t, lang, isRTL } = useI18n();
  const { dataset, status, refresh } = useProxies();
  const { dataset: topDataset, status: topStatus } = useTopProxies();
  const now = useNow();
  const copy = useCopy();
  const [revealed, setRevealed] = useState(false);

  const proxy = useMemo(() => {
    const fromCurated = dataset?.proxies.find((item) => item.id === id);
    if (fromCurated) return fromCurated;
    const fromTop = topDataset?.proxies.find((item) => item.id === id);
    if (fromTop) return featuredProxyToRecord(fromTop);
    return null;
  }, [dataset, topDataset, id]);

  useEffect(() => {
    setRevealed(false);
  }, [id]);

  usePageMeta({
    title: proxy
      ? t('meta.details.title', { name: proxy.name, server: proxy.server })
      : t('meta.notFound.title'),
    description: proxy
      ? t('meta.details.description', { name: proxy.name, server: proxy.server })
      : t('meta.notFound.description'),
    path: proxy ? `/proxies/${proxy.id}` : '/proxies',
    noindex: !proxy,
  });

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const backLink = (
    <Link
      to="/proxies"
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft transition hover:text-brand-ink"
    >
      <BackIcon className="size-4" aria-hidden="true" />
      {t('details.back')}
    </Link>
  );

  if (status === 'loading' && topStatus === 'loading') {
    return (
      <Container className="py-12 sm:py-16">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-2/3 max-w-md" />
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </Container>
    );
  }

  if (status === 'error' && !proxy) {
    return (
      <Container className="py-12 sm:py-16">
        <ErrorState
          title={t('directory.dataError.title')}
          description={t('directory.dataError.body')}
          onRetry={() => void refresh({ bypassCache: true })}
        />
      </Container>
    );
  }

  if (!proxy) {
    return (
      <Container className="py-12 sm:py-16">
        <div className="mb-6">{backLink}</div>
        <EmptyState
          icon={Radio}
          titleAs="h1"
          title={t('details.notFound.title')}
          description={t('details.notFound.body')}
          actions={
            <Link to="/proxies" className={buttonStyles('primary', 'md')}>
              {t('details.notFound.cta')}
            </Link>
          }
        />
      </Container>
    );
  }

  const link = buildTelegramProxyLink(proxy);
  const address = formatHostPort(proxy);
  const lastChecked = proxy.lastChecked ? formatRelative(proxy.lastChecked, lang, now) : t('proxy.notYetChecked');
  const country = countryLabel(proxy.country, lang);
  const recentChecks = [...proxy.history].reverse().slice(0, 8);

  const reportHref = siteConfig.repoUrl
    ? `${siteConfig.repoUrl}/issues/new?title=${encodeURIComponent(
        `[proxy report] ${proxy.name} (${proxy.server})`,
      )}&body=${encodeURIComponent(t('details.reportBody', { name: proxy.name, server: proxy.server }))}`
    : '';

  return (
    <>
      <div className="border-b border-line bg-surface-2/40">
        <Container className="py-8 sm:py-10">
          {backLink}
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={proxy.status} size="lg" />
                <TrustBadge trust={proxy.trust} />
                <AvailabilityVerifiedBadge proxy={proxy} />
              </div>
              <h1 className="mt-4 break-words text-3xl font-semibold sm:text-4xl">{proxy.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted">
                <span className="ltr-data inline-flex items-center gap-1.5">
                  <Server className="size-3.5" aria-hidden="true" />
                  {address}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="size-3.5" aria-hidden="true" />
                  {t('details.protocolValue')}
                </span>
                {country ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe2 className="size-3.5" aria-hidden="true" />
                    {country}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {lastChecked}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <ConnectButton proxy={proxy} size="md" className="min-h-[44px]" />
              {link ? (
                <CopyIconButton
                  text={link}
                  label={t('home.featured.copyLinkShort')}
                  copiedMessage={t('proxy.linkCopied')}
                  variant="label"
                  className="min-h-[44px]"
                />
              ) : null}
              <CopyIconButton
                text={address}
                label={t('home.featured.copyServerShort')}
                copiedMessage={t('proxy.addressCopied')}
                variant="label"
                className="min-h-[44px]"
              />
              <Button
                variant="secondary"
                iconLeft={<Share2 className="size-4" />}
                className="min-h-[44px]"
                onClick={() =>
                  void copy(
                    typeof window !== 'undefined' ? window.location.href : (link ?? address),
                    t('details.shareCopied'),
                  )
                }
              >
                {t('details.share')}
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-10 sm:py-12">
        {proxy.status === 'offline' || proxy.status === 'timeout' ? (
          <InlineNote tone="warning" className="mb-6">
            <span className="inline-flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t('details.offlineNotice')} {t('proxy.offlineHint')}
            </span>
          </InlineNote>
        ) : null}
        {proxy.status === 'unknown' ? (
          <InlineNote tone="neutral" className="mb-6">
            <span className="inline-flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t('details.unknownNotice')}
            </span>
          </InlineNote>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{t('details.connectionTitle')}</h2>
                  <p className="mt-1 text-[13px] text-muted">{t('details.connectionSubtitle')}</p>
                </div>
                {link ? <TrustBadge trust={proxy.trust} /> : null}
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-surface-2/50 p-3.5">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    {t('details.address')}
                  </dt>
                  <dd className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="ltr-data truncate text-[13px] font-semibold text-ink">{address}</span>
                    <CopyIconButton
                      text={address}
                      label={t('common.copyAddress')}
                      copiedMessage={t('proxy.addressCopied')}
                    />
                  </dd>
                </div>
                <div className="rounded-2xl border border-line bg-surface-2/50 p-3.5">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    {t('common.latency')}
                  </dt>
                  <dd className="num mt-1.5 text-[15px] font-semibold text-ink">
                    {formatLatency(proxy.latencyMs, lang)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-line bg-surface-2/50 p-3.5">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    {t('details.lastVerified')}
                  </dt>
                  <dd className="mt-1.5 text-[13px] font-medium text-ink-soft">
                    {formatDateTime(proxy.lastOnline, lang)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-line bg-surface-2/50 p-3.5">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    {t('common.lastChecked')}
                  </dt>
                  <dd className="mt-1.5 text-[13px] font-medium text-ink-soft">
                    {formatDateTime(proxy.lastChecked, lang)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 rounded-2xl border border-line p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    {t('common.secret')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevealed((value) => !value)}
                      iconLeft={revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    >
                      {revealed ? t('details.hideSecret') : t('details.showSecret')}
                    </Button>
                    <CopyIconButton
                      text={proxy.secret}
                      label={t('details.copySecret')}
                      copiedMessage={t('common.copied')}
                    />
                  </div>
                </div>
                <p className="ltr-data mt-2 break-all rounded-xl bg-surface-2 px-3 py-2.5 text-[12.5px] font-medium text-ink">
                  {revealed ? proxy.secret : maskSecret(proxy.secret)}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-muted">{t('details.connectHint')}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {link ? (
                  <Button
                    variant="secondary"
                    onClick={() => void copy(link, t('proxy.linkCopied'))}
                    iconLeft={<Link2 className="size-4" />}
                  >
                    {t('common.copyLink')}
                  </Button>
                ) : null}
                {reportHref ? (
                  <a
                    href={reportHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles('ghost', 'md')}
                  >
                    <Flag className="size-4" aria-hidden="true" />
                    {t('details.report')}
                  </a>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{t('details.historyTitle')}</h2>
                  <p className="mt-1 text-[12px] text-muted">
                    {proxy.history.length > 0
                      ? t('details.historySubtitle', {
                          count: formatNumber(Math.min(proxy.history.length, 24), lang),
                        })
                      : t('details.historyEmpty')}
                  </p>
                </div>
                <span className="text-[11px] text-muted">
                  {t('proxy.historySummary', {
                    online: formatNumber(proxy.history.filter((entry) => entry.status === 'online').length, lang),
                    total: formatNumber(proxy.history.length, lang),
                  })}
                </span>
              </div>
              <div className="mt-5 rounded-2xl border border-line bg-surface-2/40 p-4">
                <LatencyChart history={proxy.history} limit={24} size="lg" />
              </div>

              {recentChecks.length > 0 ? (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[26rem] text-start text-[12.5px]">
                    <caption className="sr-only">{t('details.recentChecks')}</caption>
                    <thead>
                      <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
                        <th scope="col" className="py-2 pe-3 text-start font-medium">
                          {t('details.checkTime')}
                        </th>
                        <th scope="col" className="py-2 pe-3 text-start font-medium">
                          {t('details.checkResult')}
                        </th>
                        <th scope="col" className="py-2 text-end font-medium">
                          {t('details.checkLatency')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentChecks.map((entry) => (
                        <tr key={`${entry.at}-${entry.status}`} className="border-b border-line/60 last:border-0">
                          <td className="py-2.5 pe-3 text-ink-soft">
                            <time className="num" dateTime={entry.at}>
                              {formatDateTime(entry.at, lang)}
                            </time>
                          </td>
                          <td className="py-2.5 pe-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 text-[12px] font-medium',
                                entry.status === 'online'
                                  ? 'text-success'
                                  : entry.status === 'offline'
                                    ? 'text-danger'
                                    : 'text-warning',
                              )}
                            >
                              <span
                                className={cn(
                                  'size-1.5 rounded-full',
                                  entry.status === 'online'
                                    ? 'bg-success'
                                    : entry.status === 'offline'
                                      ? 'bg-danger'
                                      : 'bg-warning',
                                )}
                                aria-hidden="true"
                              />
                              {statusLabel(entry.status, lang)}
                            </span>
                          </td>
                          <td className="num py-2.5 text-end text-ink-soft">
                            {formatLatency(entry.latencyMs, lang)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-brand/15 bg-brand-soft/40 p-5">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                {t('details.verificationTitle')}
              </h2>
              <p className="mt-2 text-[12.5px] leading-6 text-ink-soft">{t('details.verificationBody')}</p>
            </section>

            <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <BadgeCheck className="size-4 text-brand" aria-hidden="true" />
                {t('details.trustTitle')}
              </h2>
              <div className="mt-2">
                <TrustBadge trust={proxy.trust} />
              </div>
              <p className="mt-2 text-[12.5px] leading-6 text-muted">{t('details.trustBody')}</p>
            </section>

            <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Gauge className="size-4 text-brand" aria-hidden="true" />
                {t('details.monitoring')}
              </h2>
              <dl className="mt-3 space-y-3 text-[12.5px]">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">{t('common.status')}</dt>
                  <dd>
                    <StatusBadge status={proxy.status} />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">{t('details.monitoring')}</dt>
                  <dd className="text-end font-medium text-ink-soft">{t('details.monitoringValue')}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="inline-flex items-center gap-1.5 text-muted">
                    <Tag className="size-3.5" aria-hidden="true" />
                    {t('common.source')}
                  </dt>
                  <dd className="text-end font-medium text-ink-soft">{proxy.sourceId === 'manual' ? t('details.sourceManual') : proxy.sourceId || t('details.sourceUnknown')}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="inline-flex items-center gap-1.5 text-muted">
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    {t('details.created')}
                  </dt>
                  <dd className="text-end font-medium text-ink-soft">{formatDateTime(proxy.createdAt, lang)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <h2 className="text-[14px] font-semibold">{t('details.securityTitle')}</h2>
              <p className="mt-2 text-[12.5px] leading-6 text-muted">{t('details.securityBody')}</p>
              <Link
                to="/security"
                className="mt-3 inline-flex text-[12px] font-medium text-brand-ink hover:underline"
              >
                {t('common.learnMore')}
              </Link>
            </section>
          </aside>
        </div>
      </Container>
    </>
  );
}

import { useMemo } from 'react';
import { useI18n } from '../i18n';
import { useProxies } from '../contexts/ProxiesContext';
import { computeStats } from '../lib/directory';
import { usePageMeta } from '../hooks/usePageMeta';
import { Hero } from '../components/home/Hero';
import { StatsSection } from '../components/home/StatsSection';
import { FeaturedProxies } from '../components/home/FeaturedProxies';
import { HomeDirectory } from '../components/home/HomeDirectory';
import { HowPreview, SecurityPreview, FaqPreview, SubmitCta } from '../components/home/HomeSections';

export default function Home() {
  const { t } = useI18n();
  const { dataset, status } = useProxies();
  const stats = useMemo(
    () => computeStats(dataset?.proxies ?? [], dataset?.lastUpdated ?? null),
    [dataset],
  );

  usePageMeta({
    title: t('meta.home.title'),
    description: t('meta.home.description'),
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Telegram Proxy Hub',
      description: t('meta.home.description'),
      inLanguage: ['ar', 'en'],
      potentialAction: {
        '@type': 'SearchAction',
        target: `${window.location.origin}/proxies?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  });

  return (
    <>
      <Hero stats={stats} loading={status === 'loading'} />
      <StatsSection stats={stats} loading={status === 'loading'} />
      <FeaturedProxies />
      <HomeDirectory />
      <HowPreview />
      <SecurityPreview />
      <FaqPreview />
      <SubmitCta />
    </>
  );
}

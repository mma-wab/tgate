import { useMemo } from 'react';
import { useI18n } from '../i18n';
import { useProxies } from '../contexts/ProxiesContext';
import { useTopProxies } from '../hooks/useTopProxies';
import { computeStats } from '../lib/directory';
import { featuredProxyToRecord } from '../lib/top-proxies';
import { usePageMeta } from '../hooks/usePageMeta';
import { Hero } from '../components/home/Hero';
import { FeaturedProxies } from '../components/home/FeaturedProxies';
import { HowPreview, FaqPreview } from '../components/home/HomeSections';

export default function Home() {
  const { t } = useI18n();
  const { dataset, status } = useProxies();
  const { dataset: topDataset, status: topStatus } = useTopProxies();

  const stats = useMemo(() => {
    if (dataset && dataset.proxies.length > 0) {
      return computeStats(dataset.proxies, dataset.lastUpdated);
    }
    if (topDataset && topDataset.proxies.length > 0) {
      const converted = topDataset.proxies.map(featuredProxyToRecord);
      return computeStats(converted, topDataset.updatedAt);
    }
    return computeStats([], null);
  }, [dataset, topDataset]);

  const loading =
    status === 'loading' &&
    (!dataset || dataset.proxies.length === 0) &&
    topStatus === 'loading' &&
    !topDataset;

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
      <Hero stats={stats} loading={loading} />
      <FeaturedProxies />
      <HowPreview />
      <FaqPreview />
    </>
  );
}

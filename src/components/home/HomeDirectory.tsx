import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Database, Telescope, WifiOff } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useProxies } from '../../contexts/ProxiesContext';
import { DEFAULT_FILTERS, filterProxies } from '../../lib/directory';
import { buttonStyles } from '../ui/Button';
import { Container, Section, SectionHeading } from '../ui/LayoutPrimitives';
import { EmptyState, ErrorState } from '../ui/Feedback';
import { ProxyCard, ProxyGridSkeleton } from '../proxy/ProxyCard';

export function HomeDirectory() {
  const { t, isRTL } = useI18n();
  const { dataset, status, refresh } = useProxies();
  const proxies = dataset?.proxies ?? [];
  const online = filterProxies(proxies, { ...DEFAULT_FILTERS, status: 'online', sort: 'fastest' }).slice(0, 3);
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Section id="directory-preview">
      <Container>
        <SectionHeading
          eyebrow={t('home.directory.eyebrow')}
          title={t('home.directory.title')}
          description={t('home.directory.subtitle')}
        >
          <Link to="/proxies" className={buttonStyles('secondary', 'md', 'group')}>
            {t('home.directory.viewAll')}
            <ForwardIcon
              className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </SectionHeading>

        <div className="mt-10">
          {status === 'loading' ? <ProxyGridSkeleton count={3} /> : null}

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
              title={t('home.directory.emptyTitle')}
              description={t('home.directory.emptyBody')}
              actions={
                <Link to="/about" className={buttonStyles('primary', 'md')}>
                  <Telescope className="size-4" aria-hidden="true" />
                  {t('directory.empty.secondary')}
                </Link>
              }
            />
          ) : null}

          {status === 'ready' && proxies.length > 0 && online.length === 0 ? (
            <EmptyState
              icon={WifiOff}
              title={t('directory.allOffline.title')}
              description={t('directory.allOffline.body')}
              actions={
                <Link to="/proxies" className={buttonStyles('secondary', 'md')}>
                  {t('home.directory.viewAll')}
                </Link>
              }
            />
          ) : null}

          {status === 'ready' && online.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {online.map((proxy) => (
                <ProxyCard key={proxy.id} proxy={proxy} />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

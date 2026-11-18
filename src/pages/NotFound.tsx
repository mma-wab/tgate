import { Link } from 'react-router-dom';
import { Compass, Home as HomeIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import { usePageMeta } from '../hooks/usePageMeta';
import { Container } from '../components/ui/LayoutPrimitives';
import { buttonStyles } from '../components/ui/Button';

export default function NotFound() {
  const { t } = useI18n();

  usePageMeta({
    title: t('meta.notFound.title'),
    description: t('meta.notFound.description'),
    path: '/404',
    noindex: true,
  });

  return (
    <Container className="flex min-h-[62vh] items-center justify-center py-20">
      <div className="max-w-xl text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-3xl border border-line bg-surface text-brand shadow-card">
          <Compass className="size-7" aria-hidden="true" />
        </span>
        <p className="num mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">404</p>
        <h1 className="mt-2 text-3xl font-semibold">{t('errors.notFound.title')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">{t('errors.notFound.body')}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Link to="/proxies" className={buttonStyles('primary', 'md')}>
            {t('errors.notFound.cta')}
          </Link>
          <Link to="/" className={buttonStyles('secondary', 'md')}>
            <HomeIcon className="size-4" aria-hidden="true" />
            {t('errors.home')}
          </Link>
        </div>
      </div>
    </Container>
  );
}

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { Container } from './ui/LayoutPrimitives';
import { Button } from './ui/Button';
import { AlertIcon } from './ui/SketchIcons';
import { Link } from 'react-router-dom';

function ErrorFallback() {
  const { t } = useI18n();
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="max-w-lg text-center">
        <span className="sketch-sm mx-auto mb-5 flex size-14 items-center justify-center text-danger">
          <AlertIcon className="size-6" />
        </span>
        <h1 className="text-2xl font-extrabold">{t('errors.title')}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{t('errors.body')}</p>
        <p className="mt-2 text-xs text-muted">{t('errors.boundaryHint')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button onClick={() => window.location.reload()}>{t('errors.reload')}</Button>
          <Link
            to="/"
            className="sketch-pill inline-flex h-11 items-center bg-surface px-4 text-sm font-semibold text-ink transition hover:border-brand/50"
          >
            {t('errors.home')}
          </Link>
        </div>
      </div>
    </Container>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Local console only: the project deliberately ships no error-tracking SDK.
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}

import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider, useI18n } from './i18n';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProxiesProvider } from './contexts/ProxiesContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ScrollToTop } from './hooks/useScrollToTop';
import { Container } from './components/ui/LayoutPrimitives';
import { Skeleton } from './components/ui/Feedback';

const Home = lazy(() => import('./pages/Home'));
const Directory = lazy(() => import('./pages/Directory'));
const ProxyDetails = lazy(() => import('./pages/ProxyDetails'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Security = lazy(() => import('./pages/Security'));
const Faq = lazy(() => import('./pages/Faq'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Guidelines = lazy(() => import('./pages/Guidelines'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteFallback() {
  const { t } = useI18n();
  return (
    <Container className="py-16" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
      <span className="sr-only">{t('common.loading')}</span>
    </Container>
  );
}

function SkipLink() {
  const { t } = useI18n();
  return (
    <a href="#main-content" className="skip-link">
      {t('a11y.skip')}
    </a>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <ThemeProvider>
          <ToastProvider>
            <ProxiesProvider>
              <SkipLink />
              <ScrollToTop />
              <div className="flex min-h-screen flex-col bg-page text-ink">
                <Header />
                <ErrorBoundary>
                  <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/proxies" element={<Directory />} />
                        <Route path="/proxies/:id" element={<ProxyDetails />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/security" element={<Security />} />
                        <Route path="/faq" element={<Faq />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/guidelines" element={<Guidelines />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                </ErrorBoundary>
                <Footer />
              </div>
            </ProxiesProvider>
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

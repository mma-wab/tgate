import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider, useI18n } from './i18n';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProxiesProvider } from './contexts/ProxiesContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ScrollToTop } from './hooks/useScrollToTop';
import Home from './pages/Home';

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
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/proxies" element={<Navigate to="/#proxies" replace />} />
                      <Route path="/proxies/:id" element={<Navigate to="/#proxies" replace />} />
                      <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
                      <Route path="/security" element={<Navigate to="/#how-it-works" replace />} />
                      <Route path="/faq" element={<Navigate to="/#faq" replace />} />
                      <Route path="/about" element={<Navigate to="/#how-it-works" replace />} />
                      <Route path="/privacy" element={<Navigate to="/#how-it-works" replace />} />
                      <Route path="/terms" element={<Navigate to="/#how-it-works" replace />} />
                      <Route path="/guidelines" element={<Navigate to="/#how-it-works" replace />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
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

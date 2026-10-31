import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import Home from './Home';
import BottomDock from './BottomDock';
import { useIsStandalone, useIsMobile, syncThemeColor } from './usePWA';

const TargetCompressor = lazy(() => import('./TargetCompressor'));
const BulkCompressor = lazy(() => import('./BulkCompressor'));
const Assistant = lazy(() => import('./Assistant'));
const History = lazy(() => import('./History'));
const FormatConverter = lazy(() => import('./FormatConverter'));
const ImageResizer = lazy(() => import('./ImageResizer'));
const PdfTools = lazy(() => import('./PdfTools'));
const Privacy = lazy(() => import('./Privacy'));
const NotFound = lazy(() => import('./NotFound'));

function LoadingSpinner() {
  return (
    <div className="h-dvh flex items-center justify-center pb-canvas transition-colors">
      <div className="w-8 h-8 border-4 border-zinc-300 dark:border-zinc-700 border-t-[#5668FF] rounded-full animate-spin" />
    </div>
  );
}

function AnimatedRoutes({ isStandalone }: { isStandalone: boolean }) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isToolRoute = location.pathname !== '/' && location.pathname !== '/privacy' && location.pathname !== '/history';

  const hasVisited = typeof window !== 'undefined' && localStorage.getItem('has_visited') === 'true';
  const shouldBypassHome = isStandalone || (isMobile && hasVisited);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          className={isMobile && isToolRoute ? 'pb-16' : ''}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <Routes location={location}>
              {/* In standalone PWA mode or mobile returning visitor, bypass landing directly to workbench */}
              <Route path="/" element={shouldBypassHome ? <Navigate to="/target-size" replace /> : <Home />} />
              <Route path="/target-size" element={<TargetCompressor />} />
              <Route path="/bulk-compress" element={<BulkCompressor />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/history" element={<History />} />
              <Route path="/convert" element={<FormatConverter />} />
              <Route path="/resize" element={<ImageResizer />} />
              <Route path="/pdf-tools" element={<PdfTools />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* 4-Tab Bottom Dock: active on mobile during workbench sessions */}
      {isMobile && isToolRoute && <BottomDock />}
    </>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const isStandalone = useIsStandalone();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    syncThemeColor(isDark);
  }, [isDark]);

  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <Toaster position="bottom-right" theme={isDark ? 'dark' : 'light'} richColors />
        <AnimatedRoutes isStandalone={isStandalone} />
        <Analytics />

        {/* Global Dark Mode Switcher & History Shortcut */}
        <div className="fixed top-4 right-4 md:top-6 md:right-10 flex items-center gap-2.5 z-[60]">
          <Link
            to="/history"
            aria-label="History"
            className="px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-[#12182B]/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History</span>
          </Link>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full bg-white/70 dark:bg-[#12182B]/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 shadow-sm text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </Router>
    </MotionConfig>
  );
}

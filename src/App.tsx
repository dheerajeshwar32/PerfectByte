import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import Home from './Home';

const TargetCompressor = lazy(() => import('./TargetCompressor'));
const BulkCompressor = lazy(() => import('./BulkCompressor'));
const Assistant = lazy(() => import('./Assistant'));
const History = lazy(() => import('./History'));
const FormatConverter = lazy(() => import('./FormatConverter'));
const ImageResizer = lazy(() => import('./ImageResizer'));
const PdfTools = lazy(() => import('./PdfTools'));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-indigo-950 transition-colors">
      <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-[#5668FF] rounded-full animate-spin" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/target-size" element={<TargetCompressor />} />
            <Route path="/bulk-compress" element={<BulkCompressor />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/history" element={<History />} />
            <Route path="/convert" element={<FormatConverter />} />
            <Route path="/resize" element={<ImageResizer />} />
            <Route path="/pdf-tools" element={<PdfTools />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    // Check local storage or system preference on initial load
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    // Apply or remove the 'dark' class on the HTML tag
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <Router>
      <Toaster position="bottom-right" theme={isDark ? 'dark' : 'light'} richColors />
      <AnimatedRoutes />
      <Analytics />

      {/* Top Right Utilities */}
      <div className="fixed top-5 right-5 md:top-8 md:right-12 flex items-center gap-3 md:gap-4 z-[60]">
        <Link 
          to="/history"
          className="px-4 py-2.5 rounded-full bg-white/80 dark:bg-indigo-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-medium text-sm"
          aria-label="View Action History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="hidden md:inline">History</span>
        </Link>
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-3 rounded-full bg-white/80 dark:bg-indigo-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-300 hover:scale-110 active:scale-95 transition-all"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          )}
        </button>
      </div>
    </Router>
  );
}
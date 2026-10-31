import { type ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';

interface ToolShellProps {
  /** Content for the interactive left stage (7 columns on desktop) */
  canvas: ReactNode;
  /** Content for the precision inspector console (5 columns on desktop) */
  inspector: ReactNode;
  /** Tool title shown in the header */
  title: string;
  /** Optional accent color class for the title dot */
  accentColor?: string;
  /** Optional badge in the header (e.g. 100% LOCAL WASM) */
  badgeText?: string;
  /** Optional bottom drawer for AI Assistant in inspector */
  aiDrawer?: ReactNode;
  /** Optional callback to toggle inline AI drawer */
  onToggleAiDrawer?: () => void;
  /** Optional boolean for whether AI drawer is open */
  isAiDrawerOpen?: boolean;
}

const TOOL_TABS = [
  { path: '/target-size', label: 'Target Size', icon: '🎯' },
  { path: '/bulk-compress', label: 'Bulk', icon: '⚡' },
  { path: '/pdf-tools', label: 'PDF Studio', icon: '📄' },
  { path: '/resize', label: 'Resizer', icon: '📐' },
  { path: '/assistant', label: 'AI Command', icon: '✦' },
];

export default function ToolShell({
  canvas,
  inspector,
  title,
  accentColor = 'bg-[#5668FF]',
  badgeText = '100% LOCAL WASM',
  aiDrawer,
  onToggleAiDrawer,
}: ToolShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Global ⌘J shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (onToggleAiDrawer) {
          onToggleAiDrawer();
        } else if (location.pathname !== '/assistant') {
          navigate('/assistant');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleAiDrawer, navigate, location.pathname]);

  return (
    <div className="min-h-screen relative flex flex-col bg-slate-50/80 dark:bg-[#0B0E1B] text-slate-900 dark:text-slate-100 selection:bg-[#5668FF] selection:text-white transition-colors duration-300">
      {/* ─── Ambient Sapphire/Violet Illumination & Architectural Dot Matrix ─── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top Radial Flare matching Home aesthetic */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[95vw] max-w-[1400px] h-[550px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.18),transparent)]" />
        <div className="absolute top-48 left-1/4 w-[40vw] h-[300px] bg-purple-500/[0.04] dark:bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute inset-0 pb-dot-matrix opacity-70 dark:opacity-50" />
      </div>

      {/* ─── Unified Collision-Free Top Navigation Header ─── */}
      <header
        className="pwa-header sticky top-0 z-40 w-full h-16 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B0E1B]/85 backdrop-blur-2xl transition-colors"
        style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
      >
        <div className="max-w-[1360px] h-full mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Home Pill + Title + Status */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/"
              aria-label="Back to Home"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all border border-slate-200/60 dark:border-white/10 shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Home</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${accentColor} shadow-[0_0_8px_currentColor]`} />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono truncate max-w-[140px] sm:max-w-none">
                {title}
              </span>
            </div>

            {badgeText && (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {badgeText}
              </span>
            )}
          </div>

          {/* Center: Apple/Raycast Segmented Tool Switcher Pill Dock */}
          <nav
            aria-label="Studio Tools Dock"
            className="hidden md:flex items-center p-1 rounded-full bg-slate-200/60 dark:bg-black/40 border border-slate-300/60 dark:border-white/10 backdrop-blur-xl shadow-inner shrink-0"
          >
            {TOOL_TABS.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeToolPill"
                      className="absolute inset-0 rounded-full bg-white dark:bg-[#1E2028] shadow-sm border border-slate-200/80 dark:border-white/10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 text-[11px]">{tab.icon}</span>
                  <span className="relative z-10">{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: AI Drawer Trigger + History + Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* ⌘J AI Trigger */}
            <button
              onClick={() => {
                if (onToggleAiDrawer) {
                  onToggleAiDrawer();
                } else if (location.pathname !== '/assistant') {
                  navigate('/assistant');
                }
              }}
              title="AI Command (⌘J)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-semibold font-mono transition-all shadow-xs"
            >
              <span>✦ AI</span>
              <kbd className="hidden sm:inline-block text-[10px] bg-purple-500/20 px-1 rounded font-bold">⌘J</kbd>
            </button>

            {/* History Shortcut */}
            <Link
              to="/history"
              aria-label="View History"
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">History</span>
            </Link>

            {/* Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 transition-all shadow-xs"
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
        </div>
      </header>

      {/* ─── Main Studio Stage (Centered 12-Column Glassmorphic Bento Frame) ─── */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col pb-28 md:pb-8">
        <div className="w-full flex-1 rounded-[24px] sm:rounded-[28px] border border-slate-200/80 dark:border-white/[0.08] bg-white/75 dark:bg-[#0D0E12]/80 backdrop-blur-2xl shadow-[0_24px_80px_-15px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_80px_-15px_rgba(0,0,0,0.6)] p-4 sm:p-6 lg:p-7 relative overflow-hidden flex flex-col">
          {/* Studio Top Sub-Header Bar */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60 dark:border-white/[0.06] text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-[#5668FF] font-bold">STUDIO WORKSPACE</span>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{title}</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Zero Cloud Uploads</span>
              </span>
              <span>•</span>
              <span>Client-Side WebAssembly</span>
            </div>
          </div>

          {/* 12-Column Studio Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 items-start">
            {/* Left 7 Columns: Interactive Canvas / Stage */}
            <section className="lg:col-span-7 flex flex-col w-full h-full min-w-0" aria-label="Interactive Canvas">
              {canvas}
            </section>

            {/* Right 5 Columns: Precision Inspector Console */}
            <aside className="lg:col-span-5 flex flex-col w-full min-w-0 space-y-5" aria-label="Inspector Controls">
              {inspector}
              {aiDrawer && (
                <div className="pt-2">
                  {aiDrawer}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface DockTab {
  path: string;
  label: string;
  icon: ReactNode;
}

const tabs: DockTab[] = [
  {
    path: '/target-size',
    label: 'Compress',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    path: '/pdf-tools',
    label: 'PDF',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: '/bulk-compress',
    label: 'Batch',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/assistant',
    label: 'AI Command',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
];

/**
 * Fixed 4-tab translucent bottom dock for mobile navigation.
 * Destinations: Compress, PDF, Batch, AI Command.
 */
export default function BottomDock() {
  const location = useLocation();

  return (
    <nav
      className="pwa-bottom-dock fixed bottom-0 left-0 right-0 z-50 h-14 flex items-center justify-around px-2 border-t border-[var(--pb-border)] bg-white/85 dark:bg-[#0B0E1B]/90 backdrop-blur-2xl md:hidden"
      style={{
        boxShadow: 'inset 0 1px 0 0 var(--pb-specular)',
      }}
      aria-label="Mobile Navigation Dock"
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[64px] ${
              isActive
                ? 'text-[#5668FF]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className={`transition-transform duration-200 ${isActive ? 'scale-105' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[10px] font-mono font-bold tracking-tight ${isActive ? 'text-[#5668FF]' : ''}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useIsMobile } from './usePWA';
import BottomSheet from './BottomSheet';

interface ToolShellProps {
  /** Content for the main canvas area (desktop left 70% / mobile top 55%) */
  canvas: ReactNode;
  /** Content for the inspector rail (desktop right 360px / mobile bottom sheet) */
  inspector: ReactNode;
  /** Tool title shown in the compact header */
  title: string;
  /** Optional accent color class for the title dot */
  accentColor?: string;
  /** Optional badge in the header */
  badgeText?: string;
  /** Optional bottom drawer for AI Assistant in inspector */
  aiDrawer?: ReactNode;
}

/**
 * ToolShell — Zero-Scroll Split Workbench Architecture
 *
 * Desktop Viewport:
 * - Fixed zero-scroll workbench (h-dvh overflow-hidden)
 * - 70% Left/Center Canvas on subtle dot-matrix background
 * - 360px Right Inspector Rail with 1px specular hairline border & fractal noise
 *
 * Mobile Viewport:
 * - Pinned Top 52% Viewport: Canvas / Before-After Slider
 * - Interactive Bottom Sheet (Bottom 48% / 86% snap points) for controls
 * - Fixed 4-tab glass bottom dock
 */
export default function ToolShell({
  canvas,
  inspector,
  title,
  accentColor = 'bg-[#5668FF]',
  badgeText = '100% LOCAL WASM',
  aiDrawer,
}: ToolShellProps) {
  const isMobile = useIsMobile();

  return (
    <div className="h-dvh flex flex-col pb-canvas overflow-hidden select-none">
      {/* ─── Specular Luminance Header Bar ─── */}
      <header
        className="pwa-header flex items-center justify-between px-4 md:px-6 h-14 shrink-0 border-b border-[var(--pb-border)] pb-panel z-30"
        style={{
          boxShadow: 'inset 0 1px 0 0 var(--pb-specular)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to Tools"
            className="flex items-center justify-center w-8 h-8 rounded-lg pb-control hover:bg-[var(--pb-control-hover)] transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${accentColor}`} />
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-mono uppercase">
              {title}
            </span>
          </div>

          {badgeText && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              {badgeText}
            </span>
          )}
        </div>

        {/* Right side utilities */}
        <div className="flex items-center gap-2">
          <Link
            to="/history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg pb-control text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:text-[#5668FF] transition-colors"
            aria-label="View History"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden md:inline">History</span>
          </Link>
        </div>
      </header>

      {/* ─── Workbench Body ─── */}
      {isMobile ? (
        /* Mobile: Pinned Top 52% Viewport + Interactive Bottom Sheet */
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Top Canvas Viewport (Preview / Dropzone / Comparison) */}
          <div className="h-[48dvh] overflow-y-auto p-3 pb-dot-matrix flex items-center justify-center">
            <div className="w-full max-w-md mx-auto">
              {canvas}
            </div>
          </div>

          {/* Interactive Bottom Sheet (Controls & Scrubber) */}
          <BottomSheet>
            <div className="space-y-4">
              {inspector}
              {aiDrawer && (
                <div className="mt-4 pt-4 border-t border-[var(--pb-border)]">
                  {aiDrawer}
                </div>
              )}
            </div>
          </BottomSheet>
        </div>
      ) : (
        /* Desktop: Fixed Zero-Scroll Split Workbench */
        <div className="flex-1 flex overflow-hidden">
          {/* Left/Center Canvas — 70% width with dot-matrix background */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 pb-dot-matrix flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl my-auto">
              {canvas}
            </div>
          </div>

          {/* Right Inspector Rail — 360px fixed width with specular hairlines & subtle noise */}
          <aside
            className="w-[360px] shrink-0 overflow-y-auto border-l border-[var(--pb-border)] pb-panel pb-noise flex flex-col justify-between"
            style={{
              boxShadow: 'inset 0 1px 0 0 var(--pb-specular)',
            }}
          >
            <div className="p-5 space-y-5">
              {inspector}
            </div>

            {aiDrawer && (
              <div className="border-t border-[var(--pb-border)] bg-[var(--pb-control)] p-4">
                {aiDrawer}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

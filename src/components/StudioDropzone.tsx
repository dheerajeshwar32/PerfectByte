import { type ReactNode, type DragEvent } from 'react';

interface StudioDropzoneProps {
  isDragging: boolean;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onClick?: () => void;
  fileInput?: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconColor?: string;
  formats?: string[];
  isProcessing?: boolean;
  processingMessage?: string;
  className?: string;
}

export default function StudioDropzone({
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
  fileInput,
  title,
  subtitle = 'Drag & drop anywhere, or click to browse files from device',
  icon,
  iconColor = 'text-blue-500',
  formats = ['PNG', 'JPEG', 'WebP', 'PDF'],
  isProcessing = false,
  processingMessage = 'Optimizing and converging...',
  className = '',
}: StudioDropzoneProps) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={title}
      className={`group relative w-full min-h-[460px] lg:min-h-[500px] flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-between p-6 sm:p-10 cursor-pointer overflow-hidden ${
        isDragging
          ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 scale-[1.008] shadow-[0_0_35px_rgba(59,130,246,0.25)]'
          : 'border-blue-500/25 hover:border-blue-500/60 dark:border-blue-500/30 hover:dark:border-blue-400/60 bg-gradient-to-b from-blue-50/40 via-white/40 to-white/60 dark:bg-[#10131C]/80 hover:shadow-[0_12px_40px_-15px_rgba(59,130,246,0.18)]'
      } ${className}`}
      style={{
        boxShadow: 'inset 0 1px 0 0 var(--pb-specular)',
        touchAction: 'pan-y',
      }}
    >
      {/* Background ambient center radial spotlight (Tier 3) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/5 dark:bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12)_0%,transparent_65%)] pointer-events-none" />

      {fileInput}

      {/* Top formats badge strip */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {formats.map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white/80 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-xs"
            >
              {fmt}
            </span>
          ))}
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>WASM SIMD Ready</span>
        </span>
      </div>

      {/* Center 3D-Style Floating Icon & Callout */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-6 max-w-md">
        <div className="relative mb-5">
          {/* Soft blue ambient glow behind icon */}
          <div className="absolute inset-0 rounded-2xl bg-blue-500/25 dark:bg-blue-400/20 blur-xl scale-125 group-hover:scale-150 transition-transform duration-500" />

          {/* 3D-style layered icon card */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-white to-slate-100 dark:from-white/15 dark:to-white/5 border border-slate-200/80 dark:border-white/20 shadow-[0_12px_30px_-5px_rgba(59,130,246,0.35)] flex items-center justify-center group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
            {icon || (
              <svg className={`w-8 h-8 sm:w-10 sm:h-10 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
          {isProcessing ? processingMessage : title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
          {subtitle}
        </p>

        {/* Keyboard shortcut keycaps */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-black/40 border border-slate-200/70 dark:border-white/10 shadow-xs text-xs font-mono text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-200">⌘V</kbd>
            <span className="text-[11px]">Paste</span>
          </span>
          <span className="text-slate-300 dark:text-zinc-700">·</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-200">↵</kbd>
            <span className="text-[11px]">Browse</span>
          </span>
        </div>
      </div>

      {/* Bottom Micro-Trust Bar */}
      <div className="relative z-10 w-full pt-4 border-t border-slate-200/60 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-300 font-bold">Zero Server Uploads</span>
          <span>•</span>
          <span>Executed in Local WASM Memory</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
          <span>Instant Byte Convergence</span>
        </div>
      </div>
    </div>
  );
}

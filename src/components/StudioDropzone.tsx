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
          ? 'border-[#5268FF] bg-[#EEF2FF] scale-[1.008] shadow-[0_0_35px_rgba(82,104,255,0.25)]'
          : 'bg-[radial-gradient(circle_at_50%_45%,#EBF0FF_0%,#F6F8FC_55%,#FFFFFF_100%)] border-[#C7D4FF] hover:border-[#5268FF] hover:shadow-[0_12px_40px_-15px_rgba(82,104,255,0.18)]'
      } ${className}`}
      style={{
        boxShadow: 'inset 0 1px 0 0 var(--pb-specular)',
        touchAction: 'pan-y',
      }}
    >
      {/* Background ambient center radial spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#5268FF]/5 pointer-events-none blur-3xl" />

      {fileInput}

      {/* Top formats badge strip */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {formats.map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 text-[#5A628A] border border-[#E2E8F8] shadow-xs"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Center 3D-Style Floating Icon & Callout */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-6 max-w-md">
        <div className="relative mb-5">
          {/* Soft periwinkle ambient glow behind icon */}
          <div className="absolute inset-0 rounded-2xl bg-[#5268FF]/20 blur-xl scale-125 group-hover:scale-150 transition-transform duration-500" />

          {/* White squircle icon card */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-[0_8px_24px_rgba(82,104,255,0.18)] border border-[#E2E8F8] flex items-center justify-center group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
            {icon || (
              <svg className={`w-8 h-8 sm:w-10 sm:h-10 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D325A] mb-2">
          {isProcessing ? processingMessage : title}
        </h3>

        <p className="text-xs sm:text-sm text-[#5A628A] leading-relaxed mb-5">
          {subtitle}
        </p>

        {/* Keyboard shortcut keycaps */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-[#E2E8F8] shadow-xs text-xs font-mono text-[#5A628A]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[10px] font-bold text-[#2D325A]">⌘V</kbd>
            <span className="text-[11px]">Paste</span>
          </span>
          <span className="text-[#C7D4FF]">·</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[10px] font-bold text-[#2D325A]">↵</kbd>
            <span className="text-[11px]">Browse</span>
          </span>
        </div>
      </div>

      {/* Bottom Micro-Trust Bar */}
      <div className="relative z-10 w-full pt-4 border-t border-[#E2E8F8] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-[#5A628A]">
        <div className="flex items-center gap-1.5">
          <span>🔒</span>
          <span className="font-semibold text-[#5A628A]">Files never leave your device</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-[#848DB3]">
          <span>Instant &amp; Lossless</span>
        </div>
      </div>
    </div>
  );
}

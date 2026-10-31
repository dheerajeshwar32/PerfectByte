import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { haptic } from './usePWA';
import {
  Landmark,
  FileCheck,
  MessageCircle,
  GraduationCap,
  Briefcase,
  Mail,
  Zap,
} from 'lucide-react';

interface TargetScrubberProps {
  value: number; // in KB
  onChange: (kb: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

/** Real-world submission portal limits and presets */
const DETENTS = [
  { kb: 50, label: '50K' },
  { kb: 100, label: '100K' },
  { kb: 200, label: '200K' },
  { kb: 500, label: '500K' },
  { kb: 1000, label: '1M' },
  { kb: 2000, label: '2M' },
  { kb: 5000, label: '5M' },
  { kb: 10240, label: '10M' },
];

const PRESETS = [
  { label: 'Govt Portal', sub: '100,000 bytes', icon: Landmark, kb: 100 },
  { label: 'Strict Portal', sub: '200,000 bytes', icon: FileCheck, kb: 200 },
  { label: 'WhatsApp', sub: '50,000 bytes', icon: MessageCircle, kb: 50 },
  { label: 'University', sub: '500,000 bytes', icon: GraduationCap, kb: 500 },
  { label: 'LinkedIn', sub: '2,000,000 bytes', icon: Briefcase, kb: 2000 },
  { label: 'Email Safe', sub: '5,000,000 bytes', icon: Mail, kb: 5000 },
];

function kbToPercent(kb: number, min: number, max: number): number {
  const logMin = Math.log(Math.max(1, min));
  const logMax = Math.log(max);
  const logVal = Math.log(Math.max(min, Math.min(max, kb)));
  return Math.max(0, Math.min(100, ((logVal - logMin) / (logMax - logMin)) * 100));
}

function percentToKb(pct: number, min: number, max: number): number {
  const logMin = Math.log(Math.max(1, min));
  const logMax = Math.log(max);
  const logVal = logMin + (pct / 100) * (logMax - logMin);
  return Math.round(Math.exp(logVal));
}

export default function TargetScrubber({
  value,
  onChange,
  min = 10,
  max = 10240,
  disabled = false,
}: TargetScrubberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const lastDetentRef = useRef<number | null>(null);

  const sliderPercent = useMemo(() => kbToPercent(value, min, max), [value, min, max]);

  const handleSliderChange = useCallback(
    (rawPct: number) => {
      let chosenKb = percentToKb(rawPct, min, max);
      let matchedDetent: number | null = null;

      for (const d of DETENTS) {
        const detentPct = kbToPercent(d.kb, min, max);
        if (Math.abs(rawPct - detentPct) <= 2.2) {
          chosenKb = d.kb;
          matchedDetent = d.kb;
          break;
        }
      }

      if (matchedDetent !== null) {
        if (lastDetentRef.current !== matchedDetent) {
          lastDetentRef.current = matchedDetent;
          haptic(10);
        }
      } else {
        lastDetentRef.current = null;
      }

      onChange(chosenKb);
    },
    [min, max, onChange]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    const parsed = Math.max(min, Math.min(max, parseInt(editValue, 10) || value));
    onChange(parsed);
    setIsEditing(false);
  };

  const targetBytes = value * 1000;
  const isAtDetent = DETENTS.some((d) => d.kb === value);

  return (
    <div className="space-y-4 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.07] bg-white/60 dark:bg-[#141824]/90 backdrop-blur-md shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      {/* ─── Digital Byte Readout Hardware Card ─── */}
      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-b from-slate-900 to-slate-950 dark:bg-[#080A10] text-white shadow-xl border border-slate-800 dark:border-blue-500/30 dark:shadow-[inset_0_0_32px_rgba(59,130,246,0.12)]">
        {/* Subtle grid mesh background */}
        <div className="absolute inset-0 pb-dot-matrix opacity-20 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-400">
              TARGET CAPACITY
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-mono font-bold tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              LOCKED UPPER CAP
            </span>
          </div>

          {isAtDetent && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>MAGNETIC SNAP</span>
            </span>
          )}
        </div>

        {/* Center Readout */}
        <div className="relative z-10 flex flex-col items-center justify-center py-1">
          {isEditing ? (
            <div className="flex items-baseline gap-2 px-4 py-1.5 rounded-xl bg-white/10 border border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <input
                ref={inputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditValue(String(value));
                  }
                }}
                min={min}
                max={max}
                aria-label="Target file size in kilobytes"
                className="w-32 text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-center bg-transparent outline-none text-white tracking-tight"
              />
              <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">KB</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditValue(String(value));
                setIsEditing(true);
              }}
              disabled={disabled}
              className="group flex items-baseline gap-2 px-4 py-1 rounded-xl hover:bg-white/[0.06] transition-all cursor-text"
              aria-label={`Target: ${value} KB. Click to directly type size.`}
              title="Click to type exact byte size"
            >
              <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-white tracking-tight drop-shadow-md">
                {value.toLocaleString()}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-blue-400 font-mono">KB</span>
              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-mono transition-opacity ml-1.5">
                [EDIT]
              </span>
            </button>
          )}

          {/* Dual-Unit Live Telemetry Badges */}
          <div className="flex items-center gap-2 mt-2 text-xs font-mono tabular-nums text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-slate-200 font-semibold text-[11px]">
              {targetBytes.toLocaleString()} bytes
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-slate-200 font-semibold text-[11px]">
              {(targetBytes / 1024).toFixed(1)} KiB
            </span>
          </div>
        </div>
      </div>

      {/* ─── Unified Tactile Ruler Scrubber Track ─── */}
      <div className="space-y-1.5 pt-0.5">
        <div className="relative py-2 flex items-center">
          {/* Single unified custom slider track */}
          <div className="relative h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-blue-600"
              style={{ width: `${sliderPercent}%` }}
            />
          </div>

          {/* Active Thumb centered vertically on track */}
          <div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white dark:bg-[#1E2028] border-2 border-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.45)] z-10 transition-transform active:scale-110"
            style={{ left: `calc(10px + (${sliderPercent} / 100) * (100% - 20px))` }}
          />

          {/* Invisible interactive range input covering the full slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={sliderPercent}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            disabled={disabled}
            aria-label="Target file size scrubber"
            className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-20"
          />
        </div>

        {/* SVG Ruler Tick Marks & Graduations with px-2 horizontal padding */}
        <div className="relative w-full h-8 px-2 select-none">
          <svg className="w-full h-full select-none" viewBox="0 0 1000 32" preserveAspectRatio="none">
            {Array.from({ length: 41 }, (_, i) => {
              const x = (i / 40) * 1000;
              return (
                <line
                  key={`fine-${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={i % 4 === 0 ? 8 : 4}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-300 dark:text-zinc-700"
                />
              );
            })}

            {DETENTS.map((d) => {
              const pct = kbToPercent(d.kb, min, max);
              const x = (pct / 100) * 1000;
              const isSelected = d.kb === value;

              return (
                <g
                  key={d.label}
                  onClick={() => {
                    onChange(d.kb);
                    haptic(10);
                  }}
                  className="cursor-pointer"
                >
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={isSelected ? 16 : 10}
                    stroke={isSelected ? '#3B82F6' : 'currentColor'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className={isSelected ? '' : 'text-slate-400 dark:text-zinc-600'}
                  />
                  <text
                    x={x}
                    y={28}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    fill={isSelected ? '#3B82F6' : 'currentColor'}
                    className={isSelected ? '' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700'}
                    fontFamily="ui-monospace, monospace"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ─── Quick Portal Presets Grid (2-Column Bento Tiles with lucide-react vector icons) ─── */}
      <div className="space-y-2 pt-0.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
          QUICK PORTAL LIMITS
        </span>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const isCurrent = value === p.kb;
            const IconComp = p.icon;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(p.kb);
                  haptic(10);
                }}
                className={`p-2.5 rounded-xl text-left transition-all border flex items-center gap-2.5 ${
                  isCurrent
                    ? 'bg-blue-500/10 border-blue-500/60 shadow-xs'
                    : 'bg-white dark:bg-[#141824]/90 border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-[#191E2D]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-blue-500 text-white shadow-xs'
                      : 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
                    {p.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
  { label: 'Govt Portal', sub: 'Under 100 KB', icon: Landmark, kb: 100 },
  { label: 'Strict Portal', sub: 'Under 200 KB', icon: FileCheck, kb: 200 },
  { label: 'WhatsApp', sub: 'Under 50 KB', icon: MessageCircle, kb: 50 },
  { label: 'University', sub: 'Under 500 KB', icon: GraduationCap, kb: 500 },
  { label: 'LinkedIn', sub: 'Under 2 MB', icon: Briefcase, kb: 2000 },
  { label: 'Email Safe', sub: 'Under 5 MB', icon: Mail, kb: 5000 },
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

  const isAtDetent = DETENTS.some((d) => d.kb === value);

  return (
    <div className="space-y-4 rounded-2xl p-4 sm:p-5 border border-[#E2E8F8] dark:border-[#252D58] bg-white/95 dark:bg-[#151A36] backdrop-blur-xl shadow-[0_10px_35px_-10px_rgba(45,50,90,0.06)]">
      {/* ─── Digital Byte Readout Hardware Card ─── */}
      <div className="relative overflow-hidden rounded-2xl p-4 md:p-6 bg-gradient-to-br from-[#343A68] via-[#2D325A] to-[#222647] text-white shadow-[0_14px_32px_-8px_rgba(45,50,90,0.28)] border border-[#5268FF]/30">
        {/* Subtle grid mesh background */}
        <div className="absolute inset-0 pb-dot-matrix opacity-20 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#C7D4FF]">
            MAXIMUM FILE SIZE
          </span>

          {isAtDetent && (
            <span className="text-[10px] font-mono text-[#C7D2FE] font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#5268FF]" />
              <span>Guaranteed Under Limit</span>
            </span>
          )}
        </div>

        {/* Center Readout */}
        <div className="relative z-10 flex flex-col items-center justify-center py-2">
          {isEditing ? (
            <div className="flex items-baseline gap-2 px-4 py-1.5 rounded-xl bg-white/10 border border-[#5268FF] shadow-[0_0_20px_rgba(82,104,255,0.3)]">
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
              <span className="text-xl sm:text-2xl font-black font-mono chromatic-accent">KB</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditValue(String(value));
                setIsEditing(true);
              }}
              disabled={disabled}
              className="group flex items-baseline gap-2 px-4 py-1 rounded-xl hover:bg-white/[0.08] transition-all cursor-text"
              aria-label={`Target: ${value} KB. Click to directly type size.`}
              title="Click to type exact byte size"
            >
              <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-white tracking-tight drop-shadow-md">
                {value.toLocaleString()}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono chromatic-accent">KB</span>
              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-[#C7D4FF] font-mono transition-opacity ml-1.5">
                [EDIT]
              </span>
            </button>
          )}

          {/* Clean Sub-Text: Your file will be saved under {value} KB */}
          <div className="mt-2 text-xs font-mono text-[#C7D2FE]">
            Your file will be saved under {value} KB
          </div>
        </div>
      </div>

      {/* ─── Unified Tactile Ruler Scrubber Track ─── */}
      <div className="space-y-1.5 pt-0.5">
        <div className="relative py-2 flex items-center">
          {/* Single unified custom slider track */}
          <div className="relative h-2 w-full rounded-full bg-[#E2E8F8] dark:bg-[#1B2244] overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#5268FF]"
              style={{ width: `${sliderPercent}%` }}
            />
          </div>

          {/* Active Thumb centered vertically on track */}
          <div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 md:w-5 md:h-5 rounded-full bg-white dark:bg-[#1B2244] border-2 border-[#5268FF] shadow-[0_2px_8px_rgba(82,104,255,0.45)] z-10 transition-transform active:scale-110"
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
            className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-20 touch-pan-y [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6"
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
                  className="text-[#C7D4FF]"
                />
              );
            })}

            {DETENTS.map((d) => {
              const pct = kbToPercent(d.kb, min, max);
              const x = (pct / 100) * 1000;
              const isSelected = d.kb === value;
              const isMajor = ['50K', '200K', '1M', '10M'].includes(d.label);

              return (
                <g
                  key={d.label}
                  onClick={() => {
                    onChange(d.kb);
                    haptic(10);
                  }}
                  className={`cursor-pointer ${isMajor ? '' : 'hidden md:block'}`}
                >
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={isSelected ? 16 : 10}
                    stroke={isSelected ? '#5268FF' : '#A0AEC0'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />
                  <text
                    x={x}
                    y={28}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    fill={isSelected ? '#5268FF' : '#5A628A'}
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

      {/* ─── Quick Portal Presets Grid (2-Column Bento Tiles) ─── */}
      <div className="space-y-2 pt-0.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#848DB3] font-bold block">
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
                className={`p-2.5 rounded-xl text-left transition-all border flex items-center gap-2.5 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#EEF2FF] dark:bg-[#232C56] border-[#5268FF] shadow-xs'
                    : 'bg-white dark:bg-[#1B2244] border-[#E2E8F8] dark:border-[#2B3566] hover:border-[#5268FF]/50 dark:hover:bg-[#232C56] hover:bg-[#F6F8FC]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-[#5268FF] text-white shadow-xs'
                      : 'bg-[#EEF2FF] dark:bg-[#151A36] text-[#5268FF]'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#2D325A] dark:text-[#F0F4FF] truncate">
                    {p.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#5A628A] dark:text-[#9BA6D1] font-medium">
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

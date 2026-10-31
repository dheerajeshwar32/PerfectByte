import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { haptic } from './usePWA';

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
  { kb: 10240, label: '10M' }
];

const PRESETS = [
  { label: '🏛️ Govt 100KB', kb: 100 },
  { label: '🏛️ Portal 200KB', kb: 200 },
  { label: '📱 WhatsApp 50KB', kb: 50 },
  { label: '🎓 University 500KB', kb: 500 },
  { label: '💼 LinkedIn 2MB', kb: 2000 },
  { label: '📧 Email 5MB', kb: 5000 },
];

/**
 * Logarithmic mapping transforms between continuous slider percentage [0, 100]
 * and file size [min, max] KB so that precision detents (50KB, 100KB, 200KB)
 * are spaced luxuriously across the track rather than squeezed into the first 1%.
 */
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

/**
 * Hardware-Inspired Target-Byte Scrubber
 * Inspired by Teenage Engineering OP-1 / TP-7 precision instrumentation:
 * - Log-scale tactile travel
 * - Mechanical SVG ruler graduations & magnetic detents
 * - Micro-haptic tactile feedback
 * - Inline direct-input pill with tabular-nums
 */
export default function TargetScrubber({
  value,
  onChange,
  min = 10,
  max = 10240,
  disabled = false
}: TargetScrubberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const lastDetentRef = useRef<number | null>(null);

  const sliderPercent = useMemo(() => kbToPercent(value, min, max), [value, min, max]);

  // Magnetic snap: if user scrubs within ±2% of a detent's position, magnetically lock to it
  const handleSliderChange = useCallback((rawPct: number) => {
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
  }, [min, max, onChange]);

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
  const isAtDetent = DETENTS.some(d => d.kb === value);

  return (
    <div className="space-y-4 pb-panel p-4 rounded-2xl select-none">
      {/* ─── Header & Detent Lock LED ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-mono">
            TARGET CAPACITY
          </span>
          {isAtDetent && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#5668FF]/15 text-[#5668FF] text-[9px] font-mono font-bold tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5668FF] animate-pulse" />
              LOCKED
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500">
          SNAP DETENTS ACTIVE
        </span>
      </div>

      {/* ─── Inline Direct Input Pill Readout ─── */}
      <div className="flex flex-col items-center justify-center py-2">
        {isEditing ? (
          <div className="flex items-baseline gap-1.5 pb-control px-4 py-2 rounded-xl border border-[#5668FF]/60 shadow-[0_0_15px_rgba(86,104,255,0.2)]">
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') { setIsEditing(false); setEditValue(String(value)); }
              }}
              min={min}
              max={max}
              aria-label="Target file size in kilobytes"
              className="w-28 text-4xl font-black font-mono tabular-nums text-center bg-transparent outline-none text-zinc-900 dark:text-white"
            />
            <span className="text-xl font-black text-[#5668FF] font-mono">KB</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setEditValue(String(value)); setIsEditing(true); }}
            disabled={disabled}
            className="group flex items-baseline gap-2 px-5 py-2 rounded-xl hover:bg-[var(--pb-control)] transition-all cursor-text pb-control"
            aria-label={`Target: ${value} KB. Click to directly type size.`}
            title="Click to type exact byte size"
          >
            <span className="text-4xl md:text-5xl font-black font-mono tabular-nums text-zinc-900 dark:text-white tracking-tight">
              {value.toLocaleString()}
            </span>
            <span className="text-xl font-black text-[#5668FF] font-mono">KB</span>
            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 font-mono transition-opacity ml-1">
              [EDIT]
            </span>
          </button>
        )}

        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 tabular-nums mt-1.5 flex items-center gap-2">
          <span>{targetBytes.toLocaleString()} bytes</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span>{(targetBytes / 1024).toFixed(1)} KiB</span>
        </div>
      </div>

      {/* ─── Mechanical Slider Track ─── */}
      <div className="relative pt-1">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={sliderPercent}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          disabled={disabled}
          aria-label="Target file size scrubber"
          className="scrubber-track"
        />

        {/* ─── SVG Ruler Tick Marks & Graduations (Directly Beneath Track) ─── */}
        <div className="relative w-full h-7 mt-1.5 overflow-hidden">
          <svg className="w-full h-full select-none" viewBox="0 0 1000 28" preserveAspectRatio="none">
            {/* Minor ticks (mechanical fine graduations) */}
            {Array.from({ length: 41 }, (_, i) => {
              const x = (i / 40) * 1000;
              return (
                <line
                  key={`fine-${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={i % 4 === 0 ? 6 : 3}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-zinc-300 dark:text-zinc-800"
                />
              );
            })}

            {/* Major detent graduations & labels positioned by exact log-percentage */}
            {DETENTS.map((d) => {
              const pct = kbToPercent(d.kb, min, max);
              const x = (pct / 100) * 1000;
              const isSelected = d.kb === value;

              return (
                <g key={d.label}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={isSelected ? 14 : 10}
                    stroke={isSelected ? '#5668FF' : 'currentColor'}
                    strokeWidth={isSelected ? '2' : '1.2'}
                    className={isSelected ? '' : 'text-zinc-400 dark:text-zinc-600'}
                  />
                  <text
                    x={x}
                    y={24}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    fill={isSelected ? '#5668FF' : 'currentColor'}
                    className={isSelected ? '' : 'text-zinc-400 dark:text-zinc-500'}
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

      {/* ─── Presets Strip ─── */}
      <div className="pt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
          Quick Portal Presets
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => {
            const isCurrent = value === p.kb;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(p.kb);
                  haptic(10);
                }}
                disabled={disabled}
                className={`px-2.5 py-1.5 text-[11px] font-mono rounded-lg transition-all text-left flex items-center justify-between ${
                  isCurrent
                    ? 'bg-[#5668FF] text-white font-bold shadow-sm'
                    : 'pb-control text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{p.label}</span>
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

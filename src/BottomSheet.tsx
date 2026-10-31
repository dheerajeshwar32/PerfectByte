import { type ReactNode, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { haptic } from './usePWA';

interface BottomSheetProps {
  children: ReactNode;
  snapPoint?: 'peek' | 'expanded';
  onSnapChange?: (snap: 'peek' | 'expanded') => void;
}

/**
 * Mobile Interactive Bottom Sheet with Framer-Motion Spring Physics
 * Snap Points:
 * - peek: ~45% viewport height (quick scrubber & compression trigger)
 * - expanded: ~88% viewport height (AI Assistant chat & detailed settings)
 */
export default function BottomSheet({ children, snapPoint: externalSnap, onSnapChange }: BottomSheetProps) {
  const [internalSnap, setInternalSnap] = useState<'peek' | 'expanded'>('peek');
  const snap = externalSnap ?? internalSnap;

  const setSnap = (newSnap: 'peek' | 'expanded') => {
    if (newSnap !== snap) {
      haptic(10);
    }
    setInternalSnap(newSnap);
    onSnapChange?.(newSnap);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged upward fast or far, expand to 88%
    if (info.velocity.y < -300 || info.offset.y < -60) {
      setSnap('expanded');
    } else if (info.velocity.y > 300 || info.offset.y > 60) {
      setSnap('peek');
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{
        height: snap === 'expanded' ? '86dvh' : '48dvh',
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="fixed bottom-16 left-0 right-0 z-40 pb-panel rounded-t-3xl border-t border-[var(--pb-border)] shadow-[0_-8px_30px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden"
      style={{
        boxShadow: 'inset 0 1px 0 0 var(--pb-specular), 0 -10px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* ─── Drag Handle Bar & Header ─── */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="w-full flex flex-col items-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing shrink-0 select-none touch-none"
        onClick={() => setSnap(snap === 'peek' ? 'expanded' : 'peek')}
      >
        <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 transition-colors" />
        <div className="w-full flex items-center justify-between px-4 mt-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
            {snap === 'expanded' ? 'Controls & AI Assistant (Full View)' : 'Controls'}
          </span>
          <button
            type="button"
            className="text-[11px] font-mono font-semibold text-[#5668FF] hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setSnap(snap === 'peek' ? 'expanded' : 'peek');
            }}
          >
            {snap === 'expanded' ? 'Collapse ↓' : 'Expand ↑'}
          </button>
        </div>
      </motion.div>

      {/* ─── Sheet Content ─── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {children}
      </div>
    </motion.div>
  );
}

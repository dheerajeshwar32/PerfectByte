import { useState } from 'react';
import { getHistory, getHistoryStats, clearHistory, type HistoryEntry } from './historyService';
import { formatBytes } from './utils';
import Navbar from './Navbar';
import Footer from './Footer';
import { useDocumentTitle } from './useDocumentTitle';
import { haptic } from './usePWA';

export default function History() {
  useDocumentTitle('History');

  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory());
  const [stats, setStats] = useState(() => getHistoryStats());
  const [confirmClear, setConfirmClear] = useState(false);

  const loadHistory = () => {
    setEntries(getHistory());
    setStats(getHistoryStats());
  };

  const handleClear = () => {
    if (confirmClear) {
      clearHistory();
      loadHistory();
      setConfirmClear(false);
      haptic(10);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const totalSaved = stats.totalOriginal - stats.totalCompressed;

  return (
    <div className="min-h-dvh bg-[#F6F8FC] dark:bg-[#0B0E1B] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <Navbar />

      <main className="flex-1 bg-white/95 dark:bg-[#12182B]/90 p-6 md:p-10 rounded-3xl max-w-4xl w-[calc(100%-2rem)] mx-auto text-center relative z-10 mt-2 mb-16 border border-[#E2E8F8] dark:border-white/[0.08] shadow-[0_10px_35px_-10px_rgba(45,50,90,0.06)]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#5268FF] font-semibold block mb-2">
          YOUR ACTIVITY
        </span>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#2D325A] dark:text-white mb-6">
          Storage History
        </h1>

        <div className="bg-gradient-to-b from-[#F0F4FF] to-white dark:from-[#141824] dark:to-[#10131C] border border-[#D8E0F8] dark:border-white/[0.08] p-6 rounded-2xl mb-8 max-w-md mx-auto shadow-sm">
          <span className="text-xs font-mono text-[#848DB3] uppercase tracking-wider block mb-1">
            Total Space Reclaimed
          </span>
          <div className="text-5xl md:text-6xl font-black font-mono tabular-nums text-[#5268FF] chromatic-accent mb-2">
            {formatBytes(totalSaved > 0 ? totalSaved : 0)}
          </div>
          <p className="text-xs font-mono text-[#848DB3]">
            Across {stats.count.toLocaleString()} file{stats.count === 1 ? '' : 's'} compressed
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="text-[#848DB3] py-12 font-mono text-sm">
            <svg className="w-12 h-12 mx-auto mb-3 text-[#C7D4FF] dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No compression entries recorded yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 mb-8 text-left max-w-2xl mx-auto">
            {entries.map((entry) => {
              const reduction = entry.originalSize > 0
                ? ((entry.originalSize - entry.compressedSize) / entry.originalSize * 100).toFixed(0)
                : 0;
              const date = new Date(entry.timestamp).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div
                  key={entry.id}
                  className="bg-[#EEF2FF]/60 dark:bg-[#151A36] border border-[#E2E8F8] dark:border-[#252D58] p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <span className="truncate block text-xs sm:text-sm font-semibold text-[#2D325A] dark:text-[#F0F4FF]" title={entry.fileName}>
                      {entry.fileName}
                    </span>
                    <span className="text-[10px] text-[#848DB3] dark:text-[#6E78A3]">{date}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-xs">
                    <span className="text-[#848DB3] line-through">{formatBytes(entry.originalSize)}</span>
                    <span className="text-[#5268FF] font-bold">→ {formatBytes(entry.compressedSize)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-[#1B2244] text-[#5268FF] border border-[#C7D4FF] dark:border-[#2B3566] font-bold text-[10px]">
                      -{reduction}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              confirmClear
                ? 'bg-rose-500 text-white'
                : 'bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-[#10131C] text-[#5A628A] hover:text-rose-500 border border-[#E2E8F8] dark:border-white/10'
            }`}
          >
            {confirmClear ? 'Click again to permanently erase history' : 'Clear Ledger History'}
          </button>
        )}
      </main>

      <Footer />
    </div>
  );
}

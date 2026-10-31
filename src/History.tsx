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
    <div className="min-h-dvh pb-canvas flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 pb-panel p-6 md:p-10 rounded-3xl max-w-4xl w-[calc(100%-2rem)] mx-auto text-center relative z-10 mt-2 mb-16 border border-[var(--pb-border)]"
        style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
      >
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">
          AUDIT &amp; SAVINGS LEDGER
        </span>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-6">
          Storage History
        </h1>

        <div className="pb-control p-6 rounded-2xl mb-8 max-w-md mx-auto">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
            Total Space Reclaimed
          </span>
          <div className="text-5xl md:text-6xl font-black font-mono tabular-nums text-emerald-500 mb-2">
            {formatBytes(totalSaved > 0 ? totalSaved : 0)}
          </div>
          <p className="text-xs font-mono text-zinc-400">
            Across {stats.count.toLocaleString()} file{stats.count === 1 ? '' : 's'} compressed
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="text-zinc-500 py-12 font-mono text-sm">
            <svg className="w-12 h-12 mx-auto mb-3 text-zinc-400 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="pb-control p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate" title={entry.fileName}>
                      {entry.fileName}
                    </span>
                    <span className="text-[10px] text-zinc-400">{date}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-zinc-400 line-through">{formatBytes(entry.originalSize)}</span>
                    <span className="text-[#5668FF] font-bold">→ {formatBytes(entry.compressedSize)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold text-[10px]">
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
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
              confirmClear
                ? 'bg-red-500 text-white'
                : 'pb-control text-zinc-500 hover:text-red-500'
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

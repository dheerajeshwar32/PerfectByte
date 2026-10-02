import { useState, useEffect } from 'react';
import { getHistory, getHistoryStats, clearHistory, type HistoryEntry } from './historyService';
import { formatBytes } from './utils';
import Navbar from './Navbar';
import { useDocumentTitle } from './useDocumentTitle';

export default function History() {
  useDocumentTitle('History');

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState({ totalOriginal: 0, totalCompressed: 0, count: 0 });
  const [confirmClear, setConfirmClear] = useState(false);

  const loadHistory = () => {
    setEntries(getHistory());
    setStats(getHistoryStats());
  };

  useEffect(() => {
    setTimeout(() => loadHistory(), 0);
  }, []);

  const handleClear = () => {
    if (confirmClear) {
      clearHistory();
      loadHistory();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      // Reset confirmation after a few seconds
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const totalSaved = stats.totalOriginal - stats.totalCompressed;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>
      <Navbar />
      
      <div className="bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-5xl w-full text-center relative z-10 mt-4 mx-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 to-slate-600 dark:from-white dark:to-slate-400 mb-8 md:mb-12 leading-tight px-4 pb-2">
          Action / <br className="hidden sm:block" />
          <span 
            className="text-[#5668FF] drop-shadow-sm"
            style={{ textShadow: '-2px 0px 0px rgba(0,255,255,0.3), 2px 0px 0px rgba(255,0,255,0.3)' }}
          >
            History
          </span>
        </h1>

        <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Total Space Saved</h2>
        
        <div className="mb-12">
          <div 
            className="text-6xl md:text-8xl font-black font-mono tabular-nums text-[#5668FF] dark:text-[#7888FF] mb-4"
            style={{ textShadow: '-3px 0px 0px rgba(0,255,255,0.6), 3px 0px 0px rgba(255,0,255,0.6)' }}
          >
            {formatBytes(totalSaved > 0 ? totalSaved : 0)}
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Across {stats.count} files compressed
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="text-slate-500 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p>No compression history yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-8 text-left">
            {entries.map((entry) => {
              const reduction = entry.originalSize > 0 
                ? ((entry.originalSize - entry.compressedSize) / entry.originalSize * 100).toFixed(1)
                : 0;
              const date = new Date(entry.timestamp).toLocaleDateString(undefined, { 
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              
              return (
                <div key={entry.id} className="bg-white/60 dark:bg-[#0a0f1c]/50 backdrop-blur-sm p-4 rounded-xl border border-slate-100/80 dark:border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-indigo-900 dark:text-white truncate" title={entry.fileName}>
                      {entry.fileName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {date}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-4 sm:gap-6 shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">{formatBytes(entry.originalSize)}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-[#5668FF]">{formatBytes(entry.compressedSize)}</span>
                    </div>
                    <div className="bg-[#5668FF]/10 text-[#5668FF] rounded-full px-3 py-1 text-sm font-bold">
                      -{reduction}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {entries.length > 0 && (
          <button 
            onClick={handleClear}
            className={`px-6 py-4 rounded-2xl transition-all text-sm font-bold shadow-lg ${
              confirmClear 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
            }`}
          >
            {confirmClear ? 'Are you sure?' : 'Clear History'}
          </button>
        )}
      </div>
    </div>
  );
}

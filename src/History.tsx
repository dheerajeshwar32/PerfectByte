import React, { useState, useEffect } from 'react';
import { getHistory, getHistoryStats, clearHistory, HistoryEntry } from './historyService';
import { formatBytes } from './utils';
import Navbar from './Navbar';
import useDocumentTitle from './useDocumentTitle';

export default function History() {
  useDocumentTitle('History');

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState({ totalOriginal: 0, totalCompressed: 0, count: 0 });
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setEntries(getHistory());
    setStats(getHistoryStats());
  };

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden transition-colors duration-150">
      <Navbar />
      
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800 max-w-5xl w-full text-center relative z-10 mt-12">
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
          <div className="text-left bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">File Name</th>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Original Size</th>
                    <th scope="col" className="px-6 py-3">Compressed Size</th>
                    <th scope="col" className="px-6 py-3">Reduction</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const reduction = entry.originalSize > 0 
                      ? ((entry.originalSize - entry.compressedSize) / entry.originalSize * 100).toFixed(1)
                      : 0;
                    const date = new Date(entry.timestamp).toLocaleDateString(undefined, { 
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    
                    return (
                      <tr key={entry.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900/50'} border-b dark:border-slate-700`}>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white truncate max-w-xs" title={entry.fileName}>
                          {entry.fileName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatBytes(entry.originalSize)}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatBytes(entry.compressedSize)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{reduction}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {entries.length > 0 && (
          <button 
            onClick={handleClear}
            className={`px-6 py-4 rounded-2xl transition-all text-sm font-bold shadow-lg ${
              confirmClear 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {confirmClear ? 'Are you sure?' : 'Clear History'}
          </button>
        )}
      </div>
    </div>
  );
}

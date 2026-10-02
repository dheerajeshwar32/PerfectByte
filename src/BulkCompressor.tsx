import { useState, type ChangeEvent, type DragEvent } from 'react';
import Navbar from './Navbar';
import { compressToWebp } from './compressionService';
import { addHistoryEntry, getHistoryStats } from './historyService';
import { toast } from 'sonner';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import JSZip from 'jszip';

interface CompressedFile {
  name: string;
  url: string;
  originalSize: number;
  compressedSize: number;
}

export default function BulkCompressor() {
  useDocumentTitle('Bulk Compressor');
  
  const [files, setFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stats, setStats] = useState(() => getHistoryStats());
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files));
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });
    compressedFiles.forEach(file => URL.revokeObjectURL(file.url));

    try {
      const results: CompressedFile[] = [];
      for (const file of files) {
        try {
          const blob = await compressToWebp(file);
          results.push({
            name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
            url: URL.createObjectURL(blob),
            originalSize: file.size,
            compressedSize: blob.size,
          });
          addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
        } catch (fileError) {
          console.error(`Failed to compress ${file.name}:`, fileError);
        }
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      setCompressedFiles(results);
      setStats(getHistoryStats());
      
      if (results.length === 0) toast.error("Failed to compress images.");
      else toast.success(`Successfully compressed ${results.length} images!`);
    } catch {
      toast.error("A critical error occurred during compression.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    for (const file of compressedFiles) {
      const response = await fetch(file.url);
      const blob = await response.blob();
      zip.file(file.name, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'perfectbyte-batch.zip';
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalReduction = compressedFiles.reduce((acc, curr) => acc + (curr.originalSize - curr.compressedSize), 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>
      <Navbar />

      <div className="bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-5xl w-[calc(100%-2rem)] mx-auto text-center relative z-10 mt-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 to-slate-600 dark:from-white dark:to-slate-400 mb-8 md:mb-12 leading-tight px-4 pb-2">
          Bulk <br className="hidden sm:block" />
          <span 
            className="text-[#5668FF] drop-shadow-sm"
            style={{ textShadow: '-2px 0px 0px rgba(0,255,255,0.3), 2px 0px 0px rgba(255,0,255,0.3)' }}
          >
            Compress
          </span>
        </h1>
        
        {/* Phase 3: The Hero Stats */}
        <div className="flex flex-col items-center justify-center py-8 mb-8 border-b border-slate-200 dark:border-indigo-800">
          <span className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Total Space Saved</span>
          <div 
            className="text-6xl md:text-8xl font-black font-mono tabular-nums text-[#5668FF] dark:text-[#7888FF]"
            style={{ textShadow: '-3px 0px 0px rgba(0,255,255,0.6), 3px 0px 0px rgba(255,0,255,0.6)' }}
          >
            {stats.count > 0 ? formatBytes(stats.totalOriginal - stats.totalCompressed) : '0 MB'}
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest">
            Across {stats.count} lifetime file{stats.count !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          {compressedFiles.length === 0 && (
            <div
              onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
              className={`relative w-full max-w-2xl mx-auto p-10 md:p-14 border-2 border-dashed rounded-[2rem] transition-all duration-500 cursor-pointer group/drop bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/40 dark:to-slate-900/40 backdrop-blur-sm ${
                isDragging 
                  ? 'border-[#5668FF] bg-[#5668FF]/5 dark:bg-[#5668FF]/10 scale-[1.02] shadow-[0_0_40px_rgba(86,104,255,0.15)]' 
                  : 'border-slate-200/60 dark:border-slate-700/40 hover:border-[#5668FF]/50 hover:shadow-[0_0_40px_rgba(86,104,255,0.08)]'
              }`}
            >
              <input type="file" multiple accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} disabled={isProcessing} className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer" />
              <div className="flex flex-col items-center gap-4 relative z-0">
                <div className="w-16 h-16 rounded-2xl bg-[#5668FF]/10 dark:bg-[#5668FF]/20 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-[#5668FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">{isProcessing ? 'Processing...' : 'Click to select folders or images'}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">or <span className="text-[#5668FF] font-medium hover:underline">browse files</span></p>
                  {files.length > 0 && <span className="mt-4 inline-block bg-indigo-900 text-white font-mono text-xs px-4 py-2 rounded-lg">{files.length} selected</span>}
                </div>
              </div>
            </div>
          )}

          {files.length > 0 && compressedFiles.length === 0 && !isProcessing && (
            <button
              onClick={handleCompress} disabled={isProcessing}
              className="w-full py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0"
            >
              EXECUTE BATCH ({files.length})
            </button>
          )}

          {isProcessing && progress.total > 0 && (
            <div className="w-full bg-slate-100 dark:bg-indigo-800 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                <span>Processing file {progress.current} of {progress.total}</span>
                <span className="text-[#5668FF]">{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-[#5668FF] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Phase 3: The Results Grid */}
        {compressedFiles.length > 0 && (
          <div className="text-left bg-white dark:bg-indigo-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Batch Saved</h3>
                <span className="text-3xl font-black font-mono text-[#5668FF]">{formatBytes(totalReduction)}</span>
              </div>
              <button onClick={handleDownloadAll} className="px-6 py-4 rounded-2xl font-bold transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 text-sm">
                Download ZIP ({compressedFiles.length})
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {compressedFiles.map((file, i) => (
                <div key={i} className="bg-slate-50 dark:bg-indigo-900 p-3 rounded-2xl border border-slate-200 dark:border-indigo-800 flex flex-col group relative">
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-white dark:bg-[#0a0f1c]">
                    <img src={file.url} alt={file.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <a href={file.url} download={file.name} className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-white text-indigo-900 text-xs font-bold px-4 py-2 rounded-lg">Download</span>
                    </a>
                  </div>
                  <div className="flex flex-col px-1">
                    <span className="text-xs font-bold text-indigo-800 dark:text-slate-200 truncate mb-2">{file.name}</span>
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase">
                      <span className="text-slate-400 line-through">{formatBytes(file.originalSize)}</span>
                      <span className="text-[#5668FF] font-bold">{formatBytes(file.compressedSize)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => { setCompressedFiles([]); setFiles([]); }} className="w-full mt-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">
              Clear Batch & Compress More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
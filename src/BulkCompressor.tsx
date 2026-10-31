import { useState, type ChangeEvent, type DragEvent } from 'react';
import ToolShell from './ToolShell';
import { compressToWebp } from './compressionService';
import { addHistoryEntry, getHistoryStats } from './historyService';
import { toast } from 'sonner';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { haptic } from './usePWA';
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
            name: file.name.replace(/\.[^/.]+$/, '') + '.webp',
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
      haptic([12, 40, 20]);

      if (results.length === 0) toast.error('Failed to compress images.');
      else toast.success(`Successfully compressed ${results.length} images!`);
    } catch {
      toast.error('A critical error occurred during compression.');
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
    haptic(10);
  };

  const totalReduction = compressedFiles.reduce((acc, curr) => acc + (curr.originalSize - curr.compressedSize), 0);
  const totalOriginal = compressedFiles.reduce((acc, curr) => acc + curr.originalSize, 0);

  // ─── Canvas Content (70% Left / Mobile Top) ───
  const canvasContent = (
    <div className="flex flex-col items-center justify-center w-full gap-4">
      {compressedFiles.length === 0 ? (
        <div className="w-full space-y-4 max-w-xl">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative w-full p-10 md:p-14 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer group/drop pb-panel ${
              isDragging
                ? 'border-[#5668FF] bg-[#5668FF]/5 dark:bg-[#5668FF]/10 scale-[1.01]'
                : 'border-zinc-300 dark:border-zinc-700/60 hover:border-[#5668FF]/60'
            }`}
            style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
          >
            <input
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              disabled={isProcessing}
              aria-label="Upload multiple images for batch compression"
              className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4 relative z-0 text-center">
              <div className="w-14 h-14 rounded-2xl pb-control flex items-center justify-center group-hover/drop:scale-110 transition-transform">
                <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                  {isProcessing ? 'Processing files...' : 'Select or drop multiple files / folders'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  JPEG, PNG, WebP · Processed in parallel Web Workers
                </p>
              </div>
            </div>
          </div>

          {/* Staged files chips */}
          {files.length > 0 && (
            <div className="pb-panel p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>STAGED FILES ({files.length})</span>
                <span>{formatBytes(files.reduce((a, b) => a + b.size, 0))}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg pb-control text-xs font-mono"
                  >
                    <span className="truncate max-w-[130px] text-zinc-700 dark:text-zinc-300">{file.name}</span>
                    <span className="text-zinc-400 text-[10px]">({formatBytes(file.size)})</span>
                    <button
                      type="button"
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-zinc-400 hover:text-red-500 ml-1 font-bold"
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results Grid */
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--pb-border)]">
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase">
              Optimized Output ({compressedFiles.length} files)
            </span>
            <span className="text-xs font-mono text-emerald-500 font-bold">
              Saved {formatBytes(totalReduction)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[56dvh] overflow-y-auto p-1">
            {compressedFiles.map((file, i) => (
              <div
                key={i}
                className="pb-panel rounded-xl p-2.5 flex flex-col group relative border border-[var(--pb-border)]"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-2 bg-checkerboard">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      URL.revokeObjectURL(file.url);
                      setCompressedFiles(prev => prev.filter((_, idx) => idx !== i));
                    }}
                    aria-label={`Remove ${file.name} from batch`}
                    className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-zinc-900/80 hover:bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                  <img src={file.url} alt={file.name} className="absolute inset-0 w-full h-full object-cover" />
                  <a
                    href={file.url}
                    download={file.name}
                    className="absolute inset-0 bg-[#09090B]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="px-2.5 py-1 rounded bg-[#5668FF] text-white text-[11px] font-mono font-bold">
                      Download
                    </span>
                  </a>
                </div>
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{file.name}</span>
                <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                  <span className="text-zinc-400 line-through">{formatBytes(file.originalSize)}</span>
                  <span className="text-[#5668FF] font-bold">{formatBytes(file.compressedSize)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Inspector Content (360px Fixed Desktop / Mobile Sheet) ───
  const inspectorContent = (
    <div className="space-y-4">
      {/* Batch Stats Panel */}
      <div className="pb-panel p-4 rounded-2xl space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          BATCH TELEMETRY
        </span>

        {compressedFiles.length > 0 ? (
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 block">TOTAL SAVINGS</span>
              <span className="text-4xl font-black font-mono tabular-nums text-emerald-500">
                {formatBytes(totalReduction)}
              </span>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              Reduced from {formatBytes(totalOriginal)} by{' '}
              {totalOriginal > 0 ? ((totalReduction / totalOriginal) * 100).toFixed(0) : 0}%
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 block">LIFETIME STORAGE SAVED</span>
              <span className="text-3xl font-black font-mono tabular-nums text-zinc-900 dark:text-white">
                {stats.count > 0 ? formatBytes(stats.totalOriginal - stats.totalCompressed) : '0 MB'}
              </span>
            </div>
            <div className="text-xs font-mono text-zinc-500">
              Across {stats.count.toLocaleString()} lifetime files processed
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-1.5 pt-2 border-t border-[var(--pb-border)]">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Processing file {progress.current} of {progress.total}</span>
              <span className="text-[#5668FF] font-bold">
                {Math.round((progress.current / Math.max(1, progress.total)) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#5668FF] transition-all duration-200"
                style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="space-y-2">
        {compressedFiles.length > 0 ? (
          <>
            <button
              onClick={handleDownloadAll}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Download ZIP Archive ({compressedFiles.length})</span>
            </button>

            <button
              onClick={() => {
                compressedFiles.forEach(f => URL.revokeObjectURL(f.url));
                setCompressedFiles([]);
                setFiles([]);
              }}
              className="w-full py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-xl pb-control text-center"
            >
              ← Clear Batch &amp; Add More
            </button>
          </>
        ) : (
          <button
            onClick={handleCompress}
            disabled={files.length === 0 || isProcessing}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing Batch...' : `EXECUTE BATCH (${files.length})`}
          </button>
        )}
      </div>

      <div className="pb-panel p-3.5 rounded-xl space-y-1.5 text-xs font-mono text-zinc-500">
        <div className="flex items-center justify-between">
          <span>Engine</span>
          <span className="text-zinc-700 dark:text-zinc-300">WebAssembly SIMD</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Max Workers</span>
          <span className="text-zinc-700 dark:text-zinc-300">4 Parallel</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Target Codec</span>
          <span className="text-zinc-700 dark:text-zinc-300">Google WebP</span>
        </div>
      </div>
    </div>
  );

  return (
    <ToolShell
      title="Bulk Compression"
      accentColor="bg-teal-500"
      badgeText="4x PARALLEL WORKERS"
      canvas={canvasContent}
      inspector={inspectorContent}
    />
  );
}

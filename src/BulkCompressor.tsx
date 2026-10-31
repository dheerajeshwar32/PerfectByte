import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import ToolShell from './ToolShell';
import StudioDropzone from './components/StudioDropzone';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...added]);
      setCompressedFiles([]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const added = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...added]);
      setCompressedFiles([]);
    }
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });
    compressedFiles.forEach((file) => URL.revokeObjectURL(file.url));

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
        setProgress((prev) => ({ ...prev, current: prev.current + 1 }));
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
  const stagedTotalSize = files.reduce((acc, f) => acc + f.size, 0);

  // ─── Left Canvas Stage (7 Columns) ───
  const canvasContent = (
    <div className="flex flex-col w-full h-full min-h-[460px] justify-center items-center gap-4">
      {/* State 1: No files selected yet */}
      {files.length === 0 && compressedFiles.length === 0 && (
        <StudioDropzone
          isDragging={isDragging}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          title="Select or drop entire folders of images"
          subtitle="Processed in parallel with 4 WebAssembly SIMD Web Workers on-device"
          formats={['JPEG', 'PNG', 'WebP']}
          iconColor="text-teal-500"
          fileInput={
            <input
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              disabled={isProcessing}
              aria-label="Upload multiple images for batch compression"
              ref={fileInputRef}
              className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
            />
          }
        />
      )}

      {/* State 2: Files Staged in Queue (Before/During execution) */}
      {files.length > 0 && compressedFiles.length === 0 && (
        <div className="w-full flex-1 flex flex-col p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-md shadow-xs">
          {/* Header bar */}
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>STAGED BATCH QUEUE</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[11px]">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
              </h3>
              <span className="text-xs font-mono text-slate-400">Total payload: {formatBytes(stagedTotalSize)}</span>
            </div>

            <button
              onClick={() => { setFiles([]); }}
              disabled={isProcessing}
              className="text-xs font-mono text-rose-500 hover:underline px-2 py-1 rounded disabled:opacity-50"
            >
              Clear Queue
            </button>
          </div>

          {/* Progress bar when processing */}
          {isProcessing && (
            <div className="mb-4 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
              <div className="flex justify-between text-xs font-mono text-teal-600 dark:text-teal-400 font-bold">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  <span>Processing file {progress.current} of {progress.total}...</span>
                </span>
                <span>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-teal-500/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Staged files list table */}
          <div className="flex-1 max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 text-xs font-mono"
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400">{formatBytes(file.size)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                  disabled={isProcessing}
                  className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 flex items-center justify-center font-bold transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State 3: Compressed Output Grid */}
      {compressedFiles.length > 0 && (
        <div className="w-full flex-1 flex flex-col p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
            <div>
              <span className="text-sm font-bold font-mono uppercase text-slate-800 dark:text-slate-100">
                BATCH CONVERGENCE RESULTS ({compressedFiles.length})
              </span>
              <span className="block text-xs font-mono text-emerald-500 font-bold mt-0.5">
                Saved {formatBytes(totalReduction)} across all files
              </span>
            </div>

            <button
              onClick={() => {
                compressedFiles.forEach(f => URL.revokeObjectURL(f.url));
                setCompressedFiles([]);
                setFiles([]);
              }}
              className="text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {compressedFiles.map((file, i) => (
              <div
                key={i}
                className="rounded-xl p-3 flex flex-col group relative border border-slate-200/80 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.03] shadow-xs"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-2 bg-checkerboard">
                  <img src={file.url} alt={file.name} className="absolute inset-0 w-full h-full object-cover" />
                  <a
                    href={file.url}
                    download={file.name}
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="px-3 py-1 rounded bg-teal-500 text-white text-[11px] font-mono font-bold shadow-md">
                      Download
                    </span>
                  </a>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                  <span className="text-slate-400 line-through">{formatBytes(file.originalSize)}</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">{formatBytes(file.compressedSize)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Right Precision Inspector Console (5 Columns) ───
  const inspectorContent = (
    <div className="space-y-5">
      {/* Telemetry Hero Banner */}
      <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-md shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            BATCH STORAGE TELEMETRY
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            4x SIMD Active
          </span>
        </div>

        {compressedFiles.length > 0 ? (
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block font-bold">LIFETIME STORAGE SAVED</span>
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-emerald-500 tracking-tight">
                {formatBytes(totalReduction)}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Reduced from {formatBytes(totalOriginal)} by{' '}
              {totalOriginal > 0 ? ((totalReduction / totalOriginal) * 100).toFixed(0) : 0}%
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block font-bold">LIFETIME STORAGE SAVED</span>
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-teal-600 dark:text-teal-400 tracking-tight">
                {formatBytes(Math.max(0, stats.totalOriginal - stats.totalCompressed))}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
              <span className="text-slate-400">Files Processed</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{stats.count} files</span>
            </div>
          </div>
        )}
      </div>

      {/* Engine & Settings Specs */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] space-y-2.5 text-xs font-mono text-slate-500">
        <div className="flex items-center justify-between">
          <span>Engine Codec</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">Google WebP (WASM)</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Worker Concurrency</span>
          <span className="font-bold text-teal-600 dark:text-teal-400">4 Parallel Web Workers</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Security / Privacy</span>
          <span className="font-bold text-emerald-500">100% In-Memory RAM</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {compressedFiles.length > 0 ? (
          <>
            <button
              onClick={handleDownloadAll}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-[0_8px_24px_-4px_rgba(20,184,166,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
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
              className="w-full py-2.5 text-xs font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-center"
            >
              ← Clear Batch &amp; Add More
            </button>
          </>
        ) : (
          <button
            onClick={handleCompress}
            disabled={files.length === 0 || isProcessing}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-[0_8px_24px_-4px_rgba(20,184,166,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? 'Processing Batch...' : `EXECUTE BATCH (${files.length} FILES)`}
          </button>
        )}
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

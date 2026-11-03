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
import { Settings2, Download, RefreshCw } from 'lucide-react';

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
  const [targetFormat, setTargetFormat] = useState<'auto' | 'webp' | 'jpeg' | 'png'>('auto');
  const [optProfile, setOptProfile] = useState<'max_savings' | 'visually_lossless'>('max_savings');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (incomingFiles: FileList | File[]) => {
    const list = Array.from(incomingFiles);
    const valid = list.filter((f) => f.type.startsWith('image/'));

    if (valid.length !== list.length) {
      toast.error('Only image formats (JPEG, PNG, WebP) are supported in batch mode');
    }

    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
      haptic(10);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });

    const results: CompressedFile[] = [];

    // Parallel processing with concurrency of 4
    const concurrency = 4;
    const queue = [...files];
    let completedCount = 0;

    const worker = async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (!file) break;

        try {
          const blob = await compressToWebp(file);
          const url = URL.createObjectURL(blob);
          const compressedName = file.name.replace(/\.[^/.]+$/, '') + '.webp';

          results.push({
            name: compressedName,
            url,
            originalSize: file.size,
            compressedSize: blob.size,
          });

          addHistoryEntry({
            fileName: file.name,
            originalSize: file.size,
            compressedSize: blob.size,
          });
        } catch (err) {
          console.error(`Failed to compress ${file.name}`, err);
          toast.error(`Failed: ${file.name}`);
        } finally {
          completedCount++;
          setProgress({ current: completedCount, total: files.length });
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker());
    await Promise.all(workers);

    setCompressedFiles(results);
    setIsProcessing(false);
    setStats(getHistoryStats());
    haptic([12, 40, 20]);
    toast.success(`Batch complete: Processed ${results.length} files successfully!`);
  };

  const handleDownloadAll = async () => {
    if (compressedFiles.length === 0) return;

    if (compressedFiles.length === 1) {
      const file = compressedFiles[0];
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.click();
      haptic(10);
      return;
    }

    const zip = new JSZip();
    for (const file of compressedFiles) {
      const response = await fetch(file.url);
      const blob = await response.blob();
      zip.file(file.name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perfectbyte_batch_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    haptic(10);
    toast.success('ZIP package downloaded successfully!');
  };

  const totalOriginal = compressedFiles.reduce((acc, f) => acc + f.originalSize, 0);
  const totalCompressed = compressedFiles.reduce((acc, f) => acc + f.compressedSize, 0);
  const totalReduction = Math.max(0, totalOriginal - totalCompressed);

  // ─── 7-Column Left Interactive Stage ───
  const canvasContent = (
    <div className="w-full h-full flex flex-col justify-center">
      {files.length === 0 ? (
        <StudioDropzone
          isDragging={isDragging}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          title="Drop multiple images to compress at once"
          subtitle="Shrink dozens of photos in seconds without losing visual quality."
          formats={['PNG', 'JPEG', 'WebP']}
          iconColor="text-[#5268FF]"
          fileInput={
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              aria-label="Upload multiple images to compress"
              className="hidden"
            />
          }
        />
      ) : (
        <div className="w-full flex-1 min-h-[460px] rounded-2xl border border-[#E2E8F8] dark:border-[#252D58] bg-white/95 dark:bg-[#151A36] backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header strip */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F8] dark:border-[#252D58]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-mono text-xs font-bold">
                  {files.length}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D325A] dark:text-[#F0F4FF]">Batch Queue</h3>
                  <p className="text-[11px] font-mono text-[#5A628A] dark:text-[#9BA6D1]">
                    {compressedFiles.length > 0 ? 'Batch execution completed' : 'Staged for 4x worker execution'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  aria-label="Add more images"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-[#1B2244] dark:hover:bg-[#232C56] text-[#2D325A] dark:text-[#F0F4FF] border border-[#E2E8F8] dark:border-[#2B3566] transition-all cursor-pointer"
                >
                  + Add More
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setCompressedFiles([]);
                  }}
                  disabled={isProcessing}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Progress bar during active run */}
            {isProcessing && (
              <div className="mt-4 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-teal-700 dark:text-teal-300">
                    Executing Parallel Optimization...
                  </span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {progress.current} / {progress.total} files ({Math.round((progress.current / progress.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-200"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* File Table / Queue Grid */}
            <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {files.map((file, idx) => {
                const comp = compressedFiles[idx];
                const savedBytes = comp ? Math.max(0, comp.originalSize - comp.compressedSize) : 0;
                const savedPct = comp && comp.originalSize > 0 ? Math.round((savedBytes / comp.originalSize) * 100) : 0;

                return (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#EEF2FF]/50 dark:bg-[#1B2244] hover:bg-white dark:hover:bg-[#232C56] border border-[#E2E8F8] dark:border-[#2B3566] transition-all text-xs font-mono shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-3">
                      <span className="w-5 h-5 rounded bg-[#EEF2FF] dark:bg-[#151A36] text-[#5268FF] dark:text-[#7888FF] flex items-center justify-center text-[10px] shrink-0 font-bold border border-[#C7D4FF] dark:border-[#2B3566]">
                        {idx + 1}
                      </span>
                      <span className="truncate font-medium text-[#2D325A] dark:text-[#F0F4FF]">{file.name}</span>
                      <span className="text-[10px] text-[#848DB3] dark:text-[#6E78A3] shrink-0">({formatBytes(file.size)})</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {comp ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                            -{savedPct}%
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {formatBytes(comp.compressedSize)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Queued</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>SIMD In-Memory WebAssembly</span>
            </span>
            <span>{files.length} items queued</span>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Right Precision Inspector Console (5 Columns) ───
  const inspectorContent = (
    <div className="space-y-4">
      {/* Telemetry Hero Banner */}
      <div className="p-5 rounded-2xl border border-[#E2E8F8] dark:border-[#252D58] bg-white/95 dark:bg-[#151A36] backdrop-blur-md shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#848DB3] font-bold">
            TOTAL SPACE SAVED
          </span>
        </div>

        {compressedFiles.length > 0 ? (
          <div className="space-y-2">
            <div>
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-[#5268FF] chromatic-accent tracking-tight">
                {formatBytes(totalReduction)}
              </span>
            </div>
            <div className="text-xs font-mono text-[#5A628A] dark:text-[#9BA6D1]">
              Reduced from {formatBytes(totalOriginal)} by{' '}
              {totalOriginal > 0 ? ((totalReduction / totalOriginal) * 100).toFixed(0) : 0}%
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-[#5268FF] chromatic-accent tracking-tight">
                {formatBytes(Math.max(0, stats.totalOriginal - stats.totalCompressed))}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#E2E8F8] dark:border-[#252D58]">
              <span className="text-[#848DB3]">Files Processed</span>
              <span className="font-bold text-[#2D325A] dark:text-[#F0F4FF]">{stats.count} files</span>
            </div>
          </div>
        )}
      </div>

      {/* Batch Output Configuration Card */}
      <div className="p-5 rounded-2xl border border-[#E2E8F8] dark:border-[#252D58] bg-white/95 dark:bg-[#151A36] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#2D325A] dark:text-[#F0F4FF] font-bold block">
            OUTPUT SETTINGS
          </span>
          <Settings2 className="w-3.5 h-3.5 text-[#5A628A] dark:text-[#9BA6D1]" />
        </div>

        {/* Target Format Pills */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[#5A628A] dark:text-[#9BA6D1] font-semibold block">
            OUTPUT FORMAT
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['auto', 'webp', 'jpeg', 'png'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => { setTargetFormat(fmt); haptic(8); }}
                className={`min-h-[40px] py-2 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer flex items-center justify-center ${
                  targetFormat === fmt
                    ? 'bg-[#5268FF]/15 dark:bg-[#5268FF]/30 border-[#5268FF]/50 text-[#5268FF] dark:text-[#7888FF] shadow-xs'
                    : 'bg-white dark:bg-[#1B2244] border-[#E2E8F8] dark:border-[#2B3566] text-[#5A628A] dark:text-[#F0F4FF] hover:text-[#2D325A]'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Optimization Profile */}
        <div className="space-y-1.5 pt-2 border-t border-[#E2E8F8] dark:border-[#252D58]">
          <label className="text-[11px] font-mono text-[#5A628A] dark:text-[#9BA6D1] font-semibold block">
            OPTIMIZATION PROFILE
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setOptProfile('max_savings'); haptic(8); }}
              className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                optProfile === 'max_savings'
                  ? 'bg-[#5268FF]/10 dark:bg-[#5268FF]/25 border-[#5268FF]/60 text-[#5268FF] dark:text-[#7888FF] shadow-xs'
                  : 'bg-white dark:bg-[#1B2244] border-[#E2E8F8] dark:border-[#2B3566] text-[#5A628A] dark:text-[#9BA6D1] dark:hover:bg-[#232C56]'
              }`}
            >
              <div className="text-xs font-bold font-mono text-[#2D325A] dark:text-[#F0F4FF]">Smallest File Size</div>
              <div className="text-[10px] text-[#848DB3] dark:text-[#6E78A3] mt-0.5">Saves the most storage space</div>
            </button>
            <button
              type="button"
              onClick={() => { setOptProfile('visually_lossless'); haptic(8); }}
              className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                optProfile === 'visually_lossless'
                  ? 'bg-[#5268FF]/10 dark:bg-[#5268FF]/25 border-[#5268FF]/60 text-[#5268FF] dark:text-[#7888FF] shadow-xs'
                  : 'bg-white dark:bg-[#1B2244] border-[#E2E8F8] dark:border-[#2B3566] text-[#5A628A] dark:text-[#9BA6D1] dark:hover:bg-[#232C56]'
              }`}
            >
              <div className="text-xs font-bold font-mono text-[#2D325A] dark:text-[#F0F4FF]">Best Visual Quality</div>
              <div className="text-[10px] text-[#848DB3] dark:text-[#6E78A3] mt-0.5">Keeps original sharpness</div>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {compressedFiles.length > 0 ? (
          <>
            <button
              onClick={handleDownloadAll}
              className="w-full h-12 md:h-11 rounded-xl font-bold text-sm transition-all bg-[#5268FF] hover:bg-[#4256E8] text-white shadow-[0_6px_20px_rgba(82,104,255,0.28)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download All ({compressedFiles.length})</span>
            </button>

            <button
              onClick={() => {
                compressedFiles.forEach(f => URL.revokeObjectURL(f.url));
                setCompressedFiles([]);
                setFiles([]);
              }}
              className="w-full h-11 md:h-10 text-xs font-mono text-[#5A628A] hover:text-[#2D325A] dark:text-[#9BA6D1] dark:hover:text-[#F0F4FF] transition-colors rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-[#1B2244] dark:hover:bg-[#232C56] border border-[#E2E8F8] dark:border-[#2B3566] text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear &amp; Add More</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleCompress}
            disabled={files.length === 0 || isProcessing}
            className="w-full h-12 md:h-11 rounded-xl font-bold text-sm transition-all bg-[#5268FF] hover:bg-[#4256E8] text-white shadow-[0_6px_20px_rgba(82,104,255,0.3)] active:scale-[0.98] disabled:bg-[#E8EEFF] disabled:text-[#5268FF]/70 disabled:border disabled:border-[#C7D4FF] disabled:shadow-none dark:disabled:bg-[#1E264D] dark:disabled:text-[#7C8EE8] dark:disabled:border-[#2E3B75] disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
          >
            {isProcessing ? 'Compressing Images...' : `Compress All Images (${files.length})`}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <ToolShell
      title="Bulk Compression"
      accentColor="bg-[#5268FF]"
      badgeText="MULTI-FILE BATCH"
      canvas={canvasContent}
      inspector={inspectorContent}
    />
  );
}

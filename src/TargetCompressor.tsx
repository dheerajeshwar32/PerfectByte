import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { compressImageToTarget } from './compressionService';
import { compressPDF } from './pdfUtils';
import { addHistoryEntry } from './historyService';
import { toast } from 'sonner';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';

interface CompressionResult {
  fileName: string;
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  targetBytes: number;
  isPdf: boolean;
  isAlreadyUnderTarget?: boolean;
  isOverTarget?: boolean;
  notes?: string;
}

const PRESETS = [
  { label: '🏛️ Govt Portal', kb: 100 },
  { label: '🏛️ Govt Portal+', kb: 200 },
  { label: '📱 WhatsApp DP', kb: 50 },
  { label: '🎓 University', kb: 500 },
  { label: '📧 Email (5MB)', kb: 5000 },
  { label: '💼 LinkedIn', kb: 2000 },
];

function BeforeAfterSlider({ originalUrl, compressedUrl }: { originalUrl: string; compressedUrl: string }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm bg-checkerboard select-none">
      <img src={compressedUrl} alt="Compressed output" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={originalUrl} alt="Original input" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      </div>

      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)] pointer-events-none" style={{ left: `${position}%` }}>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white backdrop-blur rounded-full shadow-lg flex items-center justify-center text-indigo-800 text-xs font-bold"
          style={{ boxShadow: '-2px 0px 0px rgba(0,255,255,0.6), 2px 0px 0px rgba(255,0,255,0.6)' }}
        >
          ↔
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Before and after comparison slider"
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
      <span className="absolute top-3 left-3 bg-indigo-900/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none font-medium">Original</span>
      <span className="absolute top-3 right-3 bg-indigo-900/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none font-medium">Compressed</span>
    </div>
  );
}

export default function TargetCompressor() {
  useDocumentTitle('Target Compressor');
  
  const [targetKB, setTargetKB] = useState<number>(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.compressedUrl);
    }
    setIsProcessing(true);
    setResult(null);
    setProgressMsg('');

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    // Requirement: Treat N KB as N * 1000 bytes (decimal standard for submission portals)
    const rawTargetBytes = Math.max(1000, targetKB * 1000);
    const toastId = toast.loading(isPdf ? 'Calculating precision PDF compression...' : 'Executing two-stage target compression...');

    try {
      // 1. Already-under-target guard
      if (file.size <= rawTargetBytes) {
        const fileUrl = URL.createObjectURL(file);
        setResult({
          fileName: file.name,
          originalUrl: fileUrl,
          compressedUrl: fileUrl,
          originalSize: file.size,
          compressedSize: file.size,
          targetBytes: rawTargetBytes,
          isPdf,
          isAlreadyUnderTarget: true,
        });
        toast.success('File is already under your target size! Original preserved untouched.', { id: toastId });
        return;
      }

      let finalBlob: Blob | File | null = null;
      let isOverTarget = false;
      let notes = '';

      if (isPdf) {
        // PDF Precision binary search with 0.15 quality floor
        let minQ = 0.15;
        let maxQ = 0.95;
        let bestBlob: Blob | null = null;
        let smallestBlob: Blob | null = null;

        for (let i = 0; i < 7; i++) {
          const midQ = Number(((minQ + maxQ) / 2).toFixed(2));
          const msg = `PDF precision optimization (Pass ${i + 1}/7 · q=${midQ.toFixed(2)})...`;
          setProgressMsg(msg);
          toast.loading(msg, { id: toastId });

          const currentBlob = await compressPDF(file, midQ);

          if (!smallestBlob || currentBlob.size < smallestBlob.size) {
            smallestBlob = currentBlob;
          }

          if (currentBlob.size <= rawTargetBytes) {
            // Track the largest valid result (best quality <= target)
            if (!bestBlob || currentBlob.size > bestBlob.size) {
              bestBlob = currentBlob;
            }
            minQ = midQ; // Try higher quality
          } else {
            maxQ = midQ; // Lower quality
          }
        }

        if (bestBlob) {
          finalBlob = bestBlob;
        } else {
          finalBlob = smallestBlob || (await compressPDF(file, 0.15));
          if (finalBlob.size > rawTargetBytes) {
            isOverTarget = true;
            notes = `Could not reach ${targetKB} KB without severe corruption. Displaying smallest achievable size.`;
          }
        }
      } else {
        // Image Two-Stage Fallback via compressionService
        const outcome = await compressImageToTarget(file, rawTargetBytes, (msg) => {
          setProgressMsg(msg);
          toast.loading(msg, { id: toastId });
        });

        finalBlob = outcome.blob;
        isOverTarget = !outcome.isUnderTarget;
        if (isOverTarget) {
          notes = `Could not compress below ${targetKB} KB at maximum reduction. Smallest achievable size is shown.`;
        }
      }

      if (!finalBlob) throw new Error('Compression failed to produce output.');

      const outputFileName = file.name.replace(/\.[^/.]+$/, '') + (isPdf ? '_compressed.pdf' : '.webp');
      const originalUrl = URL.createObjectURL(file);
      const compressedUrl = URL.createObjectURL(finalBlob);

      setResult({
        fileName: outputFileName,
        originalUrl,
        compressedUrl,
        originalSize: file.size,
        compressedSize: finalBlob.size,
        targetBytes: rawTargetBytes,
        isPdf,
        isOverTarget,
        notes,
      });

      if (finalBlob.size < file.size) {
        addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: finalBlob.size });
      }

      if (isOverTarget) {
        toast.warning(notes || 'Smallest achievable size reached.', { id: toastId });
      } else {
        toast.success('Successfully compressed under target!', { id: toastId });
      }

    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'An error occurred during compression.', { id: toastId });
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            toast.success(`Pasted file: ${file.name}`);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  });

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>
      <Navbar />

      <main className="flex-1 bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-5xl w-[calc(100%-2rem)] mx-auto text-center relative z-10 mt-4 pb-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 to-slate-600 dark:from-white dark:to-slate-400 mb-8 md:mb-12 leading-tight px-4 pb-2">
          Target <br className="hidden sm:block" />
          <span 
            className="text-[#5668FF] drop-shadow-sm"
            style={{ textShadow: '-2px 0px 0px rgba(0,255,255,0.3), 2px 0px 0px rgba(255,0,255,0.3)' }}
          >
            Compress
          </span>
        </h1>
        
        {!result && (
          <div className="flex flex-col items-center justify-center py-8 mb-8 border-b border-slate-200 dark:border-indigo-800">
            <span className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Target File Size</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                value={targetKB}
                onChange={(e) => setTargetKB(Math.max(1, Number(e.target.value)))}
                onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                aria-label="Target file size in kilobytes"
                className="text-6xl md:text-8xl font-black font-mono tabular-nums text-center bg-transparent outline-none text-indigo-900 dark:text-white w-full max-w-[350px]"
                min="1"
              />
              <span className="text-3xl md:text-4xl font-black text-slate-300 dark:text-slate-700">KB</span>
            </div>

            <div className="text-xs font-mono text-slate-400 mt-2">
              Exact limit: {(targetKB * 1000).toLocaleString()} bytes ({(targetKB * 1000 / 1024).toFixed(1)} KiB)
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mt-6 mb-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setTargetKB(preset.kb)}
                  className="px-4 py-2 text-xs font-bold rounded-full bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-indigo-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-colors border border-transparent hover:border-blue-200 dark:hover:border-slate-600"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              type="range"
              min="10"
              max="10240"
              value={targetKB}
              onChange={(e) => setTargetKB(Number(e.target.value))}
              aria-label="Target file size slider in kilobytes"
              className="w-full max-w-md h-2 mt-4 bg-slate-200 dark:bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
            />
          </div>
        )}

        <div className="max-w-xl mx-auto space-y-8">
          {!result && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`relative w-full max-w-2xl mx-auto p-10 md:p-14 border-2 border-dashed rounded-[2rem] transition-all duration-500 cursor-pointer group/drop bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/40 dark:to-slate-900/40 backdrop-blur-sm ${
                  isDragging 
                    ? 'border-[#5668FF] bg-[#5668FF]/5 dark:bg-[#5668FF]/10 scale-[1.02] shadow-[0_0_40px_rgba(86,104,255,0.15)]' 
                    : 'border-slate-200/60 dark:border-slate-700/40 hover:border-[#5668FF]/50 hover:shadow-[0_0_40px_rgba(86,104,255,0.08)]'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  aria-label="Upload file to compress"
                  ref={fileInputRef}
                  className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-4 relative z-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#5668FF]/10 dark:bg-[#5668FF]/20 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-[#5668FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      {isProcessing ? 'Processing...' : 'Drop your file here'}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      or <span className="text-[#5668FF] font-medium hover:underline">browse files</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {isProcessing && progressMsg && (
                <div className="text-sm font-medium text-[#5668FF] dark:text-[#7888FF] animate-pulse">
                  {progressMsg}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-6 text-left bg-white dark:bg-indigo-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Reduction</h2>
                    {result.isAlreadyUnderTarget && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                        Already Under Target
                      </span>
                    )}
                    {result.isOverTarget && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                        Minimum Floor Reached
                      </span>
                    )}
                  </div>
                  <span 
                    className="text-5xl md:text-6xl font-black font-mono text-[#5668FF] dark:text-[#7888FF]"
                    style={{ textShadow: '-3px 0px 0px rgba(0,255,255,0.6), 3px 0px 0px rgba(255,0,255,0.6)' }}
                  >
                    {result.originalSize > 0 
                      ? `-${Math.max(0, ((result.originalSize - result.compressedSize) / result.originalSize * 100)).toFixed(0)}%`
                      : '0%'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = result.compressedUrl;
                    a.download = result.fileName;
                    a.click();
                  }}
                  className="px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)]"
                >
                  Download Output
                </button>
              </div>

              {result.isPdf && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-medium">
                  <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Pages were rasterized to high-compression JPEG. Embedded text is converted to high-fidelity images.</span>
                </div>
              )}

              {result.notes && (
                <div className="p-3 rounded-xl bg-blue-500/10 text-[#5668FF] dark:text-[#7888FF] text-xs font-medium border border-blue-500/20">
                  {result.notes}
                </div>
              )}

              {!result.isPdf && <BeforeAfterSlider originalUrl={result.originalUrl} compressedUrl={result.compressedUrl} />}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-mono tabular-nums bg-slate-50 dark:bg-indigo-900/60 p-4 rounded-xl border border-slate-200/50 dark:border-indigo-800/50">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs font-sans font-bold uppercase">Original File</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold">{formatBytes(result.originalSize)}</span>
                  <span className="text-[11px] text-slate-400">{result.originalSize.toLocaleString()} bytes</span>
                </div>
                <div className="flex flex-col sm:text-right">
                  <span className="text-slate-400 text-xs font-sans font-bold uppercase">Achieved Output</span>
                  <span className="text-[#5668FF] dark:text-[#7888FF] font-bold">{formatBytes(result.compressedSize)}</span>
                  <span className="text-[11px] text-slate-400">
                    {result.compressedSize.toLocaleString()} bytes ({(result.compressedSize / 1024).toFixed(1)} KiB)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span>Target Limit:</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {(targetKB * 1000).toLocaleString()} bytes ({(targetKB * 1000 / 1024).toFixed(1)} KiB)
                </span>
              </div>

              {/* Byte Meter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Quota Used (Byte Meter):</span>
                  <span className={`font-bold ${result.compressedSize <= result.targetBytes ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    {Math.round((result.compressedSize / result.targetBytes) * 100)}% ({result.compressedSize.toLocaleString()} / {result.targetBytes.toLocaleString()} bytes)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-indigo-900 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.compressedSize <= result.targetBytes * 0.99
                        ? 'bg-emerald-500'
                        : result.compressedSize <= result.targetBytes
                        ? 'bg-[#5668FF]'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((result.compressedSize / result.targetBytes) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-center text-slate-400 font-mono pt-1">
                ✓ EXIF &amp; location metadata stripped for maximum privacy
              </div>
              
              <button
                onClick={() => {
                  if (result) {
                    URL.revokeObjectURL(result.originalUrl);
                    URL.revokeObjectURL(result.compressedUrl);
                  }
                  setResult(null);
                }}
                className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Compress Another File
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

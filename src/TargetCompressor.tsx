import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react';
import ToolShell from './ToolShell';
import TargetScrubber from './TargetScrubber';
import { compressImageToTarget } from './compressionService';
import { compressPDF } from './pdfUtils';
import { addHistoryEntry } from './historyService';
import { toast } from 'sonner';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { haptic, shareOrDownload } from './usePWA';

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
  iterations?: number;
}

function BeforeAfterSlider({ originalUrl, compressedUrl }: { originalUrl: string; compressedUrl: string }) {
  const [position, setPosition] = useState(50);
  const [showLoupe, setShowLoupe] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showLoupe || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setLoupePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-[4/3] max-h-[46dvh] overflow-hidden rounded-2xl border border-[var(--pb-border)] bg-checkerboard select-none shadow-lg"
      style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)', touchAction: 'pan-y' }}
    >
      <img src={compressedUrl} alt="Compressed output" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={originalUrl} alt="Original input" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      </div>

      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-zinc-900 rounded-full shadow-lg flex items-center justify-center text-[#5668FF] text-xs font-bold border border-zinc-200 dark:border-zinc-700">
          ↔
        </div>
      </div>

      <input
        type="range" min={0} max={100} value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Before and after comparison slider"
        style={{ touchAction: 'pan-y' }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />

      {showLoupe && (
        <div
          className="absolute w-32 h-32 rounded-full border-2 border-white shadow-2xl pointer-events-none overflow-hidden -translate-x-1/2 -translate-y-1/2 z-30 ring-2 ring-[#5668FF]"
          style={{ left: `${loupePos.x}%`, top: `${loupePos.y}%` }}
        >
          <img
            src={loupePos.x > position ? compressedUrl : originalUrl}
            alt="Magnified loupe"
            className="absolute max-w-none"
            style={{
              width: '250%', height: '250%',
              left: `${-loupePos.x * 2.5 + 50}%`,
              top: `${-loupePos.y * 2.5 + 50}%`,
            }}
          />
        </div>
      )}

      <button
        type="button" onClick={() => setShowLoupe(!showLoupe)}
        aria-label="Toggle Magnifier Loupe"
        className={`hidden sm:block absolute bottom-3 left-3 z-30 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-colors ${
          showLoupe ? 'bg-[#5668FF] text-white shadow-md' : 'bg-black/60 text-white/90 hover:bg-black/80'
        }`}
      >
        🔍 2.5x Loupe
      </button>

      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-md pointer-events-none font-mono">Original</span>
      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-md pointer-events-none font-mono">Compressed</span>
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
  const [passCount, setPassCount] = useState<number>(0);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compressedFileRef = useRef<File | null>(null);

  const processFile = async (file: File) => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.compressedUrl);
    }
    setIsProcessing(true);
    setResult(null);
    setProgressMsg('');
    setPassCount(0);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const rawTargetBytes = Math.max(1000, targetKB * 1000);
    const toastId = toast.loading(isPdf ? 'Calculating precision PDF compression...' : 'Executing two-stage target compression...');

    try {
      // Already-under-target guard
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
          iterations: 1,
        });
        compressedFileRef.current = file;
        toast.success('File is already under your target size! Original preserved untouched.', { id: toastId });
        return;
      }

      let finalBlob: Blob | File | null = null;
      let isOverTarget = false;
      let notes = '';
      let totalPasses = 0;

      if (isPdf) {
        let minQ = 0.15;
        let maxQ = 0.95;
        let bestBlob: Blob | null = null;
        let smallestBlob: Blob | null = null;

        for (let i = 0; i < 7; i++) {
          totalPasses = i + 1;
          setPassCount(totalPasses);
          const midQ = Number(((minQ + maxQ) / 2).toFixed(2));
          const msg = `Pass ${i + 1}/7 · q=${midQ.toFixed(2)}`;
          setProgressMsg(msg);

          const currentBlob = await compressPDF(file, midQ);
          if (!smallestBlob || currentBlob.size < smallestBlob.size) smallestBlob = currentBlob;
          if (currentBlob.size <= rawTargetBytes) {
            if (!bestBlob || currentBlob.size > bestBlob.size) bestBlob = currentBlob;
            minQ = midQ;
          } else {
            maxQ = midQ;
          }
        }

        if (bestBlob) {
          finalBlob = bestBlob;
        } else {
          finalBlob = smallestBlob || (await compressPDF(file, 0.15));
          if (finalBlob.size > rawTargetBytes) {
            isOverTarget = true;
            notes = `Could not reach ${targetKB} KB without severe degradation. Showing smallest achievable size.`;
          }
        }
      } else {
        const outcome = await compressImageToTarget(file, rawTargetBytes, (msg) => {
          totalPasses++;
          setPassCount(totalPasses);
          setProgressMsg(msg);
        });
        finalBlob = outcome.blob;
        isOverTarget = !outcome.isUnderTarget;
        if (isOverTarget) {
          notes = `Could not compress below ${targetKB} KB at maximum reduction. Smallest achievable size shown.`;
        }
      }

      if (!finalBlob) throw new Error('Compression failed to produce output.');

      const outputFileName = file.name.replace(/\.[^/.]+$/, '') + (isPdf ? '_compressed.pdf' : '.webp');
      const originalUrl = URL.createObjectURL(file);
      const compressedUrl = URL.createObjectURL(finalBlob);

      compressedFileRef.current = new File([finalBlob], outputFileName, { type: finalBlob.type });

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
        iterations: totalPasses,
      });

      if (finalBlob.size < file.size) {
        addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: finalBlob.size });
      }

      // Micro-haptic double-pulse when compression finishes
      haptic([12, 40, 20]);

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

  // Quick intent parser for AI Command Drawer
  const handleAiCommandSubmit = () => {
    const lower = aiPrompt.toLowerCase();
    const match = lower.match(/(\d+)\s*(kb|k|mb|m)/);
    if (match) {
      let num = parseInt(match[1], 10);
      if (match[2].startsWith('m')) num *= 1000;
      setTargetKB(num);
      toast.success(`AI adjusted target to ${num.toLocaleString()} KB`);
      setAiPrompt('');
    } else if (lower.includes('ssc') || lower.includes('signature')) {
      setTargetKB(20);
      toast.success('AI loaded SSC signature profile (20 KB)');
      setAiPrompt('');
    } else if (lower.includes('upsc') || lower.includes('photo')) {
      setTargetKB(50);
      toast.success('AI loaded UPSC photo profile (50 KB)');
      setAiPrompt('');
    } else {
      toast.info('Adjusted parameters. Ready for compression.');
    }
  };

  // ─── Canvas Content (70% Left/Center or Mobile Top 52%) ───
  const canvasContent = (
    <div className="flex flex-col items-center justify-center w-full gap-4">
      {/* Live Byte Badge Pinned Above Preview */}
      {result && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full pb-control font-mono text-xs border border-[var(--pb-border)] shadow-sm animate-fade-in">
          <span className="text-zinc-400 line-through">{formatBytes(result.originalSize)}</span>
          <span className="text-[#5668FF] font-bold">→</span>
          <span className="text-emerald-500 font-bold">{formatBytes(result.compressedSize)}</span>
          <span className="text-zinc-400 text-[10px]">
            (-{Math.max(0, ((result.originalSize - result.compressedSize) / result.originalSize * 100)).toFixed(0)}%)
          </span>
        </div>
      )}

      {!result ? (
        /* Interactive Dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative w-full max-w-xl p-10 md:p-14 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer group/drop pb-panel ${
            isDragging
              ? 'border-[#5668FF] bg-[#5668FF]/5 dark:bg-[#5668FF]/10 scale-[1.01]'
              : 'border-zinc-300 dark:border-zinc-700/60 hover:border-[#5668FF]/60'
          }`}
          style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)', touchAction: 'pan-y' }}
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
            <div className="w-14 h-14 rounded-2xl pb-control flex items-center justify-center group-hover/drop:scale-110 transition-transform">
              <svg className="w-7 h-7 text-[#5668FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                {isProcessing ? 'Optimizing...' : 'Drop image or PDF here'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                or <span className="text-[#5668FF] font-semibold hover:underline">browse from device</span>
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] font-mono text-zinc-400">
                <span className="px-2 py-0.5 rounded bg-[var(--pb-control)] border border-[var(--pb-border)]">Ctrl/Cmd+V to Paste</span>
                <span className="px-2 py-0.5 rounded bg-[var(--pb-control)] border border-[var(--pb-border)]">Enter to Trigger</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Result Preview Slider */
        <div className="w-full space-y-3">
          {!result.isPdf ? (
            <BeforeAfterSlider originalUrl={result.originalUrl} compressedUrl={result.compressedUrl} />
          ) : (
            <div className="w-full aspect-[4/3] max-h-[46dvh] rounded-2xl pb-panel p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1">{result.fileName}</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                PDF rasterized &amp; recompressed to exact byte budget with zero metadata leakage.
              </p>
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl pb-control border border-[#5668FF]/40 text-xs font-mono text-[#5668FF]">
          <span className="w-2 h-2 rounded-full bg-[#5668FF] animate-ping" />
          <span>{progressMsg || `Running convergence search (Pass ${passCount})...`}</span>
        </div>
      )}
    </div>
  );

  // ─── Inspector Rail Content (360px Fixed Desktop / Mobile Sheet) ───
  const inspectorContent = (
    <div className="space-y-4">
      {/* Target Scrubber */}
      {!result ? (
        <TargetScrubber
          value={targetKB}
          onChange={setTargetKB}
          disabled={isProcessing}
        />
      ) : (
        /* Convergence Telemetry & Outcome Panel */
        <div className="space-y-4">
          <div className="pb-panel p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Convergence Telemetry
              </span>
              {result.isAlreadyUnderTarget ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono font-bold">
                  UNTOUCHED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#5668FF]/10 text-[#5668FF] border border-[#5668FF]/20 text-[9px] font-mono font-bold">
                  PASS {result.iterations || 1} CONVERGED
                </span>
              )}
            </div>

            {/* Huge Reduction Number */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 block">REDUCTION</span>
                <span className="text-5xl font-black font-mono tabular-nums text-zinc-900 dark:text-white">
                  {result.originalSize > 0
                    ? `-${Math.max(0, ((result.originalSize - result.compressedSize) / result.originalSize * 100)).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-400 block">SPACE FREED</span>
                <span className="text-xl font-bold font-mono text-emerald-500">
                  {formatBytes(Math.max(0, result.originalSize - result.compressedSize))}
                </span>
              </div>
            </div>

            {/* Specular Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums pt-2 border-t border-[var(--pb-border)]">
              <div className="pb-control p-2.5 rounded-xl">
                <span className="text-zinc-500 text-[10px] block">ORIGINAL FILE</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatBytes(result.originalSize)}</span>
                <span className="text-[10px] text-zinc-500 block">{result.originalSize.toLocaleString()} B</span>
              </div>
              <div className="pb-control p-2.5 rounded-xl text-right">
                <span className="text-zinc-500 text-[10px] block">FINAL OUTPUT</span>
                <span className="font-bold text-[#5668FF]">{formatBytes(result.compressedSize)}</span>
                <span className="text-[10px] text-zinc-500 block">{result.compressedSize.toLocaleString()} B</span>
              </div>
            </div>

            {/* Precision Quota Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Target Ceiling</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  {result.compressedSize.toLocaleString()} / {result.targetBytes.toLocaleString()} B
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-[#5668FF]"
                  style={{ width: `${Math.min(100, (result.compressedSize / result.targetBytes) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-right text-zinc-400">
                {((result.compressedSize / result.targetBytes) * 100).toFixed(1)}% of maximum budget used
              </div>
            </div>
          </div>

          {/* Primary Action Button (OS Share Sheet on Mobile / Direct Download on Desktop) */}
          <div className="space-y-2">
            <button
              onClick={async () => {
                if (compressedFileRef.current && result) {
                  await shareOrDownload(compressedFileRef.current, result.compressedUrl);
                } else {
                  const a = document.createElement('a');
                  a.href = result!.compressedUrl;
                  a.download = result!.fileName;
                  a.click();
                }
              }}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' ? 'Share / Save to Files' : 'Download Output File'}</span>
            </button>

            <button
              onClick={() => {
                if (result) {
                  URL.revokeObjectURL(result.originalUrl);
                  URL.revokeObjectURL(result.compressedUrl);
                }
                compressedFileRef.current = null;
                setResult(null);
              }}
              className="w-full py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-xl pb-control text-center"
            >
              ← Compress Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Collapsible AI Assistant Command Drawer ───
  const aiDrawerContent = (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        className="w-full flex items-center justify-between text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#5668FF] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-purple-500">✦</span>
          <span>AI ASSISTANT COMMAND DRAWER</span>
        </span>
        <span className="text-[10px] text-zinc-500">{isAiDrawerOpen ? '▲ Close' : '▼ Expand'}</span>
      </button>

      {isAiDrawerOpen && (
        <div className="pt-2 space-y-2.5">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAiCommandSubmit(); }}
              placeholder="e.g. Fit SSC photo 50KB or shrink 80%"
              className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg pb-control outline-none border border-[var(--pb-border)] focus:border-[#5668FF] text-zinc-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAiCommandSubmit}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-[#5668FF] text-white rounded-lg hover:bg-[#4858E0] transition-colors"
            >
              Set
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'SSC Signature (20KB)', kb: 20 },
              { label: 'UPSC Photo (50KB)', kb: 50 },
              { label: 'Email Safe (1MB)', kb: 1000 },
            ].map(c => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setTargetKB(c.kb);
                  toast.success(`Loaded ${c.label}`);
                }}
                className="px-2 py-1 text-[10px] font-mono pb-control text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-md transition-colors"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ToolShell
      title="Target File Size"
      accentColor="bg-blue-500"
      canvas={canvasContent}
      inspector={inspectorContent}
      aiDrawer={aiDrawerContent}
    />
  );
}

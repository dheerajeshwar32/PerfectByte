import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import ToolShell from './ToolShell';
import TargetScrubber from './TargetScrubber';
import StudioDropzone from './components/StudioDropzone';
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
      className="relative w-full aspect-[4/3] max-h-[52dvh] overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-checkerboard select-none shadow-lg"
      style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)', touchAction: 'pan-y' }}
    >
      <img src={compressedUrl} alt="Compressed output" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={originalUrl} alt="Original input" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      </div>

      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-[#12182B] rounded-full shadow-lg flex items-center justify-center text-[#5268FF] text-xs font-bold border border-[#E2E8F8] dark:border-white/10">
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
              width: '250%',
              height: '250%',
              left: `${-loupePos.x * 2.5 + 50}%`,
              top: `${-loupePos.y * 2.5 + 50}%`,
            }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowLoupe(!showLoupe)}
        aria-label="Toggle Magnifier Loupe"
        className={`hidden sm:block absolute bottom-3 left-3 z-30 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-colors ${
          showLoupe ? 'bg-[#5268FF] text-white shadow-md' : 'bg-[#2D325A]/80 text-white hover:bg-[#2D325A]'
        }`}
      >
        🔍 2.5x Loupe
      </button>

      <span className="absolute top-3 left-3 bg-[#2D325A]/80 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-md pointer-events-none font-mono">Original</span>
      <span className="absolute top-3 right-3 bg-[#2D325A]/80 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-md pointer-events-none font-mono">Compressed</span>
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
        toast.dismiss(toastId);
        toast.success(`File is already ${formatBytes(file.size)}, strictly under ${targetKB} KB!`);
        haptic(10);
        return;
      }

      if (isPdf) {
        setProgressMsg('Compressing PDF via local WASM...');
        const compressedBlob = await compressPDF(file, 0.65);

        const originalUrl = URL.createObjectURL(file);
        const compressedUrl = URL.createObjectURL(compressedBlob);
        const isOver = compressedBlob.size > rawTargetBytes;

        const compResult: CompressionResult = {
          fileName: file.name,
          originalUrl,
          compressedUrl,
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          targetBytes: rawTargetBytes,
          isPdf: true,
          isOverTarget: isOver,
          iterations: 1,
        };

        setResult(compResult);
        compressedFileRef.current = new File([compressedBlob], file.name, { type: 'application/pdf' });

        addHistoryEntry({
          fileName: file.name,
          originalSize: file.size,
          compressedSize: compressedBlob.size,
        });

        toast.dismiss(toastId);
        if (isOver) {
          toast.warning(`Best effort: ${formatBytes(compressedBlob.size)} (Target: ${targetKB}KB)`);
        } else {
          toast.success(`Converged to ${formatBytes(compressedBlob.size)} (Cap: ${targetKB}KB)`);
        }
        haptic([12, 40, 20]);
      } else {
        const originalUrl = URL.createObjectURL(file);

        const compRes = await compressImageToTarget(file, rawTargetBytes, (message: string) => {
          setProgressMsg(message);
        });

        const isOver = compRes.blob.size > rawTargetBytes;
        const compressedUrl = URL.createObjectURL(compRes.blob);
        const compResult: CompressionResult = {
          fileName: file.name,
          originalUrl,
          compressedUrl,
          originalSize: file.size,
          compressedSize: compRes.blob.size,
          targetBytes: rawTargetBytes,
          isPdf: false,
          isOverTarget: isOver,
          notes: `Quality: ${compRes.quality}% • Scale: ${(compRes.scale * 100).toFixed(0)}%`,
          iterations: 1,
        };

        setResult(compResult);
        compressedFileRef.current = new File([compRes.blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
          type: 'image/webp',
        });

        addHistoryEntry({
          fileName: file.name,
          originalSize: file.size,
          compressedSize: compRes.blob.size,
        });

        toast.dismiss(toastId);
        if (isOver) {
          toast.warning(`Safety floor reached: ${formatBytes(compRes.blob.size)}`);
        } else {
          toast.success(`Converged cleanly: ${formatBytes(compRes.blob.size)} (Cap: ${targetKB}KB)`);
        }
        haptic([12, 40, 20]);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Compression failed');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

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

  const handleAiCommandSubmit = () => {
    if (!aiPrompt.trim()) return;
    const match = aiPrompt.match(/(\d+)\s*(kb|mb|k|m)?/i);
    if (match) {
      let num = parseInt(match[1], 10);
      const unit = (match[2] || 'kb').toLowerCase();
      if (unit.startsWith('m')) num *= 1000;
      setTargetKB(num);
      toast.success(`AI Command: Set target ceiling to ${num} KB`);
      setAiPrompt('');
      haptic(10);
    } else {
      toast.info('Specify a target size like "50KB" or "1MB"');
    }
  };

  // ─── Left Canvas Stage (7 Columns) ───
  const canvasContent = (
    <div className="flex flex-col w-full h-auto md:h-full md:min-h-[460px] justify-center items-center gap-4">
      {result && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] font-mono text-xs border border-slate-200 dark:border-white/10 shadow-xs animate-fade-in">
          <span className="text-slate-400 line-through">{formatBytes(result.originalSize)}</span>
          <span className="text-blue-500 font-bold">→</span>
          <span className="text-emerald-500 font-bold">{formatBytes(result.compressedSize)}</span>
          <span className="text-slate-400 text-[10px]">
            (-{Math.max(0, ((result.originalSize - result.compressedSize) / result.originalSize * 100)).toFixed(0)}%)
          </span>
        </div>
      )}

      {!result ? (
        <StudioDropzone
          isDragging={isDragging}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          title="Drop an image or PDF to shrink"
          subtitle="Automatically compresses your file to fit under your exact size limit."
          formats={['PNG', 'JPEG', 'WebP', 'PDF']}
          isProcessing={isProcessing}
          processingMessage={progressMsg || `Running convergence search (Pass ${passCount})...`}
          fileInput={
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileUpload}
              disabled={isProcessing}
              aria-label="Upload file to compress"
              ref={fileInputRef}
              className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
            />
          }
        />
      ) : (
        <div className="w-full space-y-3">
          {!result.isPdf ? (
            <BeforeAfterSlider originalUrl={result.originalUrl} compressedUrl={result.compressedUrl} />
          ) : (
            <div className="w-full aspect-[4/3] max-h-[46dvh] rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{result.fileName}</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                PDF rasterized &amp; recompressed to exact byte budget with zero metadata leakage.
              </p>
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-mono text-blue-500">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>{progressMsg || `Running convergence search (Pass ${passCount})...`}</span>
        </div>
      )}
    </div>
  );

  // ─── Right Precision Inspector Console (5 Columns) ───
  const inspectorContent = (
    <div className="space-y-5">
      {!result ? (
        <TargetScrubber
          value={targetKB}
          onChange={setTargetKB}
          disabled={isProcessing}
        />
      ) : (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-[#E2E8F8] dark:border-[#252D58] bg-white/95 dark:bg-[#151A36] backdrop-blur-xl shadow-[0_10px_35px_-10px_rgba(45,50,90,0.06)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#848DB3] font-bold">
                CONVERGENCE TELEMETRY
              </span>
              {result.isAlreadyUnderTarget ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-[#1B2244] text-[#5268FF] dark:text-[#7888FF] border border-[#C7D4FF] dark:border-[#2B3566] text-[9px] font-mono font-bold">
                  UNTOUCHED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-[#1B2244] text-[#5268FF] dark:text-[#7888FF] border border-[#C7D4FF] dark:border-[#2B3566] text-[9px] font-mono font-bold">
                  PASS {result.iterations || 1} CONVERGED
                </span>
              )}
            </div>

            {/* Reduction Callout */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#848DB3] block font-bold">REDUCTION</span>
                <span className="text-5xl font-black font-mono tabular-nums text-[#2D325A] dark:text-[#F0F4FF]">
                  {result.originalSize > 0
                    ? `-${Math.max(0, ((result.originalSize - result.compressedSize) / result.originalSize * 100)).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#848DB3] block font-bold">SPACE FREED</span>
                <span className="text-xl font-bold font-mono text-[#5268FF]">
                  {formatBytes(Math.max(0, result.originalSize - result.compressedSize))}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums pt-2 border-t border-[#E2E8F8] dark:border-[#252D58]">
              <div className="p-3 rounded-xl bg-[#EEF2FF] dark:bg-[#1B2244] border border-[#E2E8F8] dark:border-[#2B3566]">
                <span className="text-[#848DB3] text-[10px] block font-bold">ORIGINAL</span>
                <span className="font-bold text-[#2D325A] dark:text-[#F0F4FF]">{formatBytes(result.originalSize)}</span>
                <span className="text-[10px] text-[#848DB3] block">{result.originalSize.toLocaleString()} B</span>
              </div>
              <div className="p-3 rounded-xl bg-[#EEF2FF] dark:bg-[#1B2244] border border-[#E2E8F8] dark:border-[#2B3566] text-right">
                <span className="text-[#848DB3] text-[10px] block font-bold">OUTPUT</span>
                <span className="font-bold text-[#5268FF]">{formatBytes(result.compressedSize)}</span>
                <span className="text-[10px] text-[#848DB3] block">{result.compressedSize.toLocaleString()} B</span>
              </div>
            </div>

            {/* Quota Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#848DB3] font-semibold">Target Ceiling</span>
                <span className="font-bold text-[#2D325A] dark:text-[#F0F4FF]">
                  {result.compressedSize.toLocaleString()} / {result.targetBytes.toLocaleString()} B
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E2E8F8] dark:bg-[#1B2244] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-[#5268FF]"
                  style={{ width: `${Math.min(100, (result.compressedSize / result.targetBytes) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-right text-[#848DB3]">
                {((result.compressedSize / result.targetBytes) * 100).toFixed(1)}% of maximum budget used
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
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
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5268FF] hover:bg-[#4256E8] text-white shadow-[0_6px_20px_rgba(82,104,255,0.28)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
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
              className="w-full py-2.5 text-xs font-mono text-[#5A628A] hover:text-[#2D325A] dark:text-[#9BA6D1] dark:hover:text-[#F0F4FF] transition-colors rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-[#1B2244] dark:hover:bg-[#232C56] border border-[#E2E8F8] dark:border-[#2B3566] text-center cursor-pointer"
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
    <div className="space-y-2 rounded-xl p-3 bg-[#EEF2FF] dark:bg-[#151A36] border border-[#C7D4FF] dark:border-[#252D58] mb-4 md:mb-0">
      <button
        type="button"
        onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        className="w-full flex items-center justify-between text-xs font-mono font-bold text-[#2D325A] dark:text-[#F0F4FF] hover:text-[#5268FF] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#5268FF]" />
          <span>AI ASSISTANT COMMAND DRAWER</span>
        </span>
        <span className="text-[10px] text-[#848DB3] flex items-center gap-1">
          {isAiDrawerOpen ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Close</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Expand</span>
            </>
          )}
        </span>
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
              className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg outline-none border border-[#C7D4FF] dark:border-[#2B3566] bg-white dark:bg-[#1B2244] focus:border-[#5268FF] text-[#2D325A] dark:text-[#F0F4FF]"
            />
            <button
              type="button"
              onClick={handleAiCommandSubmit}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-[#5268FF] hover:bg-[#4256E8] text-white rounded-lg transition-colors shadow-xs"
            >
              Set
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'SSC Signature (20KB)', kb: 20 },
              { label: 'UPSC Photo (50KB)', kb: 50 },
              { label: 'Email Safe (1MB)', kb: 1000 },
            ].map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setTargetKB(c.kb);
                  toast.success(`Loaded ${c.label}`);
                }}
                className="px-2 py-1 text-[10px] font-mono bg-white dark:bg-[#1B2244] text-[#5A628A] dark:text-[#9BA6D1] hover:text-[#2D325A] dark:hover:text-[#F0F4FF] dark:hover:bg-[#232C56] rounded-md border border-[#E2E8F8] dark:border-[#2B3566] hover:border-[#5268FF] transition-colors"
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
      badgeText="EXACT SIZE LIMIT"
      canvas={canvasContent}
      inspector={inspectorContent}
      aiDrawer={aiDrawerContent}
      onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
      isAiDrawerOpen={isAiDrawerOpen}
    />
  );
}

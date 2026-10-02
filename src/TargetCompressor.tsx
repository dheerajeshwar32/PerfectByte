import { useState, type ChangeEvent, type DragEvent } from 'react';
import Navbar from './Navbar';
import { compressToTarget } from './compressionService';
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
  isPdf: boolean;
}

const PRESETS = [
  { label: '🏛️ Govt Portal', kb: 100 },
  { label: '🏛️ Govt Portal+', kb: 200 },
  { label: '📱 WhatsApp DP', kb: 50 },
  { label: '🎓 University', kb: 500 },
  { label: '📧 Email (5MB)', kb: 5120 },
  { label: '💼 LinkedIn', kb: 2048 },
];

function BeforeAfterSlider({ originalUrl, compressedUrl }: { originalUrl: string; compressedUrl: string }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-indigo-900 select-none">
      <img src={compressedUrl} alt="Compressed" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={originalUrl} alt="Original" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
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

  const processFile = async (file: File) => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.compressedUrl);
    }
    setIsProcessing(true);
    setResult(null);
    setProgressMsg('');

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const toastId = toast.loading(isPdf ? 'Calculating precise PDF compression...' : 'Optimizing quality and resolution...');

    try {
      const targetBytes = targetKB * 1024;
      let finalBlob: Blob | File | null = null;
      let wasBailedOut = false;

      if (isPdf) {
        let minQ = 0.05, maxQ = 1.0, bestBlob: Blob | null = null, bestDiff = Infinity;
        for (let i = 0; i < 8; i++) {
          const midQ = (minQ + maxQ) / 2;
          const msg = `Precision targeting PDF (Pass ${i + 1}/8)...`;
          setProgressMsg(msg);
          toast.loading(msg, { id: toastId });
          const currentBlob = await compressPDF(file, midQ);
          if (currentBlob.size <= targetBytes) {
            const diff = targetBytes - currentBlob.size;
            if (diff < bestDiff) { bestDiff = diff; bestBlob = currentBlob; }
            minQ = midQ; 
          } else {
            maxQ = midQ; 
          }
        }
        finalBlob = bestBlob || await compressPDF(file, 0.05);
        if (finalBlob.size > file.size) { finalBlob = file; wasBailedOut = true; }
      } else {
        const bitmap = await createImageBitmap(file);
        let width = bitmap.width, height = bitmap.height, attempts = 0;
        while (attempts < 8) {
          setProgressMsg(`Optimizing quality (attempt ${attempts + 1}/8)...`);
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context failed');
          ctx.drawImage(bitmap, 0, 0, width, height);
          const currentBlob = new Blob([await compressToTarget(ctx.getImageData(0, 0, width, height), targetBytes)], { type: 'image/webp' });
          if (currentBlob.size <= targetBytes || attempts === 7) { finalBlob = currentBlob; break; }
          width = Math.floor(width * 0.75); height = Math.floor(height * 0.75); attempts++;
        }
        bitmap.close();
      }

      if (!finalBlob) throw new Error('Compression failed');

      setResult({
        fileName: file.name.replace(/\.[^/.]+$/, '') + (isPdf ? '_compressed.pdf' : '.webp'),
        originalUrl: URL.createObjectURL(file),
        compressedUrl: URL.createObjectURL(finalBlob),
        originalSize: file.size,
        compressedSize: finalBlob.size,
        isPdf
      });

      if (finalBlob.size < file.size) {
        addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: finalBlob.size });
      }
      toast.success(isPdf && wasBailedOut ? 'Document already optimally compressed!' : 'Done!', { id: toastId });

    } catch {
      toast.error('An error occurred during compression.', { id: toastId });
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
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>
      <Navbar />

      <div className="bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-5xl w-[calc(100%-2rem)] mx-auto text-center relative z-10 mt-4">
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
                onChange={(e) => setTargetKB(Number(e.target.value))}
                className="text-6xl md:text-8xl font-black font-mono tabular-nums text-center bg-transparent outline-none text-indigo-900 dark:text-white w-full max-w-[350px]"
                min="1"
              />
              <span className="text-3xl md:text-4xl font-black text-slate-300 dark:text-slate-700">KB</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mt-6 mb-4">
              {PRESETS.map(preset => (
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
              min="10" max="10240"
              value={targetKB}
              onChange={(e) => setTargetKB(Number(e.target.value))}
              className="w-full max-w-md h-2 mt-4 bg-slate-200 dark:bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
            />
          </div>
        )}

        <div className="max-w-xl mx-auto space-y-8">
          {!result && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
                className={`relative w-full max-w-2xl mx-auto p-10 md:p-14 border-2 border-dashed rounded-[2rem] transition-all duration-500 cursor-pointer group/drop bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/40 dark:to-slate-900/40 backdrop-blur-sm ${
                  isDragging 
                    ? 'border-[#5668FF] bg-[#5668FF]/5 dark:bg-[#5668FF]/10 scale-[1.02] shadow-[0_0_40px_rgba(86,104,255,0.15)]' 
                    : 'border-slate-200/60 dark:border-slate-700/40 hover:border-[#5668FF]/50 hover:shadow-[0_0_40px_rgba(86,104,255,0.08)]'
                }`}
              >
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} disabled={isProcessing} className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center gap-4 relative z-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#5668FF]/10 dark:bg-[#5668FF]/20 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-[#5668FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">{isProcessing ? 'Processing...' : 'Drop your file here'}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">or <span className="text-[#5668FF] font-medium hover:underline">browse files</span></p>
                  </div>
                </div>
              </div>
              
              {isProcessing && progressMsg && (
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                  {progressMsg}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-6 text-left bg-white dark:bg-indigo-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
              <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Reduction</h3>
                  <span 
                    className="text-5xl md:text-6xl font-black font-mono text-[#5668FF] dark:text-[#7888FF]"
                    style={{ textShadow: '-3px 0px 0px rgba(0,255,255,0.6), 3px 0px 0px rgba(255,0,255,0.6)' }}
                  >
                    -{((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(0)}%
                  </span>
                </div>
                <button
                  onClick={() => {
                    const a = document.createElement('a'); a.href = result.compressedUrl; a.download = result.fileName; a.click();
                  }}
                  className="px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  Download Output
                </button>
              </div>

              {!result.isPdf && <BeforeAfterSlider originalUrl={result.originalUrl} compressedUrl={result.compressedUrl} />}
              
              <div className="flex justify-between items-center text-sm font-mono tabular-nums bg-slate-50 dark:bg-indigo-900 p-4 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs font-sans font-bold uppercase">Original</span>
                  <span className="text-slate-600 dark:text-slate-300 font-bold">{formatBytes(result.originalSize)}</span>
                </div>
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                <div className="flex flex-col text-right">
                  <span className="text-slate-400 text-xs font-sans font-bold uppercase">Target</span>
                  <span className="text-[#5668FF] font-bold">{formatBytes(result.compressedSize)}</span>
                </div>
              </div>
              
              <button onClick={() => setResult(null)} className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">
                Compress Another File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
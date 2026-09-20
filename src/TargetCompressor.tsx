import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { compressToTarget } from './compressionService';
import { compressPDF } from './pdfUtils';
import { addHistoryEntry } from './historyService';
import { toast } from 'sonner';
import { useDocumentTitle } from './useDocumentTitle';

interface CompressionResult {
  fileName: string;
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  isPdf: boolean;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function BeforeAfterSlider({ originalUrl, compressedUrl }: { originalUrl: string; compressedUrl: string }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-900 select-none">
      <img src={compressedUrl} alt="Compressed" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={originalUrl} alt="Original" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      </div>

      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)] pointer-events-none" style={{ left: `${position}%` }}>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white backdrop-blur rounded-full shadow-lg flex items-center justify-center text-slate-800 text-xs font-bold"
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
      <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none font-medium">Original</span>
      <span className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none font-medium">Compressed</span>
    </div>
  );
}

export default function TargetCompressor() {
  useDocumentTitle('Target Compressor');
  
  const [targetKB, setTargetKB] = useState<number>(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const processFile = async (file: File) => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.compressedUrl);
    }
    setIsProcessing(true);
    setResult(null);

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
          toast.loading(`Precision targeting PDF (Pass ${i + 1}/8)...`, { id: toastId });
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

    } catch (error) {
      toast.error('An error occurred during compression.', { id: toastId });
    } finally {
      setIsProcessing(false);
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden transition-colors duration-150">
      <Link 
        to="/" 
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 hover:scale-105 hover:shadow-md transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
        </svg>
        Back to Tools
      </Link>

      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800 max-w-4xl w-full text-center relative z-10">
        
        {!result && (
          <div className="flex flex-col items-center justify-center py-8 mb-8 border-b border-slate-200 dark:border-slate-800">
            <span className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Target File Size</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                value={targetKB}
                onChange={(e) => setTargetKB(Number(e.target.value))}
                className="text-6xl md:text-8xl font-black font-mono tabular-nums text-center bg-transparent outline-none text-slate-900 dark:text-white w-full max-w-[350px]"
                min="1"
              />
              <span className="text-3xl md:text-4xl font-black text-slate-300 dark:text-slate-700">KB</span>
            </div>
            <input
              type="range"
              min="10" max="2000"
              value={targetKB}
              onChange={(e) => setTargetKB(Number(e.target.value))}
              className="w-full max-w-md h-2 mt-8 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
            />
          </div>
        )}

        <div className="max-w-xl mx-auto space-y-8">
          {!result && (
            <div
              onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
              className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-200 ${isDragging ? 'border-blue-400 bg-blue-50/50 scale-[1.02]' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}
            >
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} disabled={isProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-blue-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg></div>
                <span className="font-bold text-lg mb-1">{isProcessing ? 'Processing...' : 'Click to select image or PDF'}</span>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 text-left bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
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
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl hover:scale-105 transition-all text-sm font-bold shadow-lg"
                >
                  Download Output
                </button>
              </div>

              {!result.isPdf && <BeforeAfterSlider originalUrl={result.originalUrl} compressedUrl={result.compressedUrl} />}
              
              <div className="flex justify-between items-center text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs font-sans font-bold uppercase">Original</span>
                  <span className="text-slate-600 dark:text-slate-300 font-bold">{formatBytes(result.originalSize)}</span>
                </div>
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                <div className="flex flex-col text-right">
                  <span className="text-slate-400 text-xs font-sans font-bold uppercase">Target</span>
                  <span className="text-emerald-500 font-bold">{formatBytes(result.compressedSize)}</span>
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
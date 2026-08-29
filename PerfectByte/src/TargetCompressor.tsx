import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { compressToTarget } from './compressionService';
import { compressPDF } from './pdfUtils';
import { addHistoryEntry, getHistoryStats } from './historyService';
import { toast } from 'sonner';

interface SizePreset {
  label: string;
  kb: number;
  hint?: string;
}

const SIZE_PRESETS: SizePreset[] = [
  { label: 'Indian Passport (Seva)', kb: 250, hint: '630×810px JPEG, domestic online upload' },
  { label: 'WhatsApp DP', kb: 100 },
  { label: 'Email attachment', kb: 500 },
  { label: 'Exam/Govt form', kb: 50, hint: 'Generic placeholder — verify the exact limit' },
];

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
      <img
        src={compressedUrl}
        alt="Compressed"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={originalUrl}
          alt="Original"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-blue-400 shadow-[0_0_10px_rgba(0,0,0,0.3)] dark:shadow-[0_0_15px_rgba(96,165,250,0.5)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full shadow-md border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 text-xs transition-colors">
          ↔
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Drag to compare original and compressed image"
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />

      <span className="absolute top-3 left-3 bg-slate-900/70 dark:bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none font-medium">
        Original
      </span>
      <span className="absolute top-3 right-3 bg-slate-900/70 dark:bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none font-medium">
        Compressed
      </span>
    </div>
  );
}

export default function TargetCompressor() {
  const [targetKB, setTargetKB] = useState<number>(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [stats, setStats] = useState(() => getHistoryStats());

  const processFile = async (file: File) => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.compressedUrl);
    }

    setIsProcessing(true);
    setResult(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const toastId = toast.loading(isPdf ? 'Compressing PDF (this might take a moment)...' : 'Optimizing quality and resolution...');

    try {
      const targetBytes = targetKB * 1024;
      let finalBlob: Blob | null = null;

      if (isPdf) {
        // PDF Compression Loop (Progressively stepping down JPEG quality)
        let quality = 0.8;
        for (let i = 0; i < 3; i++) {
          toast.loading(`Compressing PDF (Attempt ${i + 1}/3)...`, { id: toastId });
          finalBlob = await compressPDF(file, quality);
          if (finalBlob.size <= targetBytes) break;
          quality -= 0.3; // Drops from 0.8 to 0.5 to 0.2
        }
        if (!finalBlob) throw new Error('PDF compression failed');
      } else {
        // Image Compression Loop (Web Worker Binary Search)
        const bitmap = await createImageBitmap(file);
        let width = bitmap.width;
        let height = bitmap.height;
        let attempts = 0;

        while (attempts < 5) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) throw new Error('Canvas context failed');

          ctx.drawImage(bitmap, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);

          const resultBuffer = await compressToTarget(imageData, targetBytes);
          const currentBlob = new Blob([resultBuffer], { type: 'image/webp' });

          if (currentBlob.size <= targetBytes || attempts === 4) {
            finalBlob = currentBlob;
            break; 
          }

          width = Math.floor(width * 0.75);
          height = Math.floor(height * 0.75);
          attempts++;
        }

        bitmap.close();
        if (!finalBlob) throw new Error('Compression failed');
      }

      setResult({
        fileName: file.name.replace(/\.[^/.]+$/, '') + (isPdf ? '_compressed.pdf' : '.webp'),
        originalUrl: URL.createObjectURL(file),
        compressedUrl: URL.createObjectURL(finalBlob),
        originalSize: file.size,
        compressedSize: finalBlob.size,
        isPdf
      });

      addHistoryEntry({
        fileName: file.name,
        originalSize: file.size,
        compressedSize: finalBlob.size,
      });
      setStats(getHistoryStats());

      toast.success(isPdf ? 'PDF compressed successfully!' : 'Done! Drag the slider to compare.', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during compression.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file manually bypassing strict OS limitations
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);

    if (!isPdf && !isImage) {
      toast.error('Unsupported format. Please upload a PDF or an Image.');
      return;
    }

    processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/') || file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
      
      if (!isPdf && !isImage) {
        toast.error('Unsupported format. Please drop a PDF or an Image.');
        return;
      }
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.compressedUrl;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden transition-colors duration-150">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/40 dark:bg-blue-900/20 blur-[120px] pointer-events-none transition-colors duration-150"></div>
      
      <Link to="/" className="mb-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white self-start max-w-4xl w-full mx-auto font-medium transition-colors flex items-center gap-2 relative z-10">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Tools
      </Link>

      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800 max-w-4xl w-full text-center relative z-10 transition-colors duration-150">
        <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-3">Compress to Target Size</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">Define your exact required file size in KB.</p>

        <div className="max-w-md mx-auto space-y-8">
          <div className="text-left bg-white/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-150">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Target Size (KB)
            </label>
            <input
              type="number"
              value={targetKB}
              onChange={(e) => setTargetKB(Number(e.target.value))}
              className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all text-slate-700 dark:text-slate-100 font-medium"
              min="1"
            />

            <div className="flex flex-wrap gap-2 mt-4">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setTargetKB(preset.kb)}
                  title={preset.hint}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all ${
                    targetKB === preset.kb
                      ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'
                  }`}
                >
                  {preset.label} · {preset.kb}KB
                </button>
              ))}
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-200 ${
              isDragging ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {/* The accept attribute is removed entirely. The OS will allow all files, and handleFileUpload will strictly validate them. */}
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-center pointer-events-none flex flex-col items-center">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4 text-blue-500 dark:text-blue-400 transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              </div>
              <span className="block text-slate-800 dark:text-slate-200 font-bold text-lg mb-1 transition-colors">
                {isProcessing ? 'Processing...' : isDragging ? 'Drop it here' : 'Click to select image or PDF'}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">
                or drag and drop it here
              </span>
            </div>
          </div>

          {result && (
            <div className="space-y-5 text-left bg-white/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-150">
              
              {result.isPdf ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                  <svg className="w-16 h-16 text-red-500/90 mb-4 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path></svg>
                  <p className="text-slate-800 dark:text-white font-bold text-lg mb-1">{result.fileName}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">PDF Optimized & Ready</p>
                </div>
              ) : (
                <BeforeAfterSlider originalUrl={result.originalUrl} compressedUrl={result.compressedUrl} />
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  {formatBytes(result.originalSize)} &rarr;{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatBytes(result.compressedSize)}</span>
                </span>
                <button
                  onClick={handleDownload}
                  className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-white hover:shadow-lg transition-all text-sm font-bold flex items-center gap-2"
                >
                  Download
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </button>
              </div>
            </div>
          )}

          {stats.count > 0 && (
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 text-center">
              {formatBytes(stats.totalOriginal - stats.totalCompressed)} saved across {stats.count} file
              {stats.count !== 1 ? 's' : ''} so far
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
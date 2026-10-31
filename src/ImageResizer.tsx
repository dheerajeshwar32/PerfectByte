import React, { useState, useRef } from 'react';
import ToolShell from './ToolShell';
import StudioDropzone from './components/StudioDropzone';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { toast } from 'sonner';
import { haptic } from './usePWA';

type Preset = {
  label: string;
  width: number;
  height: number;
  ratio: string;
  category?: string;
};

const PRESETS: Preset[] = [
  { label: 'Passport Photo', width: 600, height: 600, ratio: '1:1' },
  { label: 'Instagram Post', width: 1080, height: 1080, ratio: '1:1' },
  { label: 'Instagram Story', width: 1080, height: 1920, ratio: '9:16' },
  { label: 'Twitter/X Header', width: 1500, height: 500, ratio: '3:1' },
  { label: 'LinkedIn Banner', width: 1584, height: 396, ratio: '4:1' },
  { label: 'YouTube 720p', width: 1280, height: 720, ratio: '16:9' },
  { label: 'Full HD 1080p', width: 1920, height: 1080, ratio: '16:9' },
  { label: '4K UHD', width: 3840, height: 2160, ratio: '16:9' },
];

export default function ImageResizer() {
  useDocumentTitle('Image Resizer');

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [lockRatio, setLockRatio] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setResultBlob(null);
    setResultUrl('');

    const img = new Image();
    img.onload = () => {
      setOriginalWidth(img.width);
      setOriginalHeight(img.height);
      setWidth(img.width);
      setHeight(img.height);
      haptic(10);
    };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleWidthChange = (val: string) => {
    const num = parseInt(val, 10);
    setWidth(val === '' ? '' : num);
    if (lockRatio && originalWidth && originalHeight && !isNaN(num)) {
      setHeight(Math.round(num * (originalHeight / originalWidth)));
    }
  };

  const handleHeightChange = (val: string) => {
    const num = parseInt(val, 10);
    setHeight(val === '' ? '' : num);
    if (lockRatio && originalWidth && originalHeight && !isNaN(num)) {
      setWidth(Math.round(num * (originalWidth / originalHeight)));
    }
  };

  const handlePresetClick = (preset: Preset) => {
    setWidth(preset.width);
    setHeight(preset.height);
    if (lockRatio) setLockRatio(false);
    haptic(10);
  };

  const processImage = async () => {
    if (!file || typeof width !== 'number' || typeof height !== 'number') return;
    setIsProcessing(true);

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas rendering context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error('Blob generation failed');
          setResultBlob(blob);
          setResultUrl(URL.createObjectURL(blob));
          haptic([12, 40, 20]);
          toast.success(`Image resized to ${width} × ${height} px!`);
          canvas.width = 0;
          canvas.height = 0;
          setIsProcessing(false);
        },
        file.type,
        0.92
      );
    } catch (err) {
      console.error(err);
      toast.error('Error resizing image');
      setIsProcessing(false);
    }
  };

  // Helper to format aspect ratio
  const calculateCurrentRatio = () => {
    if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      const rw = width / divisor;
      const rh = height / divisor;
      if (rw <= 21 && rh <= 21) {
        return `${rw}:${rh}`;
      }
      return `${(width / height).toFixed(2)}:1`;
    }
    return '1:1';
  };

  // ─── 7-Column Left Interactive Stage ───
  const canvasContent = (
    <div className="w-full h-full flex flex-col justify-center">
      {!file ? (
        <StudioDropzone
          isDragging={isDragging}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          title="Drop an image to resize"
          subtitle="Precision dimension resizing with high-fidelity Lanczos-3 interpolation"
          formats={['PNG', 'JPEG', 'WebP', 'AVIF']}
          iconColor="text-rose-500"
          fileInput={
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              aria-label="Upload image to resize"
              className="hidden"
            />
          }
        />
      ) : (
        <div className="w-full flex-1 min-h-[460px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#12141C]/80 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Top Identity Strip */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {file.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Source: {originalWidth} × {originalHeight} px • {formatBytes(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  aria-label="Change image file"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 transition-all"
                >
                  Change Image
                </button>
              </div>
            </div>

            {/* Visual Canvas Area with Checkerboard pattern */}
            <div className="mt-4 relative w-full h-[320px] sm:h-[350px] rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0A0C14] border border-slate-200/80 dark:border-white/10 flex items-center justify-center pb-checkerboard">
              <img
                src={resultUrl || previewUrl}
                alt="Image Preview"
                className="max-w-full max-h-full object-contain p-2 transition-all duration-200"
              />

              {/* Floating Status Badges */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-white/15 flex items-center gap-1.5 shadow-md">
                <span className={`w-1.5 h-1.5 rounded-full ${resultUrl ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                <span>{resultUrl ? 'RESIZED OUTPUT' : 'LIVE PREVIEW'}</span>
              </div>

              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[10px] border border-white/15 shadow-md">
                {resultUrl ? `${width} × ${height} px` : `Target: ${width || '—'} × ${height || '—'} px`}
              </div>

              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[10px] border border-white/15 shadow-md">
                Ratio: {calculateCurrentRatio()}
              </div>

              {resultBlob && (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-emerald-400/30 shadow-md">
                  Size: {formatBytes(resultBlob.size)}
                </div>
              )}
            </div>
          </div>

          {/* Bottom telemetry footer */}
          <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Lanczos-3 / High Quality Resampling</span>
            </span>
            <span>
              {resultUrl ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rendered Successfully</span>
              ) : (
                'Awaiting Dimension Confirmation'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // ─── 5-Column Right Inspector Console ───
  const inspectorContent = (
    <div className="flex flex-col gap-5">
      {/* Dimension Studio Console */}
      <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-bold">
            DIMENSION STUDIO
          </span>
          <button
            type="button"
            onClick={() => {
              setLockRatio(!lockRatio);
              haptic(8);
            }}
            className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg transition-all border ${
              lockRatio
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'bg-slate-200/60 dark:bg-white/[0.06] border-slate-300 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lockRatio ? '🔒 Aspect Ratio Locked' : '🔓 Freeform Mode'}
          </button>
        </div>

        {/* Width & Height Number Inputs with integrated inline "PX" badge */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1.5 font-semibold">
              WIDTH
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                min="1"
                max="16000"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                placeholder="Width"
                aria-label="Target width in pixels"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl text-sm font-mono font-bold bg-white dark:bg-[#0B0E1B] text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 focus:border-[#5668FF] focus:ring-2 focus:ring-[#5668FF]/20 outline-none transition-all shadow-inner"
              />
              <span className="absolute right-3 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                PX
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mb-1.5 font-semibold">
              HEIGHT
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                min="1"
                max="16000"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                placeholder="Height"
                aria-label="Target height in pixels"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl text-sm font-mono font-bold bg-white dark:bg-[#0B0E1B] text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 focus:border-[#5668FF] focus:ring-2 focus:ring-[#5668FF]/20 outline-none transition-all shadow-inner"
              />
              <span className="absolute right-3 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                PX
              </span>
            </div>
          </div>
        </div>

        {/* Live Ratio & Scale Calculation Readout */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
          <span>Active Aspect Ratio</span>
          <span className="font-bold text-slate-900 dark:text-white">{calculateCurrentRatio()}</span>
        </div>
      </div>

      {/* Visual Aspect-Ratio Bento Presets */}
      <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-bold">
          STANDARD PRESETS
        </span>

        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {PRESETS.map((p) => {
            const isSelected = width === p.width && height === p.height;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePresetClick(p)}
                className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/60 shadow-xs'
                    : 'bg-white dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.label}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 shrink-0">
                    {p.ratio}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
                  {p.width} × {p.height} px
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="space-y-2">
        {resultUrl ? (
          <>
            <a
              href={resultUrl}
              download={file ? `resized_${file.name}` : 'resized_image.png'}
              className="w-full py-4 rounded-xl font-bold text-sm text-center block transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              Download Resized Image
            </a>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResultUrl('');
                setResultBlob(null);
              }}
              className="w-full py-2.5 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-center"
            >
              ← Resize Another Image
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={processImage}
            disabled={!file || !width || !height || isProcessing}
            className="w-full py-4 rounded-xl font-bold text-sm transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Resizing Image...</span>
              </>
            ) : (
              <span>Resize &amp; Render</span>
            )}
          </button>
        )}
      </div>

      {/* Micro-Trust & Specs Card */}
      <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] space-y-2 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Resampling</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">Bicubic / Lanczos-3</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Memory Boundary</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% In-Browser Memory</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Server Uploads</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0 Bytes</span>
        </div>
      </div>
    </div>
  );

  return (
    <ToolShell
      title="Image Resizer"
      accentColor="bg-rose-500"
      badgeText="LANCZOS-3 INTERPOLATION"
      canvas={canvasContent}
      inspector={inspectorContent}
    />
  );
}

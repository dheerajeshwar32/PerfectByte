import React, { useState } from 'react';
import ToolShell from './ToolShell';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { toast } from 'sonner';
import { haptic } from './usePWA';

type Preset = { label: string; width: number; height: number };

const PRESETS: Preset[] = [
  { label: 'Passport Photo', width: 600, height: 600 },
  { label: 'Instagram Post', width: 1080, height: 1080 },
  { label: 'Instagram Story', width: 1080, height: 1920 },
  { label: 'Twitter/X Header', width: 1500, height: 500 },
  { label: 'LinkedIn Banner', width: 1584, height: 396 },
  { label: 'YouTube 720p', width: 1280, height: 720 },
  { label: 'Full HD 1080p', width: 1920, height: 1080 },
  { label: '4K UHD', width: 3840, height: 2160 },
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

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
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
    };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
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
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error('Blob creation failed');
          setResultBlob(blob);
          setResultUrl(URL.createObjectURL(blob));
          haptic([12, 40, 20]);
          toast.success('Image resized successfully!');
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

  // ─── Canvas Content ───
  const canvasContent = (
    <div className="flex flex-col items-center justify-center w-full gap-4 max-w-xl mx-auto">
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative w-full p-10 md:p-14 border-2 border-dashed rounded-3xl cursor-pointer group/drop pb-panel text-center ${
            isDragging
              ? 'border-[#5668FF] bg-[#5668FF]/5 scale-[1.01]'
              : 'border-zinc-300 dark:border-zinc-700/60 hover:border-[#5668FF]/60'
          }`}
          style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            aria-label="Upload image to resize"
            className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl pb-control flex items-center justify-center text-rose-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">Drop an image to resize</p>
            <p className="text-xs text-zinc-500">Exact pixel dimensions or aspect scaling</p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-3">
          <div className="relative w-full aspect-[4/3] max-h-[46dvh] rounded-2xl overflow-hidden pb-panel bg-checkerboard flex items-center justify-center border border-[var(--pb-border)]">
            <img
              src={resultUrl || previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-white font-mono text-[10px]">
              {resultUrl ? 'RESIZED OUTPUT' : 'ORIGINAL'}
            </div>
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-white font-mono text-[10px]">
              {resultUrl ? `${width} × ${height} px` : `${originalWidth} × ${originalHeight} px`}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Inspector Content ───
  const inspectorContent = (
    <div className="space-y-4">
      {/* Dimension Inputs */}
      <div className="pb-panel p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            TARGET DIMENSIONS
          </span>
          <button
            type="button"
            onClick={() => setLockRatio(!lockRatio)}
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              lockRatio ? 'bg-[#5668FF]/20 text-[#5668FF]' : 'text-zinc-400'
            }`}
          >
            {lockRatio ? '🔒 Locked 1:1' : '🔓 Unlocked'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono text-zinc-500 block mb-1">WIDTH (PX)</label>
            <input
              type="number"
              value={width}
              onChange={(e) => handleWidthChange(e.target.value)}
              placeholder="Width"
              className="w-full pb-control rounded-xl px-3 py-2 text-sm font-mono text-zinc-900 dark:text-white outline-none border border-[var(--pb-border)]"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-500 block mb-1">HEIGHT (PX)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => handleHeightChange(e.target.value)}
              placeholder="Height"
              className="w-full pb-control rounded-xl px-3 py-2 text-sm font-mono text-zinc-900 dark:text-white outline-none border border-[var(--pb-border)]"
            />
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="pb-panel p-4 rounded-2xl space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
          STANDARD PRESETS
        </span>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePresetClick(p)}
              className="px-2 py-1.5 text-[10px] font-mono pb-control text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-lg text-left truncate"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {resultUrl ? (
          <>
            <a
              href={resultUrl}
              download={file ? `resized_${file.name}` : 'resized_image.png'}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] text-center block"
            >
              Download Resized Image
            </a>
            <button
              type="button"
              onClick={() => { setFile(null); setResultUrl(''); setResultBlob(null); }}
              className="w-full py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-xl pb-control text-center"
            >
              ← Resize Another Image
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={processImage}
            disabled={!file || !width || !height || isProcessing}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] disabled:opacity-40"
          >
            {isProcessing ? 'Resizing Image...' : 'Resize & Render'}
          </button>
        )}
      </div>

      {resultBlob && (
        <div className="text-center text-[11px] font-mono text-zinc-400">
          Result size: {formatBytes(resultBlob.size)}
        </div>
      )}
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

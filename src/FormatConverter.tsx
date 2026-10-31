import React, { useState, useRef, useCallback } from 'react';
import ToolShell from './ToolShell';
import { encode as encodeWebp } from '@jsquash/webp';
import { encode as encodePng } from '@jsquash/png';
import { encode as encodeJpeg } from '@jsquash/jpeg';
import { encode as encodeAvif } from '@jsquash/avif';
import { getImageData, getImageMeta, formatBytes, type ImageMeta } from './utils';
import { useDocumentTitle } from './useDocumentTitle';
import { toast } from 'sonner';
import { haptic } from './usePWA';

type Format = 'webp' | 'jpeg' | 'png' | 'avif';

export default function FormatConverter() {
  useDocumentTitle('Format Converter');

  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetFormat, setTargetFormat] = useState<Format>('webp');
  const [quality, setQuality] = useState(80);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number; format: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (f: File) => {
    setFile(f);
    setResult(null);
    try {
      const m = await getImageMeta(f);
      setMeta(m);
    } catch {
      toast.error('Failed to read image metadata.');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        await processFile(droppedFile);
      } else {
        toast.error('Please drop an image file.');
      }
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setResult(null);

    try {
      const imageData = await getImageData(file);
      let buffer: ArrayBuffer;
      const mimeType = `image/${targetFormat}`;

      if (targetFormat === 'webp') {
        buffer = await encodeWebp(imageData, { quality });
      } else if (targetFormat === 'jpeg') {
        buffer = await encodeJpeg(imageData, { quality });
      } else if (targetFormat === 'png') {
        buffer = await encodePng(imageData);
      } else if (targetFormat === 'avif') {
        try {
          toast.info('Encoding AVIF (this may take a moment)...');
          buffer = await encodeAvif(imageData as unknown as ImageData, { quality });
        } catch (e: unknown) {
          throw new Error('AVIF encoding is not supported in your browser', { cause: e });
        }
      } else {
        throw new Error('Unsupported format');
      }

      const blob = new Blob([buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);

      setResult({
        url,
        size: blob.size,
        format: targetFormat.toUpperCase()
      });

      haptic([12, 40, 20]);
      toast.success('Conversion complete!');
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || 'Failed to convert image.');
    } finally {
      setIsConverting(false);
    }
  };

  const downloadResult = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result.url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_converted.${targetFormat}`;
    a.click();
    haptic(10);
  };

  // ─── Canvas Content ───
  const canvasContent = (
    <div className="flex flex-col items-center justify-center w-full gap-4 max-w-xl mx-auto">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full p-10 md:p-14 border-2 border-dashed rounded-3xl cursor-pointer group/drop pb-panel text-center ${
            isDragging
              ? 'border-[#5668FF] bg-[#5668FF]/5 scale-[1.01]'
              : 'border-zinc-300 dark:border-zinc-700/60 hover:border-[#5668FF]/60'
          }`}
          style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            aria-label="Upload image to convert"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl pb-control flex items-center justify-center text-cyan-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">Drop an image to convert</p>
            <p className="text-xs text-zinc-500">WebP, PNG, JPEG, AVIF supported</p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-3">
          <div className="relative w-full aspect-[4/3] max-h-[46dvh] rounded-2xl overflow-hidden pb-panel bg-checkerboard flex items-center justify-center border border-[var(--pb-border)]">
            <img
              src={result ? result.url : URL.createObjectURL(file)}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-white font-mono text-[10px]">
              {result ? `${result.format} OUTPUT` : 'ORIGINAL'}
            </div>
            {meta && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-white font-mono text-[10px]">
                {meta.width} × {meta.height} px
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Inspector Content ───
  const inspectorContent = (
    <div className="space-y-4">
      <div className="pb-panel p-4 rounded-2xl space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
          TARGET CODEC
        </span>

        <div className="grid grid-cols-2 gap-1.5 pb-control p-1 rounded-xl">
          {(['webp', 'jpeg', 'png', 'avif'] as Format[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => {
                setTargetFormat(fmt);
                haptic(10);
              }}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                targetFormat === fmt
                  ? 'bg-[#5668FF] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>

        {targetFormat !== 'png' && (
          <div className="space-y-1.5 pt-2 border-t border-[var(--pb-border)]">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-500">Quality</span>
              <span className="font-bold text-[#5668FF]">{quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              aria-label="Quality slider"
              className="scrubber-track"
            />
          </div>
        )}
      </div>

      {file && meta && (
        <div className="pb-panel p-4 rounded-2xl space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-500">Source</span>
            <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">{file.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Input Size</span>
            <span className="text-zinc-800 dark:text-zinc-200">{formatBytes(file.size)}</span>
          </div>
          {result && (
            <div className="flex justify-between border-t border-[var(--pb-border)] pt-2 font-bold">
              <span className="text-zinc-500">Result Size</span>
              <span className="text-emerald-500">{formatBytes(result.size)}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {result ? (
          <>
            <button
              type="button"
              onClick={downloadResult}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)]"
            >
              Download {result.format}
            </button>
            <button
              type="button"
              onClick={() => { setFile(null); setResult(null); }}
              className="w-full py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-xl pb-control text-center"
            >
              ← Convert Another File
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || isConverting}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] disabled:opacity-40"
          >
            {isConverting ? 'Encoding Image...' : `Convert to ${targetFormat.toUpperCase()}`}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <ToolShell
      title="Format Converter"
      accentColor="bg-cyan-500"
      badgeText="SIMD WASM CODECS"
      canvas={canvasContent}
      inspector={inspectorContent}
    />
  );
}

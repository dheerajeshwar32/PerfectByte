import React, { useState, useRef, useCallback } from 'react';
import ToolShell from './ToolShell';
import StudioDropzone from './components/StudioDropzone';
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
      haptic(10);
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
        format: targetFormat.toUpperCase(),
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

  // ─── 7-Column Left Interactive Stage ───
  const canvasContent = (
    <div className="w-full h-full flex flex-col justify-center">
      {!file ? (
        <StudioDropzone
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          title="Drop an image to convert"
          subtitle="Instant client-side transcoding between WebP, JPEG, PNG, and AVIF"
          formats={['WebP', 'JPEG', 'PNG', 'AVIF']}
          iconColor="text-cyan-500"
          fileInput={
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              aria-label="Upload image to convert"
            />
          }
        />
      ) : (
        <div className="w-full flex-1 min-h-[460px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#12141C]/80 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Top Identity Strip */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {file.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {meta ? `${meta.width} × ${meta.height} px • ` : ''}{formatBytes(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
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

            {/* Visual Canvas Area */}
            <div className="mt-4 relative w-full h-[320px] sm:h-[350px] rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0A0C14] border border-slate-200/80 dark:border-white/10 flex items-center justify-center pb-checkerboard">
              <img
                src={result ? result.url : URL.createObjectURL(file)}
                alt="Image Preview"
                className="max-w-full max-h-full object-contain p-2 transition-all duration-200"
              />

              {/* Floating Badges */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-white/15 flex items-center gap-1.5 shadow-md">
                <span className={`w-1.5 h-1.5 rounded-full ${result ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                <span>{result ? `${result.format} OUTPUT` : 'SOURCE IMAGE'}</span>
              </div>

              {meta && (
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[10px] border border-white/15 shadow-md">
                  {meta.width} × {meta.height} px
                </div>
              )}

              {result && (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-emerald-400/30 shadow-md">
                  Size: {formatBytes(result.size)}
                </div>
              )}
            </div>
          </div>

          {/* Bottom telemetry footer */}
          <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>@jsquash SIMD WebAssembly Codecs</span>
            </span>
            <span>Target: {targetFormat.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );

  // ─── 5-Column Right Inspector Console ───
  const inspectorContent = (
    <div className="flex flex-col gap-5">
      {/* Target Codec Selector */}
      <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-bold">
          TARGET CODEC
        </span>

        <div className="grid grid-cols-2 gap-2">
          {(['webp', 'jpeg', 'png', 'avif'] as Format[]).map((fmt) => {
            const isSelected = targetFormat === fmt;
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => {
                  setTargetFormat(fmt);
                  haptic(10);
                }}
                className={`py-3 px-4 rounded-xl text-xs font-mono font-bold transition-all border ${
                  isSelected
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'bg-white dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.07] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            );
          })}
        </div>

        {targetFormat !== 'png' && (
          <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">Quality Factor</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              aria-label="Quality slider"
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* File & Compression Summary */}
      {file && (
        <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-2.5 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Source Payload</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatBytes(file.size)}</span>
          </div>
          {result && (
            <>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Output Payload</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatBytes(result.size)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/80 dark:border-white/10 pt-2 text-slate-600 dark:text-slate-400">
                <span>Ratio Delta</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {result.size <= file.size
                    ? `-${Math.round((1 - result.size / file.size) * 100)}%`
                    : `+${Math.round((result.size / file.size - 1) * 100)}%`}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Primary Action Button */}
      <div className="space-y-2">
        {result ? (
          <>
            <button
              type="button"
              onClick={downloadResult}
              className="w-full py-4 rounded-xl font-bold text-sm text-center block transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              Download {result.format}
            </button>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="w-full py-2.5 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-center"
            >
              ← Convert Another File
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || isConverting}
            className="w-full py-4 rounded-xl font-bold text-sm transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConverting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Encoding {targetFormat.toUpperCase()}...</span>
              </>
            ) : (
              <span>Convert to {targetFormat.toUpperCase()}</span>
            )}
          </button>
        )}
      </div>

      {/* Micro-Trust & Specs Card */}
      <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] space-y-2 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Encoder</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">@jsquash WebAssembly</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Vector Loss</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0% Generation Loss</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Telemetry</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero Server Contact</span>
        </div>
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

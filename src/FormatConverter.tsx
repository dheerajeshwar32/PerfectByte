import React, { useState, useRef, useCallback } from 'react';
import { encode as encodeWebp } from '@jsquash/webp';
import { encode as encodePng } from '@jsquash/png';
import { encode as encodeJpeg } from '@jsquash/jpeg';
import { encode as encodeAvif } from '@jsquash/avif';
import { getImageData, getImageMeta, formatBytes, type ImageMeta } from './utils';
import Navbar from './Navbar';
import { useDocumentTitle } from './useDocumentTitle';
import { toast } from 'sonner';

type Format = 'png' | 'jpeg' | 'webp' | 'avif';

export default function FormatConverter() {
  useDocumentTitle('Format Converter');

  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [targetFormat, setTargetFormat] = useState<Format>('webp');
  const [quality, setQuality] = useState(75);
  
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
    // Replace original extension with new extension
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}_converted.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isLossy = targetFormat !== 'png';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <Navbar />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>

      <div className="bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-5xl w-full text-center relative z-10 mt-4 mx-4">
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 to-slate-600 dark:from-white dark:to-slate-400 mb-8 md:mb-12 leading-tight px-4 pb-2">
          Format <br className="hidden sm:block" />
          <span 
            className="text-[#5668FF] drop-shadow-sm"
            style={{ textShadow: '-2px 0px 0px rgba(0,255,255,0.3), 2px 0px 0px rgba(255,0,255,0.3)' }}
          >
            Converter
          </span>
        </h1>

        {!file && (
          <div 
            className={`relative w-full max-w-2xl mx-auto p-10 md:p-14 border-2 border-dashed rounded-[2rem] transition-all duration-500 cursor-pointer group/drop backdrop-blur-sm ${
              isDragging 
                ? 'border-[#5668FF] bg-[#5668FF]/5 scale-[1.02] shadow-[0_0_40px_rgba(86,104,255,0.15)]' 
                : 'bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/40 dark:to-slate-900/40 border-slate-200/60 dark:border-slate-700/40 hover:border-[#5668FF]/50 hover:shadow-[0_0_40px_rgba(86,104,255,0.08)]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#5668FF]/10 dark:bg-[#5668FF]/20 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-[#5668FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Drop your image here</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">or <span className="text-[#5668FF] font-medium hover:underline">browse files</span></p>
              </div>
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*"
            />
          </div>
        )}

        {file && meta && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            {/* Left side: Uploaded file info & Result */}
            <div className="space-y-6">
              <div className="text-left bg-white/60 dark:bg-[#0a0f1c]/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] border border-slate-100/80 dark:border-indigo-800/40 shadow-sm">
                <h3 className="font-bold text-indigo-800 dark:text-white mb-4">Original Image</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500">File Name</span>
                  <span className="font-medium text-indigo-800 dark:text-slate-200 truncate max-w-[200px]" title={file.name}>{file.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500">Dimensions</span>
                  <span className="font-medium text-indigo-800 dark:text-slate-200">{meta.width} × {meta.height} px</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500">File Size</span>
                  <span className="font-medium text-indigo-800 dark:text-slate-200">{formatBytes(file.size)}</span>
                </div>
                <div className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  Note: Metadata is stripped automatically during conversion.
                </div>
                
                <button 
                  onClick={() => { setFile(null); setResult(null); }}
                  className="mt-6 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                >
                  Start Over
                </button>
              </div>

              {result && (
                <div className="text-left bg-white/60 dark:bg-[#0a0f1c]/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] border border-[#5668FF]/30 dark:border-[#5668FF]/20 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5668FF] to-purple-500"></div>
                  <h3 className="font-bold text-indigo-800 dark:text-white mb-4">Conversion Result</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">New Format</span>
                    <span className="font-medium text-indigo-800 dark:text-slate-200">{result.format}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">New Size</span>
                    <span className="font-bold text-[#5668FF] dark:text-[#7888FF]">{formatBytes(result.size)}</span>
                  </div>
                  
                  {result.size < file.size && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-500">Reduction</span>
                      <span className="font-bold text-[#5668FF] dark:text-[#7888FF]">
                        {((file.size - result.size) / file.size * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <button 
                    onClick={downloadResult}
                    className="mt-6 w-full py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)] flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download {result.format}
                  </button>
                </div>
              )}
            </div>

            {/* Right side: Conversion Settings */}
            <div className="text-left bg-white/60 dark:bg-[#0a0f1c]/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] border border-slate-100/80 dark:border-indigo-800/40 shadow-sm h-fit">
              <h3 className="font-bold text-indigo-800 dark:text-white mb-6">Settings</h3>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Target Format</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['webp', 'jpeg', 'png', 'avif'] as Format[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setTargetFormat(fmt)}
                      className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                        targetFormat === fmt 
                          ? 'bg-[#5668FF] text-white shadow-md' 
                          : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {isLossy && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quality</label>
                    <span className="font-mono text-sm font-bold text-[#5668FF] dark:text-[#7888FF]">{quality}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#5668FF]"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Smaller File</span>
                    <span>Better Quality</span>
                  </div>
                </div>
              )}

              <button 
                onClick={handleConvert}
                disabled={isConverting}
                className={`w-full py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  isConverting 
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)]'
                }`}
              >
                {isConverting ? 'Converting...' : 'Convert Image'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

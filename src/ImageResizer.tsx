import { useState } from 'react';
import Navbar from './Navbar';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { toast } from 'sonner';

type Preset = { label: string; width: number; height: number };

const PRESETS: Preset[] = [
  { label: 'Passport Photo', width: 600, height: 600 },
  { label: 'Instagram Post', width: 1080, height: 1080 },
  { label: 'Instagram Story', width: 1080, height: 1920 },
  { label: 'Twitter/X Header', width: 1500, height: 500 },
  { label: 'LinkedIn Banner', width: 1584, height: 396 },
  { label: 'YouTube Thumbnail', width: 1280, height: 720 },
  { label: 'Facebook Cover', width: 820, height: 312 },
  { label: 'HD 1080p', width: 1920, height: 1080 },
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
      
      ctx.drawImage(bitmap, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setResultBlob(blob);
            setResultUrl(URL.createObjectURL(blob));
            toast.success('Image resized successfully!');
          }
          setIsProcessing(false);
        },
        'image/webp',
        0.92
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to resize image');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden transition-colors duration-150">
      <Navbar />
      
      <main className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800 max-w-5xl w-full text-center relative z-10 mt-16">
        <h1 className="text-4xl md:text-5xl font-black mb-8 text-slate-800 dark:text-white">
          Image <span className="text-[#5668FF] dark:text-[#7888FF]">Resizer</span>
        </h1>

        {!file && (
          <div
            className={`w-full p-12 border-2 border-dashed rounded-3xl transition-colors cursor-pointer ${
              isDragging
                ? 'border-[#5668FF] bg-blue-50/50 dark:bg-blue-900/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-[#5668FF] dark:hover:border-[#7888FF]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Drag and drop an image here, or click to browse
            </p>
          </div>
        )}

        {file && !resultBlob && (
          <div className="space-y-8">
            <div className="relative inline-block mx-auto">
              <img src={previewUrl} alt="Preview" className="max-h-64 rounded-xl shadow-lg" />
              <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-md">
                {originalWidth} × {originalHeight}
              </div>
            </div>

            <div className="text-left bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl max-w-2xl mx-auto">
              <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Dimensions</h2>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Width (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
                  />
                </div>
                
                <button
                  onClick={() => setLockRatio(!lockRatio)}
                  className={`mt-6 p-3 rounded-full transition-colors ${lockRatio ? 'bg-[#5668FF] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                  title={lockRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {lockRatio ? (
                      <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></>
                    ) : (
                      <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></>
                    )}
                  </svg>
                </button>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Height (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Presets</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-xl text-xs font-medium text-left transition-colors"
                  >
                    <div className="font-bold">{preset.label}</div>
                    <div className="text-slate-400">{preset.width} × {preset.height}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={processImage}
                disabled={isProcessing || !width || !height}
                className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-lg text-xl disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Resize'}
              </button>
            </div>
          </div>
        )}

        {resultBlob && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Done!</h2>
            <div className="relative inline-block mx-auto">
              <img src={resultUrl} alt="Resized" className="max-h-64 rounded-xl shadow-lg" />
            </div>
            
            <div className="text-left bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl max-w-md mx-auto">
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Dimensions</span>
                  <span className="font-bold text-slate-800 dark:text-white">{originalWidth}×{originalHeight} → {width}×{height}</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Original Size</span>
                  <span className="font-bold text-slate-800 dark:text-white">{formatBytes(file!.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">New Size</span>
                  <span className="font-bold text-emerald-500">{formatBytes(resultBlob.size)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setFile(null);
                    setResultBlob(null);
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Start Over
                </button>
                <a
                  href={resultUrl}
                  download={`resized_${width}x${height}_${file!.name.replace(/\.[^/.]+$/, "")}.webp`}
                  className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-colors text-center"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

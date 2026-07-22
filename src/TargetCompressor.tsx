import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { compressToTarget } from './compressionService';
import { addHistoryEntry, getHistoryStats } from './historyService';

interface SizePreset {
  label: string;
  kb: number;
  hint?: string;
}

// Real, sourced starting points where possible. Government/exam portals
// change specs often, so double-check the current numbers for your target
// portal before relying on these for an actual submission.
const SIZE_PRESETS: SizePreset[] = [
  { label: 'Indian Passport (Seva)', kb: 250, hint: '630×810px JPEG, domestic online upload (current post-Feb 2026 rules)' },
  { label: 'WhatsApp DP', kb: 100 },
  { label: 'Email attachment', kb: 500 },
  { label: 'Exam/Govt form', kb: 50, hint: 'Generic placeholder — verify the exact limit for your specific portal' },
];

interface CompressionResult {
  fileName: string;
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
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
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-100 select-none">
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
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 text-xs">
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

      <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Original
      </span>
      <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Compressed
      </span>
    </div>
  );
}

export default function TargetCompressor() {
  const [targetKB, setTargetKB] = useState<number>(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
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
    setMessage('Running binary search to find optimal quality...');

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context failed');

      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const targetBytes = targetKB * 1024;
      const resultBuffer = await compressToTarget(imageData, targetBytes);
      const blob = new Blob([resultBuffer], { type: 'image/webp' });

      setResult({
        fileName: file.name.replace(/\.[^/.]+$/, '') + '.webp',
        originalUrl: URL.createObjectURL(file),
        compressedUrl: URL.createObjectURL(blob),
        originalSize: file.size,
        compressedSize: blob.size,
      });

      addHistoryEntry({
        fileName: file.name,
        originalSize: file.size,
        compressedSize: blob.size,
      });
      setStats(getHistoryStats());

      setMessage('Done — drag the slider to compare, then download.');
    } catch (error) {
      console.error(error);
      setMessage('An error occurred during compression.');
    } finally {
      setIsProcessing(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Link to="/" className="mb-8 text-blue-500 hover:underline self-start max-w-4xl w-full mx-auto font-medium">
        &larr; Back to Tools
      </Link>

      <div className="bg-white p-10 rounded-lg shadow-sm border border-gray-100 max-w-4xl w-full text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Compress Image to Target Size</h2>
        <p className="text-gray-600 mb-8">Define your exact required file size in KB.</p>

        <div className="max-w-md mx-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Target Size (KB)
            </label>
            <input
              type="number"
              value={targetKB}
              onChange={(e) => setTargetKB(Number(e.target.value))}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              min="1"
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setTargetKB(preset.kb)}
                  title={preset.hint}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    targetKB === preset.kb
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
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
            className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-center pointer-events-none">
              <span className="block text-blue-600 font-semibold text-lg mb-1">
                {isProcessing ? 'Processing...' : isDragging ? 'Drop it here' : 'Select Image'}
              </span>
              <span className="text-gray-500 text-sm">
                or drag and drop an image here
              </span>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-md text-sm font-medium ${isProcessing ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}

          {result && (
            <div className="space-y-4 text-left">
              <BeforeAfterSlider originalUrl={result.originalUrl} compressedUrl={result.compressedUrl} />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {formatBytes(result.originalSize)} &rarr;{' '}
                  <span className="text-green-600 font-medium">{formatBytes(result.compressedSize)}</span>
                </span>
                <button
                  onClick={handleDownload}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  Download
                </button>
              </div>
            </div>
          )}

          {stats.count > 0 && (
            <p className="text-xs text-gray-400 text-center">
              {formatBytes(stats.totalOriginal - stats.totalCompressed)} saved across {stats.count} image
              {stats.count !== 1 ? 's' : ''} so far
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

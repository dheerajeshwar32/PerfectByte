import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { compressToWebp } from './compressionService';
import { addHistoryEntry, getHistoryStats } from './historyService';
import { toast } from 'sonner';
import { useDocumentTitle } from './useDocumentTitle';

interface CompressedFile {
  name: string;
  url: string;
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

export default function BulkCompressor() {
  useDocumentTitle('Bulk Compressor');
  
  const [files, setFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stats, setStats] = useState(() => getHistoryStats());

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files));
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    compressedFiles.forEach(file => URL.revokeObjectURL(file.url));

    try {
      const results: CompressedFile[] = [];
      for (const file of files) {
        try {
          const blob = await compressToWebp(file);
          results.push({
            name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
            url: URL.createObjectURL(blob),
            originalSize: file.size,
            compressedSize: blob.size,
          });
          addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
        } catch (fileError) {
          console.error(`Failed to compress ${file.name}:`, fileError);
        }
      }

      setCompressedFiles(results);
      setStats(getHistoryStats());
      
      if (results.length === 0) toast.error("Failed to compress images.");
      else toast.success(`Successfully compressed ${results.length} images!`);
    } catch (error) {
      toast.error("A critical error occurred during compression.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    compressedFiles.forEach(file => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const totalReduction = compressedFiles.reduce((acc, curr) => acc + (curr.originalSize - curr.compressedSize), 0);

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

      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800 max-w-5xl w-full text-center relative z-10">
        
        {/* Phase 3: The Hero Stats */}
        <div className="flex flex-col items-center justify-center py-8 mb-8 border-b border-slate-200 dark:border-slate-800">
          <span className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Total Space Saved</span>
          <div 
            className="text-6xl md:text-8xl font-black font-mono tabular-nums text-[#5668FF] dark:text-[#7888FF]"
            style={{ textShadow: '-3px 0px 0px rgba(0,255,255,0.6), 3px 0px 0px rgba(255,0,255,0.6)' }}
          >
            {stats.count > 0 ? formatBytes(stats.totalOriginal - stats.totalCompressed) : '0 MB'}
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest">
            Across {stats.count} lifetime file{stats.count !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          {compressedFiles.length === 0 && (
            <div
              onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ${isDragging ? 'border-emerald-400 bg-emerald-50/50 scale-[1.02]' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}
            >
              <input type="file" multiple accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} disabled={isProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 text-emerald-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></div>
                <span className="font-bold text-xl mb-2">{isProcessing ? 'Processing...' : 'Click to select folders or images'}</span>
                {files.length > 0 && <span className="mt-4 bg-slate-900 text-white font-mono text-xs px-4 py-2 rounded-lg">{files.length} selected</span>}
              </div>
            </div>
          )}

          {files.length > 0 && compressedFiles.length === 0 && (
            <button
              onClick={handleCompress} disabled={isProcessing}
              className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-lg text-xl"
            >
              {isProcessing ? 'Compressing Batch...' : `EXECUTE BATCH (${files.length})`}
            </button>
          )}
        </div>

        {/* Phase 3: The Results Grid */}
        {compressedFiles.length > 0 && (
          <div className="text-left bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Batch Saved</h3>
                <span className="text-3xl font-black font-mono text-emerald-500">{formatBytes(totalReduction)}</span>
              </div>
              <button onClick={handleDownloadAll} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl hover:scale-105 transition-all text-sm font-bold shadow-lg">
                Download All ({compressedFiles.length})
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {compressedFiles.map((file, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col group relative">
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-white dark:bg-black">
                    <img src={file.url} alt={file.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <a href={file.url} download={file.name} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-lg">Download</span>
                    </a>
                  </div>
                  <div className="flex flex-col px-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mb-2">{file.name}</span>
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase">
                      <span className="text-slate-400 line-through">{formatBytes(file.originalSize)}</span>
                      <span className="text-emerald-500 font-bold">{formatBytes(file.compressedSize)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => { setCompressedFiles([]); setFiles([]); }} className="w-full mt-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">
              Clear Batch & Compress More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
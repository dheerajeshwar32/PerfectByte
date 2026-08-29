import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { compressToWebp } from './compressionService';
import { addHistoryEntry, getHistoryStats } from './historyService';
import { toast } from 'sonner';

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
  const [files, setFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stats, setStats] = useState(() => getHistoryStats());

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
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
          addHistoryEntry({
            fileName: file.name,
            originalSize: file.size,
            compressedSize: blob.size,
          });
        } catch (fileError) {
          console.error(`Failed to compress ${file.name}:`, fileError);
        }
      }

      setCompressedFiles(results);
      setStats(getHistoryStats());

      if (results.length === 0) {
        toast.error("Failed to compress the selected images.");
      } else {
        toast.success(`Successfully compressed ${results.length} images!`);
      }

    } catch (error) {
      console.error("Error during bulk compression:", error);
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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden transition-colors duration-150">
      
      <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-[120px] pointer-events-none transition-colors duration-700"></div>

      <Link to="/" className="mb-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white self-start max-w-5xl w-full mx-auto font-medium transition-colors flex items-center gap-2 relative z-10">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Tools
      </Link>

      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800 max-w-5xl w-full text-center relative z-10 transition-colors duration-150">
        <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-3">Bulk Compression</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">Process entire folders of images instantly.</p>

        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-200 ${
              isDragging ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 scale-[1.02]' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-center pointer-events-none flex flex-col items-center">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4 text-emerald-500 dark:text-emerald-400 transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <span className="block text-slate-800 dark:text-slate-200 font-bold text-lg mb-1 transition-colors">
                {isProcessing ? 'Processing...' : isDragging ? 'Drop them here' : 'Click to select images'}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">
                or drag and drop multiple files here
              </span>
              {files.length > 0 && !isProcessing && (
                <span className="mt-4 inline-block bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-3 py-1 rounded-full transition-colors">
                  {files.length} selected
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleCompress}
            disabled={isProcessing || files.length === 0}
            className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-4 px-6 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 transition-all shadow-sm flex justify-center items-center gap-2 text-lg"
          >
            {isProcessing ? (
              <>
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Compressing...
              </>
            ) : (
              `Compress ${files.length || ''} Image${files.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {compressedFiles.length > 0 && (
          <div className="text-left bg-white/50 dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Results ({compressedFiles.length})</h3>
              <button 
                onClick={handleDownloadAll} 
                className="text-sm font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-5 py-2.5 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download All
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {compressedFiles.map((file, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col group relative overflow-hidden transition-colors">
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-50 dark:bg-slate-900">
                    <img 
                      src={file.url} 
                      alt={file.name} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-150" 
                    />
                    <a 
                      href={file.url} 
                      download={file.name}
                      className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-sm"
                    >
                      <span className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">Download</span>
                    </a>
                  </div>
                  <div className="flex flex-col flex-1 px-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mb-1.5" title={file.name}>
                      {file.name}
                    </span>
                    <div className="flex items-center justify-between text-[11px] font-medium mt-auto">
                      <span className="text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600">
                        {formatBytes(file.originalSize)}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {formatBytes(file.compressedSize)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.count > 0 && (
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 text-center mt-8">
            {formatBytes(stats.totalOriginal - stats.totalCompressed)} saved across {stats.count} image{stats.count !== 1 ? 's' : ''} so far
          </p>
        )}
      </div>
    </div>
  );
}
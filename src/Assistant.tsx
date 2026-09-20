import { useState, useRef, useEffect, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { compressToTarget, compressToWebp } from './compressionService';
import { addHistoryEntry } from './historyService';
import { removeBlankPages, compressPDF } from './pdfUtils';
import { useDocumentTitle } from './useDocumentTitle';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface DownloadInfo {
  url: string;
  name: string;
  originalSize?: number;
  compressedSize?: number;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- Icons -----------------------------------------------------------
const SparkIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

const UploadIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const SendIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const DownloadIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export default function Assistant() {
  useDocumentTitle('AI Command Center');

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'SYSTEM ONLINE. Mount a file in the bay, then issue a command (e.g., "compress to 150KB" or "remove blank pages").',
    },
  ]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<DownloadInfo | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, downloadUrl, isBusy]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files));
  };

  const runCompressToTarget = async (targetKB: number) => {
    const file = files[0];
    if (file.type === 'application/pdf') {
      const pdfData = await compressPDF(file, targetKB * 1024);
      const blob = pdfData instanceof Blob ? pdfData : new Blob([pdfData as BlobPart], { type: 'application/pdf' });
      addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
      return { url: URL.createObjectURL(blob), name: file.name.replace(/\.[^/.]+$/, '') + '_compressed.pdf', original: file.size, compressed: blob.size };
    }

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context failed');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const buffer = await compressToTarget(ctx.getImageData(0, 0, canvas.width, canvas.height), targetKB * 1024);
    const blob = new Blob([buffer], { type: 'image/webp' });
    addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
    return { url: URL.createObjectURL(blob), name: file.name.replace(/\.[^/.]+$/, '') + '.webp', original: file.size, compressed: blob.size };
  };

  const runBulkCompress = async () => {
    const results = [];
    for (const file of files) {
      const blob = await compressToWebp(file);
      addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
      results.push({ url: URL.createObjectURL(blob), name: file.name.replace(/\.[^/.]+$/, '') + '.webp' });
    }
    return results;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput(''); setIsBusy(true); setDownloadUrl(null);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, fileCount: files.length }),
      });
      const data = await response.json();

      if (data.type === 'function_call' && files.length === 0) {
        setMessages((prev) => [...prev, { role: 'assistant', text: "Error: No payload detected. Please mount a file first." }]);
      } else if (data.type === 'function_call' && (data.name === 'compress_to_target' || data.name === 'compress_pdf_to_target')) {
        const targetKB = Number(data.args?.targetKB) || 200;
        const result = await runCompressToTarget(targetKB);
        setDownloadUrl({ url: result.url, name: result.name, originalSize: result.original, compressedSize: result.compressed });
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Operation successful. Output package generated.' }]);
      } else if (data.type === 'function_call' && data.name === 'bulk_compress') {
        const results = await runBulkCompress();
        setMessages((prev) => [...prev, { role: 'assistant', text: `Batch execution complete. Processed ${results.length} assets.` }]);
        results.forEach((r) => {
          const link = document.createElement('a'); link.href = r.url; link.download = r.name; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        });
      } else if (data.type === 'function_call' && data.name === 'remove_blank_pages') {
        const file = files[0];
        const result = await removeBlankPages(file);
        const blob = new Blob([result.bytes as BlobPart], { type: 'application/pdf' });
        setDownloadUrl({ url: URL.createObjectURL(blob), name: file.name.replace(/\.pdf$/i, '') + '_cleaned.pdf' });
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: result.removedPages.length > 0
            ? `Purged ${result.removedPages.length} empty pages. Optimized document ready.`
            : `Verified ${result.totalPages} pages. No empty frames detected.`,
        }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.text ?? "Command not recognized." }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Network connection failed. Please retry.' }]);
    } finally {
      setIsBusy(false);
    }
  };

  const hasSizes = downloadUrl?.originalSize != null && downloadUrl?.compressedSize != null;
  const reductionPercent = hasSizes
    ? Math.round(((downloadUrl!.originalSize! - downloadUrl!.compressedSize!) / downloadUrl!.originalSize!) * 100)
    : null;
  const compressedBarPercent = hasSizes
    ? Math.max(4, Math.round((downloadUrl!.compressedSize! / downloadUrl!.originalSize!) * 100))
    : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white dark:from-[#0a0f1c] dark:via-[#050810] dark:to-black flex flex-col items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-300/20 dark:bg-purple-900/10 blur-[120px] pointer-events-none"></div>

      {/* Unmistakable Back Button */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 hover:scale-105 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to Tools
      </Link>

      {/* Main Terminal Window */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className="w-full max-w-4xl h-[85vh] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 rounded-[28px] shadow-[0_12px_40px_-18px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_40px_-18px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden"
      >
        {/* Full Screen Dropzone Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="absolute inset-0 z-50 backdrop-blur-sm bg-purple-50/90 dark:bg-[#0B0D12]/90 border-4 border-dashed border-purple-500/50 rounded-[28px] flex flex-col items-center justify-center gap-4"
            >
              <UploadIcon className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-bounce" />
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-widest">DROP TO MOUNT</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Bar */}
        <header className="h-20 shrink-0 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-5 sm:px-6 bg-slate-50/50 dark:bg-[#050810]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-inner">
              <SparkIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">AI Command Center</h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Engine Live</span>
              </div>
            </div>
          </div>

          {/* Claude's High-Visibility Mount Button (Tailwind Styled) */}
          <div className="relative overflow-hidden rounded-xl group cursor-pointer">
            <input
              type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileChange}
              aria-label="Mount files"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className={`px-5 py-2.5 transition-all duration-200 flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-widest rounded-xl shadow-sm group-hover:scale-[1.02] active:scale-95 ${
                files.length > 0
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25 border border-emerald-400'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-slate-200 hover:opacity-90'
              }`}
            >
              {files.length > 0 ? <CheckIcon className="w-4 h-4" /> : <UploadIcon className="w-4 h-4" />}
              {files.length > 0 ? `${files.length} MOUNTED` : 'MOUNT FILES'}
            </div>
          </div>
        </header>

        {/* Chat Log Workspace */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <div className="max-w-[75%] bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl rounded-tr-sm px-5 py-3 text-[15px] font-medium leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                </motion.div>
              ) : (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 items-start max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <SparkIcon className="w-4 h-4" />
                  </div>
                  <p className="text-[15px] font-medium leading-relaxed text-slate-700 dark:text-slate-300 pt-1">{msg.text}</p>
                </motion.div>
              )
            )}

            {isBusy && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <SparkIcon className="w-4 h-4" />
                </div>
                <div className="flex gap-1.5 pl-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}

            {/* Premium Download Panel */}
            {downloadUrl && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-12 mt-2">
                <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>

                  {hasSizes ? (
                    <div className="mb-6 relative z-10">
                      <div className="flex items-end justify-between mb-4">
                        <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-400">Reduction</span>
                        <span 
                          className="font-mono text-5xl font-black tabular-nums text-purple-600 dark:text-purple-400"
                          style={{ textShadow: '-2px 0px 0px rgba(0,255,255,0.4), 2px 0px 0px rgba(255,0,255,0.4)' }}
                        >
                          -{reductionPercent}%
                        </span>
                      </div>
                      <div className="space-y-3 font-mono">
                        <div>
                          <div className="flex justify-between text-[11px] tabular-nums text-slate-400 mb-1.5 uppercase font-bold tracking-wider">
                            <span>Original</span><span className="line-through">{formatBytes(downloadUrl.originalSize!)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 w-full" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] tabular-nums text-emerald-500 mb-1.5 uppercase font-bold tracking-wider">
                            <span>Target</span><span>{formatBytes(downloadUrl.compressedSize!)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${compressedBarPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">Package Ready</div>
                        <div className="font-mono text-[11px] text-slate-500 truncate">{downloadUrl.name}</div>
                      </div>
                    </div>
                  )}

                  <a
                    href={downloadUrl.url} download={downloadUrl.name}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-md relative z-10"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Download Output
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-[#050810]/50 backdrop-blur-md">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-purple-500/50 dark:focus-within:border-purple-500/50 focus-within:ring-4 focus-within:ring-purple-500/10 bg-slate-50 dark:bg-[#0B1120] px-4 transition-all shadow-inner">
            <span className="font-mono text-purple-500 font-black select-none">&gt;</span>
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isBusy}
              placeholder='ENTER COMMAND (e.g. "compress to 100KB")'
              className="flex-1 bg-transparent px-3 py-4 outline-none text-[14px] font-mono font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:opacity-50"
            />
            <div className="pr-1">
              <button
                type="submit" disabled={isBusy || !input.trim()}
                aria-label="Send command"
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2.5 rounded-xl hover:scale-105 disabled:hover:scale-100 disabled:opacity-40 transition-all flex items-center justify-center shadow-sm"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
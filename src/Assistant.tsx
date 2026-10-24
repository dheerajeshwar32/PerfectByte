import { useState, useRef, useEffect, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressToTarget, compressToWebp } from './compressionService';
import { addHistoryEntry } from './historyService';
import { removeBlankPages, compressPDF } from './pdfUtils';
import { useDocumentTitle } from './useDocumentTitle';
import Navbar from './Navbar';
import { formatBytes } from './utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface DownloadInfo {
  url: string;
  name: string;
  originalSize?: number;
  compressedSize?: number;
  targetKB?: number;
}

const EXAMPLE_CHIPS = [
  { label: '🎯 Compress to 100KB', prompt: 'compress to 100KB' },
  { label: '🏛️ Govt Portal (50KB)', prompt: 'compress for government portal under 50KB' },
  { label: '📑 Remove Blank Pages', prompt: 'remove blank pages from this PDF' },
  { label: '⚡ Bulk Optimize', prompt: 'bulk compress these files' },
];

// --- Icons -----------------------------------------------------------
const SparkIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
      text: 'SYSTEM ONLINE. Mount a file in the bay or type your goal below (e.g., "compress to 100KB" or "remove blank pages").',
    },
  ]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<DownloadInfo | null>(null);
  const [queuedIntent, setQueuedIntent] = useState<string | null>(null);
  const [lastTargetKB, setLastTargetKB] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, downloadUrl, isBusy]);

  const runCompressToTarget = async (targetKB: number, targetFiles = files) => {
    const file = targetFiles[0];
    if (!file) throw new Error('No file mounted');

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const pdfData = await compressPDF(file, 0.5);
      const blob = pdfData instanceof Blob ? pdfData : new Blob([pdfData as BlobPart], { type: 'application/pdf' });
      addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
      return {
        url: URL.createObjectURL(blob),
        name: file.name.replace(/\.[^/.]+$/, '') + '_compressed.pdf',
        original: file.size,
        compressed: blob.size,
        targetKB,
      };
    }

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context failed');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const buffer = await compressToTarget(ctx.getImageData(0, 0, canvas.width, canvas.height), targetKB * 1000);
    canvas.width = 0;
    canvas.height = 0;

    const blob = new Blob([buffer], { type: 'image/webp' });
    addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
    return {
      url: URL.createObjectURL(blob),
      name: file.name.replace(/\.[^/.]+$/, '') + '.webp',
      original: file.size,
      compressed: blob.size,
      targetKB,
    };
  };

  const runBulkCompress = async (targetFiles = files) => {
    const results = [];
    for (const file of targetFiles) {
      const blob = await compressToWebp(file);
      addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
      results.push({ url: URL.createObjectURL(blob), name: file.name.replace(/\.[^/.]+$/, '') + '.webp' });
    }
    return results;
  };

  const executeCommand = async (commandText: string, activeFiles = files) => {
    if (!commandText.trim() || isBusy) return;

    setMessages((prev) => [...prev, { role: 'user', text: commandText }]);
    setInput('');
    setIsBusy(true);
    setDownloadUrl(null);

    // If no file mounted, queue intent and trigger file picker
    if (activeFiles.length === 0) {
      setQueuedIntent(commandText);
      setIsBusy(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Command queued: "${commandText}". Opening file picker... select your document or image to proceed.`,
        },
      ]);
      fileInputRef.current?.click();
      return;
    }

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commandText, fileCount: activeFiles.length }),
      });
      const data = await response.json();

      if (data.type === 'function_call' && (data.name === 'compress_to_target' || data.name === 'compress_pdf_to_target')) {
        const targetKB = Number(data.args?.targetKB) || 200;
        setLastTargetKB(targetKB);
        const result = await runCompressToTarget(targetKB, activeFiles);
        setDownloadUrl({
          url: result.url,
          name: result.name,
          originalSize: result.original,
          compressedSize: result.compressed,
          targetKB,
        });
        setMessages((prev) => [...prev, { role: 'assistant', text: `Operation successful. Output package generated for target ${targetKB} KB.` }]);
      } else if (data.type === 'function_call' && data.name === 'bulk_compress') {
        const results = await runBulkCompress(activeFiles);
        setMessages((prev) => [...prev, { role: 'assistant', text: `Batch execution complete. Processed ${results.length} assets.` }]);
        if (results.length > 0) {
          setDownloadUrl({ url: results[0].url, name: results[0].name });
        }
      } else if (data.type === 'function_call' && data.name === 'remove_blank_pages') {
        const file = activeFiles[0];
        const result = await removeBlankPages(file);
        const blob = new Blob([result.bytes as BlobPart], { type: 'application/pdf' });
        setDownloadUrl({ url: URL.createObjectURL(blob), name: file.name.replace(/\.pdf$/i, '') + '_cleaned.pdf' });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text:
              result.removedPages.length > 0
                ? `Purged ${result.removedPages.length} empty pages. Optimized document ready.`
                : `Verified ${result.totalPages} pages. No empty frames detected.`,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.text ?? "Command not recognized." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Network connection failed. Please retry.' }]);
    } finally {
      setIsBusy(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles(selected);
      if (queuedIntent) {
        const intent = queuedIntent;
        setQueuedIntent(null);
        executeCommand(intent, selected);
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      setFiles(dropped);
      if (queuedIntent) {
        const intent = queuedIntent;
        setQueuedIntent(null);
        executeCommand(intent, dropped);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeCommand(input);
  };

  const handleNudgeTarget = async (newTargetKB: number) => {
    if (files.length === 0 || isBusy) return;
    setLastTargetKB(newTargetKB);
    setIsBusy(true);
    setMessages((prev) => [...prev, { role: 'user', text: `Adjust target to ${newTargetKB} KB` }]);
    try {
      const result = await runCompressToTarget(newTargetKB);
      setDownloadUrl({
        url: result.url,
        name: result.name,
        originalSize: result.original,
        compressedSize: result.compressed,
        targetKB: newTargetKB,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: `Adjusted target to ${newTargetKB} KB.` }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Adjustment failed. Please retry.' }]);
    } finally {
      setIsBusy(false);
    }
  };

  const hasSizes = downloadUrl?.originalSize != null && downloadUrl?.compressedSize != null;
  const reductionPercent = hasSizes
    ? Math.max(0, Math.round(((downloadUrl!.originalSize! - downloadUrl!.compressedSize!) / downloadUrl!.originalSize!) * 100))
    : null;
  const compressedBarPercent = hasSizes
    ? Math.max(4, Math.min(100, Math.round((downloadUrl!.compressedSize! / downloadUrl!.originalSize!) * 100)))
    : null;

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>

      <Navbar />

      {/* Main Terminal Window */}
      <main
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className="bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-5xl w-[calc(100%-2rem)] mx-auto flex flex-col relative overflow-hidden z-10 mt-4 h-[82vh]"
      >
        {/* Full Screen Dropzone Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="absolute inset-0 z-50 backdrop-blur-sm bg-purple-50/90 dark:bg-purple-950/30 border-4 border-dashed border-purple-500/50 dark:border-purple-400 rounded-[28px] flex flex-col items-center justify-center gap-4"
            >
              <UploadIcon className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-bounce" />
              <p className="text-2xl font-black text-indigo-900 dark:text-white tracking-widest">DROP TO MOUNT</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Bar */}
        <header className="h-20 shrink-0 border-b border-slate-100 dark:border-indigo-800/80 flex items-center justify-between px-5 sm:px-6 bg-slate-50/50 dark:bg-[#050810]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-inner">
              <SparkIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-indigo-900 dark:text-white tracking-tight leading-none mb-1.5">AI Command Center</h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5668FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5668FF]"></span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Engine Live</span>
              </div>
            </div>
          </div>

          {/* Context Pill & High-Visibility Mount Button */}
          <div className="flex items-center gap-3">
            {files.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-700 dark:text-purple-300">
                <span className="truncate max-w-[140px]">{files[0].name}</span>
                <span className="text-slate-400">({formatBytes(files[0].size)})</span>
                <button
                  type="button"
                  onClick={() => { setFiles([]); setDownloadUrl(null); }}
                  className="hover:text-red-500 font-bold ml-1"
                  aria-label="Unmount file"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="relative overflow-hidden rounded-xl group cursor-pointer">
              <input
                ref={fileInputRef}
                type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileChange}
                aria-label="Mount files"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className={`px-4 sm:px-5 py-2.5 transition-all duration-200 flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-widest rounded-xl shadow-sm group-hover:scale-[1.02] active:scale-95 ${
                  files.length > 0
                    ? 'bg-[#5668FF] text-white shadow-[#5668FF]/25 border border-[#5668FF]'
                    : 'bg-indigo-900 dark:bg-white text-white dark:text-indigo-900 border border-indigo-800 dark:border-slate-200 hover:opacity-90'
                }`}
              >
                {files.length > 0 ? <CheckIcon className="w-4 h-4" /> : <UploadIcon className="w-4 h-4" />}
                {files.length > 0 ? `${files.length} MOUNTED` : 'MOUNT FILES'}
              </div>
            </div>
          </div>
        </header>

        {/* Chat Log Workspace */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <div className="max-w-[75%] bg-indigo-900 dark:bg-white text-white dark:text-indigo-900 rounded-2xl rounded-tr-sm px-5 py-3 text-[15px] font-medium leading-relaxed shadow-sm">
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

            {/* Premium Download Panel with ± Size Stepper */}
            {downloadUrl && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-12 mt-2">
                <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>

                  {hasSizes ? (
                    <div className="mb-4 relative z-10">
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
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-indigo-800 w-full" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] tabular-nums text-[#5668FF] mb-1.5 uppercase font-bold tracking-wider">
                            <span>Achieved</span><span>{formatBytes(downloadUrl.compressedSize!)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-indigo-800 w-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#5668FF]" style={{ width: `${compressedBarPercent}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Size Stepper */}
                      {lastTargetKB !== null && (
                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                          <span className="text-slate-400">Nudge Target:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleNudgeTarget(Math.max(10, lastTargetKB - 25))}
                              disabled={isBusy}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-600 dark:text-slate-300 font-bold"
                            >
                              -25K
                            </button>
                            <span className="font-bold text-[#5668FF] px-1">{lastTargetKB}KB</span>
                            <button
                              onClick={() => handleNudgeTarget(lastTargetKB + 25)}
                              disabled={isBusy}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-600 dark:text-slate-300 font-bold"
                            >
                              +25K
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6 flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-[#5668FF]/10 text-[#5668FF] flex items-center justify-center shrink-0">
                        <CheckIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-indigo-900 dark:text-white text-sm">Package Ready</div>
                        <div className="font-mono text-[11px] text-slate-500 truncate">{downloadUrl.name}</div>
                      </div>
                    </div>
                  )}

                  <a
                    href={downloadUrl.url} download={downloadUrl.name}
                    className="w-full bg-indigo-900 dark:bg-white text-white dark:text-indigo-900 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-md relative z-10"
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

        {/* Clickable Example Prompt Chips */}
        <div className="px-5 py-2 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-indigo-800/40 bg-slate-50/30 dark:bg-[#050810]/30">
          <span className="text-[11px] font-mono text-slate-400">Examples:</span>
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => executeCommand(chip.prompt)}
              disabled={isBusy}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/70 dark:bg-indigo-950/50 border border-slate-200/60 dark:border-indigo-800/60 text-slate-600 dark:text-slate-300 hover:text-[#5668FF] dark:hover:text-[#7888FF] hover:border-[#5668FF]/40 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 dark:border-indigo-800/80 bg-white/50 dark:bg-[#050810]/50 backdrop-blur-md">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-indigo-800 focus-within:border-purple-500/50 dark:focus-within:border-purple-500/50 focus-within:ring-4 focus-within:ring-purple-500/10 bg-slate-50 dark:bg-[#0B1120] px-4 transition-all shadow-inner">
            <span className="font-mono text-purple-500 font-black select-none">&gt;</span>
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isBusy}
              placeholder='ENTER COMMAND (e.g. "compress to 100KB")'
              aria-label="Assistant command input"
              className="flex-1 bg-transparent px-3 py-4 outline-none text-[14px] font-mono font-medium text-indigo-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:opacity-50"
            />
            <div className="pr-1">
              <button
                type="submit" disabled={isBusy || !input.trim()}
                aria-label="Send command"
                className="bg-indigo-900 dark:bg-white text-white dark:text-indigo-900 p-2.5 rounded-xl hover:scale-105 disabled:hover:scale-100 disabled:opacity-40 transition-all flex items-center justify-center shadow-sm"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-center text-slate-400 mt-2 font-mono">🔒 Files never leave your device. Prompt &amp; metadata (name, size) sent to Gemini.</p>
        </form>
      </main>
    </div>
  );
}

import { useState, useRef, useEffect, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolShell from './ToolShell';
import { compressImageToTarget, compressToWebp } from './compressionService';
import { addHistoryEntry } from './historyService';
import { removeBlankPages, compressPDF } from './pdfUtils';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { haptic } from './usePWA';

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

const STARTER_INTENTS = [
  {
    icon: '🏛️',
    title: 'Compress for Govt Portal (50KB)',
    desc: 'Enforce strict 50KB upper ceiling with binary search convergence',
    prompt: 'compress for government portal under 50KB',
  },
  {
    icon: '📄',
    title: 'Shrink PDF under 100KB',
    desc: 'Compress documents for strict university and visa portals',
    prompt: 'compress to 100KB',
  },
  {
    icon: '✂️',
    title: 'Remove Blank PDF Pages',
    desc: 'Detect and eliminate empty trailing pages cleanly',
    prompt: 'remove blank pages from this PDF',
  },
  {
    icon: '⚡',
    title: 'Convert to WebP Format',
    desc: 'Convert image asset to next-gen WebP with SIMD encoding',
    prompt: 'convert to webp',
  },
];

const SUGGESTED_CHIPS = [
  { label: '🎯 Compress to 100KB', prompt: 'compress to 100KB' },
  { label: '🏛️ Govt Portal (50KB)', prompt: 'compress for government portal under 50KB' },
  { label: '📑 Remove Blank Pages', prompt: 'remove blank pages from this PDF' },
  { label: '⚡ Convert to WebP', prompt: 'convert to webp' },
];

export default function Assistant() {
  useDocumentTitle('AI Command Center');

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
      const pdfData = await compressPDF(file, 0.65);
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

    const outcome = await compressImageToTarget(file, targetKB * 1000);
    addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: outcome.blob.size });
    return {
      url: URL.createObjectURL(outcome.blob),
      name: file.name.replace(/\.[^/.]+$/, '') + '.webp',
      original: file.size,
      compressed: outcome.blob.size,
      targetKB,
    };
  };

  const executeCommand = async (commandText: string, currentFiles = files) => {
    const trimmed = commandText.trim();
    if (!trimmed || isBusy) return;

    if (currentFiles.length === 0) {
      setQueuedIntent(trimmed);
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: trimmed },
        { role: 'assistant', text: `Intent captured: "${trimmed}". Please select a file to execute this action locally.` },
      ]);
      setInput('');
      fileInputRef.current?.click();
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsBusy(true);
    setDownloadUrl(null);
    haptic(10);

    const file = currentFiles[0];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          fileMeta: { name: file.name, type: file.type, size: file.size },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setMessages((prev) => [...prev, { role: 'assistant', text: 'Rate limit reached. Please wait a minute and retry.' }]);
          return;
        }
        throw new Error('API request failed');
      }

      const data = await res.json();

      if (data.tool === 'compressToTarget') {
        const kb = Number(data.args?.targetKB) || 100;
        setLastTargetKB(kb);
        setMessages((prev) => [...prev, { role: 'assistant', text: `Executing local binary search to compress ${file.name} to under ${kb} KB...` }]);
        const result = await runCompressToTarget(kb, currentFiles);
        setDownloadUrl({
          url: result.url,
          name: result.name,
          originalSize: result.original,
          compressedSize: result.compressed,
          targetKB: kb,
        });
        haptic([12, 40, 20]);
        setMessages((prev) => [...prev, { role: 'assistant', text: `Finished! Output converged to ${formatBytes(result.compressed)}.` }]);
      } else if (data.tool === 'compressToWebp') {
        setMessages((prev) => [...prev, { role: 'assistant', text: `Converting ${file.name} to WebP via local SIMD codec...` }]);
        const blob = await compressToWebp(file);
        const url = URL.createObjectURL(blob);
        addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
        setDownloadUrl({
          url,
          name: file.name.replace(/\.[^/.]+$/, '') + '.webp',
          originalSize: file.size,
          compressedSize: blob.size,
        });
        haptic([12, 40, 20]);
        setMessages((prev) => [...prev, { role: 'assistant', text: `Converted to WebP: ${formatBytes(blob.size)}.` }]);
      } else if (data.tool === 'removeBlankPages') {
        if (!isPdf) {
          setMessages((prev) => [...prev, { role: 'assistant', text: 'Blank page removal is only available for PDF documents.' }]);
          return;
        }
        setMessages((prev) => [...prev, { role: 'assistant', text: `Scanning ${file.name} for blank pages via local PDF-lib...` }]);
        const { bytes } = await removeBlankPages(file);
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
        setDownloadUrl({
          url,
          name: file.name.replace(/\.[^/.]+$/, '') + '_cleaned.pdf',
          originalSize: file.size,
          compressedSize: blob.size,
        });
        haptic([12, 40, 20]);
        setMessages((prev) => [...prev, { role: 'assistant', text: `Removed blank pages. Cleaned PDF is ready for download.` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.text ?? 'Command processed.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Connection issue. Please retry with your file.' }]);
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
      haptic([12, 40, 20]);
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

  // ─── Left Canvas Stage (Raycast / Linear AI Studio Console) ───
  const canvasContent = (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      className={`flex flex-col h-[600px] w-full rounded-2xl border transition-all overflow-hidden relative shadow-xs ${
        isDragging
          ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/5'
          : 'border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02] backdrop-blur-md'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Mount files"
      />

      {/* ─── Integrated Context Bar at Top of Console ─── */}
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-100/60 dark:bg-white/[0.03] flex items-center justify-between gap-3 text-xs font-mono">
        {files.length > 0 ? (
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{files[0].name}</span>
            <span className="text-[11px] text-slate-400">({formatBytes(files[0].size)})</span>
            <button
              onClick={() => { setFiles([]); setDownloadUrl(null); }}
              className="text-slate-400 hover:text-rose-500 ml-1 font-bold text-xs"
              title="Unmount file"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold"
          >
            <span className="text-sm">+</span>
            <span>Mount File for Local WASM Execution</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <span>🔒 Local-First AI</span>
        </div>
      </div>

      {/* ─── Main Console Stage ─── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans">
        {/* If chat is empty, show 2x2 Interactive Starter Intent Cards */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center py-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto mb-3 text-xl shadow-xs">
                ✦
              </div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                AI Natural Language Command Console
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Type what you need or click an intent card below. Compression runs 100% locally in your browser.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
              {STARTER_INTENTS.map((intent) => (
                <button
                  key={intent.title}
                  type="button"
                  onClick={() => executeCommand(intent.prompt)}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] hover:border-purple-400/50 hover:bg-purple-500/5 transition-all text-left flex flex-col justify-between group shadow-xs cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">{intent.icon}</span>
                    <span className="text-purple-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Run →
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">
                    {intent.title}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {intent.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <div className="max-w-[80%] bg-[#5668FF] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                </motion.div>
              ) : (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✦
                  </div>
                  <div className="text-xs sm:text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 pt-0.5">
                    {msg.text}
                  </div>
                </motion.div>
              )
            )}

            {isBusy && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center text-xs">
                  ✦
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </motion.div>
            )}

            {/* Output Download Card */}
            {downloadUrl && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-10 my-2">
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] space-y-3 max-w-sm shadow-md">
                  {hasSizes && (
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">REDUCTION</span>
                        <span className="text-3xl font-black font-mono tabular-nums text-purple-600 dark:text-purple-400 block">
                          -{reductionPercent}%
                        </span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="text-slate-400 line-through block">{formatBytes(downloadUrl.originalSize!)}</span>
                        <span className="font-bold text-emerald-500">{formatBytes(downloadUrl.compressedSize!)}</span>
                      </div>
                    </div>
                  )}

                  {lastTargetKB !== null && (
                    <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-200/60 dark:border-white/10">
                      <span className="text-slate-400">Stepper:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleNudgeTarget(Math.max(10, lastTargetKB - 25))}
                          disabled={isBusy}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-xs font-bold"
                        >
                          -25K
                        </button>
                        <span className="font-bold text-[#5668FF]">{lastTargetKB}KB</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeTarget(lastTargetKB + 25)}
                          disabled={isBusy}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-xs font-bold"
                        >
                          +25K
                        </button>
                      </div>
                    </div>
                  )}

                  <a
                    href={downloadUrl.url}
                    download={downloadUrl.name}
                    className="w-full py-2.5 rounded-lg font-bold text-xs font-mono bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-center block transition-all shadow-xs"
                  >
                    Download Output ({downloadUrl.name})
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Floating Command Input Dock ─── */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.04]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBusy}
            placeholder='Type a command (e.g. "compress to 100KB" or "remove blank pages")...'
            className="flex-1 px-4 py-2.5 text-xs font-mono rounded-xl outline-none border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white transition-all"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="px-4 py-2.5 bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 shadow-xs cursor-pointer"
          >
            Run ↵
          </button>
        </div>
      </form>
    </div>
  );

  // ─── Right Precision Inspector Console (5 Columns) ───
  const inspectorContent = (
    <div className="space-y-5">
      {/* Mounted File Card */}
      <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-md shadow-xs space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
          MOUNTED FILE CONTEXT
        </span>

        {files.length > 0 ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 text-xs font-mono">
            <div className="truncate pr-2">
              <span className="font-bold text-slate-800 dark:text-white block truncate">{files[0].name}</span>
              <span className="text-slate-400 text-[10px]">{formatBytes(files[0].size)}</span>
            </div>
            <button
              type="button"
              onClick={() => { setFiles([]); setDownloadUrl(null); }}
              className="px-2 py-1 rounded text-rose-500 hover:bg-rose-500/10 font-bold text-xs"
              aria-label="Unmount file"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 transition-colors text-center cursor-pointer"
          >
            + Click or drop file to mount
          </button>
        )}
      </div>

      {/* Suggested Quick Intents */}
      <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] shadow-xs space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
          SUGGESTED INTENTS
        </span>
        <div className="space-y-1.5">
          {SUGGESTED_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => executeCommand(chip.prompt)}
              disabled={isBusy}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-mono text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between border border-slate-200/60 dark:border-white/10"
            >
              <span className="truncate">{chip.label}</span>
              <span className="text-purple-500 font-bold">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee Panel */}
      <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5 text-xs font-mono text-slate-600 dark:text-slate-400">
        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
          <span>🔒 Local-First AI Safety</span>
        </span>
        <p className="text-[11px] leading-relaxed">
          Files are compressed locally via in-browser WASM memory. Only intent text and metadata (name, size) are routed through Gemini.
        </p>
      </div>
    </div>
  );

  return (
    <ToolShell
      title="AI Command Center"
      accentColor="bg-purple-500"
      badgeText="GEMINI ROUTING"
      canvas={canvasContent}
      inspector={inspectorContent}
    />
  );
}

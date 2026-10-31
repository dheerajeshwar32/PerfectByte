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

const EXAMPLE_CHIPS = [
  { label: '🎯 Compress to 100KB', prompt: 'compress to 100KB' },
  { label: '🏛️ Govt Portal (50KB)', prompt: 'compress for government portal under 50KB' },
  { label: '📑 Remove Blank Pages', prompt: 'remove blank pages from this PDF' },
  { label: '⚡ Bulk Optimize', prompt: 'bulk compress these files' },
];

export default function Assistant() {
  useDocumentTitle('AI Command Center');

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'SYSTEM ONLINE. Mount a file or type your goal below (e.g. "compress to 100KB" or "remove blank pages").',
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
        { role: 'assistant', text: `Got it: "${trimmed}". Please select a file to execute this action on.` },
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
        setMessages((prev) => [...prev, { role: 'assistant', text: `Optimizing ${file.name} to under ${kb} KB...` }]);
        const result = await runCompressToTarget(kb, currentFiles);
        setDownloadUrl({
          url: result.url,
          name: result.name,
          originalSize: result.original,
          compressedSize: result.compressed,
          targetKB: kb,
        });
        haptic([12, 40, 20]);
        setMessages((prev) => [...prev, { role: 'assistant', text: `Finished. Output size: ${formatBytes(result.compressed)}.` }]);
      } else if (data.tool === 'compressToWebp') {
        setMessages((prev) => [...prev, { role: 'assistant', text: `Converting ${file.name} to WebP...` }]);
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
        setMessages((prev) => [...prev, { role: 'assistant', text: `Analyzing ${file.name} for blank pages...` }]);
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
        setMessages((prev) => [...prev, { role: 'assistant', text: `Removed blank pages. Cleaned PDF is ready.` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.text ?? 'Command not recognized.' }]);
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

  // ─── Canvas Content ───
  const canvasContent = (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      className={`flex flex-col h-[75dvh] w-full max-w-2xl mx-auto pb-panel rounded-2xl overflow-hidden relative border transition-colors ${
        isDragging ? 'border-[#5668FF] ring-2 ring-[#5668FF]/30' : 'border-[var(--pb-border)]'
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

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) =>
            msg.role === 'user' ? (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <div className="max-w-[80%] bg-[#5668FF] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm font-medium leading-relaxed shadow-sm">
                  {msg.text}
                </div>
              </motion.div>
            ) : (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  ✦
                </div>
                <div className="text-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300 pt-0.5">
                  {msg.text}
                </div>
              </motion.div>
            )
          )}

          {isBusy && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                ✦
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}

          {/* Result Card */}
          {downloadUrl && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-10 my-2">
              <div className="pb-control p-4 rounded-xl border border-[var(--pb-border)] space-y-3 max-w-sm">
                {hasSizes && (
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400">REDUCTION</span>
                      <span className="text-3xl font-black font-mono tabular-nums text-[#5668FF] block">
                        -{reductionPercent}%
                      </span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-zinc-400 line-through block">{formatBytes(downloadUrl.originalSize!)}</span>
                      <span className="font-bold text-emerald-500">{formatBytes(downloadUrl.compressedSize!)}</span>
                    </div>
                  </div>
                )}

                {lastTargetKB !== null && (
                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[var(--pb-border)]">
                    <span className="text-zinc-400">Stepper:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleNudgeTarget(Math.max(10, lastTargetKB - 25))}
                        disabled={isBusy}
                        className="px-2 py-0.5 rounded pb-panel hover:bg-zinc-300 dark:hover:bg-zinc-700"
                      >
                        -25K
                      </button>
                      <span className="font-bold text-[#5668FF]">{lastTargetKB}KB</span>
                      <button
                        type="button"
                        onClick={() => handleNudgeTarget(lastTargetKB + 25)}
                        disabled={isBusy}
                        className="px-2 py-0.5 rounded pb-panel hover:bg-zinc-300 dark:hover:bg-zinc-700"
                      >
                        +25K
                      </button>
                    </div>
                  </div>
                )}

                <a
                  href={downloadUrl.url}
                  download={downloadUrl.name}
                  className="w-full py-2.5 rounded-lg font-bold text-xs font-mono bg-[#5668FF] hover:bg-[#4858E0] text-white text-center block transition-all"
                >
                  Download Output ({downloadUrl.name})
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--pb-border)] bg-[var(--pb-control)]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBusy}
            placeholder='Type command (e.g. "compress to 100KB" or "remove blank pages")'
            className="flex-1 pb-panel px-3.5 py-2.5 text-xs font-mono rounded-xl outline-none border border-[var(--pb-border)] focus:border-[#5668FF] text-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="px-4 py-2.5 bg-[#5668FF] hover:bg-[#4858E0] text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40"
          >
            Run
          </button>
        </div>
      </form>
    </div>
  );

  // ─── Inspector Content ───
  const inspectorContent = (
    <div className="space-y-4">
      {/* Mounted File Card */}
      <div className="pb-panel p-4 rounded-2xl space-y-2.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
          MOUNTED FILE CONTEXT
        </span>
        {files.length > 0 ? (
          <div className="flex items-center justify-between pb-control p-2.5 rounded-xl text-xs font-mono">
            <div className="truncate pr-2">
              <span className="font-bold text-zinc-900 dark:text-white block truncate">{files[0].name}</span>
              <span className="text-zinc-400 text-[10px]">{formatBytes(files[0].size)}</span>
            </div>
            <button
              type="button"
              onClick={() => { setFiles([]); setDownloadUrl(null); }}
              className="px-2 py-1 rounded text-red-500 hover:bg-red-500/10 font-bold"
              aria-label="Unmount file"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 rounded-xl border border-dashed border-[var(--pb-border)] text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-center"
          >
            + Click or drop file to mount
          </button>
        )}
      </div>

      {/* Quick Example Prompts */}
      <div className="pb-panel p-4 rounded-2xl space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
          SUGGESTED INTENTS
        </span>
        <div className="space-y-1.5">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => executeCommand(chip.prompt)}
              disabled={isBusy}
              className="w-full text-left px-3 py-2 rounded-xl pb-control text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-between"
            >
              <span className="truncate">{chip.label}</span>
              <span className="text-[#5668FF]">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="pb-panel p-3.5 rounded-xl space-y-1 text-xs font-mono text-zinc-500">
        <span className="text-emerald-500 font-bold block">🔒 Local-First AI Safety</span>
        <p className="text-[11px] leading-relaxed">
          Files are compressed locally via WASM. Only command text and file metadata (name, size) are sent to Gemini.
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

import { useState, useRef, useEffect, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import ToolShell from './ToolShell';
import { compressImageToTarget } from './compressionService';
import { compressPDF, removeBlankPages } from './pdfUtils';
import { addHistoryEntry } from './historyService';
import { formatBytes } from './utils';
import { useDocumentTitle } from './useDocumentTitle';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from './usePWA';
import {
  Sparkles,
  Landmark,
  FileText,
  Scissors,
  Zap,
  ShieldCheck,
  Terminal,
  Upload,
  X,
  ArrowRight,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface DownloadState {
  url: string;
  name: string;
  originalSize?: number;
  compressedSize?: number;
  targetKB?: number;
}

const STARTER_INTENTS = [
  {
    icon: Landmark,
    title: 'Compress for Govt Portal (50KB)',
    desc: 'Shrink your file under 50 KB for official forms',
    prompt: 'compress for government portal under 50KB',
  },
  {
    icon: FileText,
    title: 'Shrink PDF under 100KB',
    desc: 'Make any PDF small enough for portal uploads',
    prompt: 'compress to 100KB',
  },
  {
    icon: Scissors,
    title: 'Remove Blank PDF Pages',
    desc: 'Automatically find and delete empty pages',
    prompt: 'remove blank pages from this PDF',
  },
  {
    icon: Zap,
    title: 'Convert to WebP Format',
    desc: 'Convert images to modern, lightweight WebP',
    prompt: 'convert to webp',
  },
];

const CHEAT_SHEET_COMMANDS = [
  { label: 'compress to 85KB', desc: 'Shrinks file to exact size' },
  { label: 'strip blank pages', desc: 'Deletes empty pages' },
  { label: 'resize to 1080x1080', desc: 'Changes width and height' },
  { label: 'shrink PDF under 200KB', desc: 'Fits PDF under portal limit' },
];

export default function Assistant() {
  useDocumentTitle('AI Command Center');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<DownloadState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queuedIntent, setQueuedIntent] = useState<string | null>(null);
  const [lastTargetKB, setLastTargetKB] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

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
      name: file.name.replace(/\.[^/.]+$/, '') + '_compressed.webp',
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
      fileInputRef.current?.click();
      toast.info('Please mount a file first to execute this command.');
      return;
    }

    const file = currentFiles[0];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsBusy(true);

    try {
      const metadata = currentFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      }));

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, files: metadata }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (data.tool === 'compressToTarget') {
        const targetKB = data.args?.targetSizeKB ?? 100;
        setLastTargetKB(targetKB);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `Compressing ${file.name} to strict cap ${targetKB} KB via local WASM...` },
        ]);

        const result = await runCompressToTarget(targetKB, currentFiles);
        setDownloadUrl({
          url: result.url,
          name: result.name,
          originalSize: result.original,
          compressedSize: result.compressed,
          targetKB,
        });

        haptic([12, 40, 20]);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Target reached: ${formatBytes(result.compressed)} (Cap: ${targetKB} KB). Output ready below.`,
          },
        ]);
      } else if (data.tool === 'convertToWebp') {
        setMessages((prev) => [...prev, { role: 'assistant', text: `Converting ${file.name} to WebP...` }]);
        const outcome = await compressImageToTarget(file, file.size);
        const blob = outcome.blob;
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
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Removed blank pages. Cleaned PDF is ready for download.' }]);
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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Adjusted target to ${newTargetKB} KB (${formatBytes(result.compressed)}).` },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `Failed: ${(err as Error).message}` }]);
    } finally {
      setIsBusy(false);
    }
  };

  const hasSizes = downloadUrl?.originalSize && downloadUrl?.compressedSize;
  const reductionPercent = hasSizes
    ? Math.round((1 - downloadUrl.compressedSize! / downloadUrl.originalSize!) * 100)
    : 0;

  // ─── Left Command Console (7 Columns) ───
  const canvasContent = (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col h-[600px] w-full rounded-2xl border transition-all overflow-hidden relative shadow-xs ${
        isDragging
          ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/5'
          : 'border-[#E2E8F8] dark:border-[#262E5A] bg-white/60 dark:bg-[#151A36]/90 backdrop-blur-md'
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
      <div className="px-4 py-3 border-b border-[#E2E8F8] dark:border-[#252D58] bg-[#EEF2FF]/60 dark:bg-[#11152B]/90 flex items-center justify-between gap-3 text-xs font-mono">
        {files.length > 0 ? (
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-[#2D325A] dark:text-[#F0F4FF] truncate">{files[0].name}</span>
            <span className="text-[11px] text-[#5A628A] dark:text-[#9BA6D1]">({formatBytes(files[0].size)})</span>
            <button
              onClick={() => { setFiles([]); setDownloadUrl(null); }}
              className="text-[#5A628A] hover:text-rose-500 ml-1 font-bold text-xs cursor-pointer"
              title="Unmount file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-[#5268FF] hover:text-[#4256E8] font-semibold cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Attach a file for AI editing</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#5268FF] bg-[#EEF2FF] dark:bg-[#1E264D] px-2.5 py-0.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Private AI Assistant</span>
        </div>
      </div>

      {/* ─── Main Console Stage (Zero Grey Scrollbars) ─── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans [&::-webkit-scrollbar]:hidden scrollbar-none">
        {/* If chat is empty, show 2x2 Interactive Starter Intent Cards */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center py-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#5268FF] border border-[#C7D4FF] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Sparkles className="w-6 h-6 text-[#5268FF]" />
              </div>
              <h4 className="text-lg font-bold text-[#2D325A] dark:text-slate-100 mb-1">
                Tell PerfectByte what you need
              </h4>
              <p className="text-xs text-[#5A628A] dark:text-slate-400 max-w-sm mx-auto">
                Pick a quick action below or type what you want in plain English.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
              {STARTER_INTENTS.map((intent) => {
                const IconComp = intent.icon;
                return (
                  <button
                    key={intent.title}
                    type="button"
                    onClick={() => executeCommand(intent.prompt)}
                    className="p-3.5 rounded-xl border border-[#E2E8F8] dark:border-[#2B3566] bg-white/80 dark:bg-[#1B2244] hover:border-[#5268FF]/50 hover:bg-[#EEF2FF]/40 dark:hover:bg-[#232C56] transition-all text-left flex flex-col justify-between group shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] dark:bg-[#151A36] text-[#5268FF] flex items-center justify-center">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[#5268FF] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <span>Run</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[#2D325A] dark:text-[#F0F4FF] mb-1">
                      {intent.title}
                    </div>
                    <div className="text-[11px] text-[#848DB3] dark:text-[#6E78A3] leading-tight">
                      {intent.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <div className="max-w-[80%] bg-[#5268FF] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                </motion.div>
              ) : (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] border border-[#C7D4FF] text-[#5268FF] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs sm:text-sm font-medium leading-relaxed text-[#2D325A] dark:text-slate-300 pt-0.5">
                    {msg.text}
                  </div>
                </motion.div>
              )
            )}

            {isBusy && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#5268FF] flex items-center justify-center text-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5268FF] animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5268FF] animate-bounce [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5268FF] animate-bounce [animation-delay:300ms]" />
                </div>
              </motion.div>
            )}

            {/* Output Download Card */}
            {downloadUrl && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-10 my-2">
                <div className="p-4 rounded-xl border border-[#E2E8F8] dark:border-white/10 bg-white/80 dark:bg-white/[0.04] space-y-3 max-w-sm shadow-md">
                  {hasSizes && (
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#848DB3] font-bold">REDUCTION</span>
                        <span className="text-3xl font-black font-mono tabular-nums text-[#5268FF] block">
                          -{reductionPercent}%
                        </span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="text-[#848DB3] line-through block">{formatBytes(downloadUrl.originalSize!)}</span>
                        <span className="font-bold text-emerald-500">{formatBytes(downloadUrl.compressedSize!)}</span>
                      </div>
                    </div>
                  )}

                  {lastTargetKB !== null && (
                    <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#E2E8F8] dark:border-white/10">
                      <span className="text-[#848DB3]">Stepper:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleNudgeTarget(Math.max(10, lastTargetKB - 25))}
                          disabled={isBusy}
                          className="px-2 py-0.5 rounded bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-white/10 text-xs font-bold text-[#2D325A] dark:text-white cursor-pointer"
                        >
                          -25K
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNudgeTarget(lastTargetKB + 25)}
                          disabled={isBusy}
                          className="px-2 py-0.5 rounded bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-white/10 text-xs font-bold text-[#2D325A] dark:text-white cursor-pointer"
                        >
                          +25K
                        </button>
                      </div>
                    </div>
                  )}

                  <a
                    href={downloadUrl.url}
                    download={downloadUrl.name}
                    className="w-full py-2.5 bg-[#5268FF] hover:bg-[#4256E8] text-white font-mono font-bold text-xs rounded-lg text-center block shadow-xs transition-all"
                  >
                    Download {downloadUrl.name}
                  </a>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </AnimatePresence>
        )}
      </div>

      {/* ─── Floating Command Input Dock ─── */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#E2E8F8] dark:border-[#252D58] bg-slate-100/70 dark:bg-[#11152B]/90">
        <div className="flex items-center gap-2">
          <input
            ref={commandInputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBusy}
            placeholder='Type a command (e.g. "compress to 100KB" or "remove blank pages")...'
            className="flex-1 px-4 py-2.5 text-base md:text-sm font-mono rounded-xl outline-none border border-[#E2E8F8] dark:border-[#2B3566] bg-white dark:bg-[#1B2244] focus:border-[#5268FF] focus:ring-2 focus:ring-[#5268FF]/20 text-[#2D325A] dark:text-[#F0F4FF] transition-all"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="h-12 md:h-10 px-4 bg-[#5268FF] hover:bg-[#4256E8] text-white rounded-xl text-xs font-mono font-bold transition-all shadow-[0_6px_20px_rgba(82,104,255,0.3)] disabled:bg-[#E8EEFF] disabled:text-[#5268FF]/70 disabled:border disabled:border-[#C7D4FF] disabled:shadow-none dark:disabled:bg-[#1E264D] dark:disabled:text-[#7C8EE8] dark:disabled:border-[#2E3B75] disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0"
          >
            Run ↵
          </button>
        </div>
      </form>
    </div>
  );

  // ─── Right Precision Inspector: Live AI Execution & Pipeline Inspector ───
  const inspectorContent = (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* 1. Mounted Payload Inspector Card */}
      <div className="p-5 rounded-2xl border border-[#E2E8F8] dark:border-[#252D58] bg-white/95 dark:bg-[#151A36] backdrop-blur-md shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#848DB3] font-bold block">
            SELECTED FILE
          </span>
          {files.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              READY
            </span>
          )}
        </div>

        {files.length > 0 ? (
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#EEF2FF]/60 dark:bg-[#1B2244] border border-[#E2E8F8] dark:border-[#2B3566] space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#848DB3]">File Name</span>
                <span className="font-bold text-[#2D325A] dark:text-[#F0F4FF] truncate max-w-[150px]">
                  {files[0].name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#848DB3]">Size</span>
                <span className="font-semibold text-[#5A628A] dark:text-[#9BA6D1]">
                  {formatBytes(files[0].size)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#848DB3]">Format</span>
                <span className="font-semibold text-[#5A628A] dark:text-[#9BA6D1]">
                  {files[0].type || 'Binary Document'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setFiles([]); setDownloadUrl(null); }}
              className="w-full py-2 text-xs font-mono text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg transition-colors text-center cursor-pointer font-semibold"
            >
              Remove File
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 px-4 rounded-xl border-2 border-dashed border-[#C7D4FF] dark:border-[#334185] hover:border-[#5268FF] text-xs font-mono text-[#5268FF] bg-[#EEF2FF]/40 hover:bg-[#EEF2FF] dark:bg-[#1B2244] dark:hover:bg-[#232C56] transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-5 h-5 text-[#5268FF]" />
            <span className="font-bold">Drop or click to attach a file</span>
            <span className="text-[10px] text-[#848DB3] dark:text-[#6E78A3]">PDF, PNG, JPEG, WebP</span>
          </button>
        )}
      </div>

      {/* 2. Quick Parameter Overrides / Command Cheat-Sheet Card */}
      <div className="p-5 rounded-2xl border border-[#E2E8F8] dark:border-[#252D58] bg-white/95 dark:bg-[#151A36] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#2D325A] dark:text-[#F0F4FF] font-bold block">
            EXAMPLE COMMANDS
          </span>
          <Terminal className="w-3.5 h-3.5 text-[#5A628A] dark:text-[#9BA6D1]" />
        </div>

        <div className="space-y-1.5">
          {CHEAT_SHEET_COMMANDS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setInput(item.label);
                commandInputRef.current?.focus();
                haptic(8);
              }}
              className="w-full text-left p-2.5 rounded-xl bg-[#EEF2FF]/50 hover:bg-[#EEF2FF] dark:bg-[#1B2244] dark:hover:bg-[#232C56] dark:hover:border-[#5268FF]/30 text-xs font-mono transition-all flex items-center justify-between border border-[#E2E8F8] dark:border-[#2B3566] group cursor-pointer"
            >
              <div>
                <span className="font-bold text-[#2D325A] dark:text-[#F0F4FF] group-hover:text-[#5268FF] block">
                  &quot;{item.label}&quot;
                </span>
                <span className="text-[10px] text-[#848DB3] dark:text-[#6E78A3] block">{item.desc}</span>
              </div>
              <span className="text-[10px] text-[#5268FF] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                + Fill
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <ToolShell
      title="AI Command Center"
      accentColor="bg-[#5268FF]"
      badgeText="GEMINI AI"
      canvas={canvasContent}
      inspector={inspectorContent}
    />
  );
}

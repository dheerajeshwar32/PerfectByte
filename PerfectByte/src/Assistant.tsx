import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { compressToTarget, compressToWebp } from './compressionService';
import { addHistoryEntry } from './historyService';
import { removeBlankPages, compressPDF } from './pdfUtils';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export default function Assistant() {
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Upload an image or PDF, then tell me what you need — try "make this smaller", "compress this to 100KB", or "remove blank pages".',
    },
  ]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<{ url: string; name: string } | null>(null);

  const runCompressToTarget = async (targetKB: number) => {
    const file = files[0];
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context failed');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const buffer = await compressToTarget(imageData, targetKB * 1024);
    const blob = new Blob([buffer], { type: 'image/webp' });

    addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });

    return {
      url: URL.createObjectURL(blob),
      name: file.name.replace(/\.[^/.]+$/, '') + '.webp',
      original: file.size,
      compressed: blob.size,
    };
  };

  const runBulkCompress = async () => {
    const results = [];
    for (const file of files) {
      const blob = await compressToWebp(file);
      addHistoryEntry({ fileName: file.name, originalSize: file.size, compressedSize: blob.size });
      results.push({
        url: URL.createObjectURL(blob),
        name: file.name.replace(/\.[^/.]+$/, '') + '.webp',
      });
    }
    return results;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsBusy(true);
    setDownloadUrl(null); 

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, fileCount: files.length }),
      });
      const data = await response.json();

      if (data.type === 'function_call' && files.length === 0) {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Upload a file first, then ask me again.' }]);
      
      } else if (data.type === 'function_call' && data.name === 'compress_to_target') {
        const file = files[0];
        // Guard clause: Prevent image functions from running on PDFs
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
           setMessages(prev => [...prev, { role: 'assistant', text: 'Exact KB targeting is only available for images right now. However, I can run a deep general compression on this PDF! Just ask me to "compress this PDF".' }]);
           setIsBusy(false);
           return;
        }

        const targetKB = Number(data.args?.targetKB) || 200;
        const result = await runCompressToTarget(targetKB);
        setDownloadUrl({ url: result.url, name: result.name });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Done — compressed to ${(result.compressed / 1024).toFixed(1)}KB (from ${(result.original / 1024).toFixed(1)}KB). Download link is below.`,
          },
        ]);

      } else if (data.type === 'function_call' && data.name === 'bulk_compress') {
        // Guard clause: Prevent bulk compression if any PDFs are in the queue
        const hasPdf = files.some(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (hasPdf) {
           setMessages(prev => [...prev, { role: 'assistant', text: 'Bulk compression is currently built for image folders. To compress a PDF, upload it individually and ask me to compress it.' }]);
           setIsBusy(false);
           return;
        }

        const results = await runBulkCompress();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `Compressed all ${results.length} images — downloading now.` },
        ]);
        results.forEach((r) => {
          const link = document.createElement('a');
          link.href = r.url;
          link.download = r.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });

      } else if (data.type === 'function_call' && data.name === 'remove_blank_pages') {
        const file = files[0];
        if (!file || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
           setMessages(prev => [...prev, { role: 'assistant', text: 'Please upload a PDF document to remove blank pages.' }]);
           setIsBusy(false);
           return;
        }

        const result = await removeBlankPages(file);
        const blob = new Blob([result.bytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const name = file.name.replace(/\.pdf$/i, '') + '_cleaned.pdf';
        setDownloadUrl({ url, name });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text:
              result.removedPages.length > 0
                ? `Removed ${result.removedPages.length} blank page${result.removedPages.length !== 1 ? 's' : ''} out of ${result.totalPages}. Download link is below.`
                : `Checked all ${result.totalPages} pages — didn't find any that looked blank, so here's your file unchanged.`,
          },
        ]);

      } else if (data.type === 'function_call' && data.name === 'compress_pdf') {
        const file = files[0];
        if (!file || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
           setMessages(prev => [...prev, { role: 'assistant', text: 'Please upload a PDF file first.' }]);
           setIsBusy(false);
           return;
        }
        
        const resultBlob = await compressPDF(file);
        const url = URL.createObjectURL(resultBlob);
        const name = file.name.replace(/\.pdf$/i, '') + '_compressed.pdf';
        
        setDownloadUrl({ url, name });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Done! I deeply compressed your PDF from ${(file.size / 1024 / 1024).toFixed(2)}MB down to ${(resultBlob.size / 1024 / 1024).toFixed(2)}MB. Download link is below.`,
          },
        ]);

      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.text ?? 'Something went wrong.' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Something went wrong — try again.' }]);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden transition-colors duration-150">
      
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-200/30 dark:bg-violet-900/20 blur-[120px] pointer-events-none transition-colors duration-150"></div>

      <Link to="/" className="mb-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white self-start max-w-3xl w-full mx-auto font-medium transition-colors flex items-center gap-2 relative z-10">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Tools
      </Link>

      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800 max-w-3xl w-full flex flex-col h-[700px] relative z-10 transition-colors duration-150">
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-violet-500 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"></path></svg>
          AI File Assistant
        </h2>

        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-6 bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-150"
        >
          <input
            type="file"
            multiple
            accept="image/jpeg, image/png, image/webp, application/pdf"
            onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
            className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-900 dark:file:bg-slate-100 file:text-white dark:file:text-slate-900 hover:file:bg-slate-800 dark:hover:file:bg-white transition-colors file:cursor-pointer"
          />
          <AnimatePresence>
            {files.length > 0 && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }} 
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 overflow-hidden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                {files.length} file{files.length !== 1 ? 's' : ''} ready for processing
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm transition-colors duration-150 ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 dark:bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            
            {isBusy && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="flex w-full justify-start"
              >
                <div className="max-w-[70%] md:max-w-[50%] w-full px-5 py-4 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors duration-150">
                  <motion.div
                    className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/60 dark:via-slate-700/50 to-transparent w-full"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  />
                  <div className="space-y-3 relative z-0">
                    <div className="h-2.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full w-3/4"></div>
                    <div className="h-2.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full w-full"></div>
                    <div className="h-2.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full w-5/6"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {downloadUrl && (
            <motion.a
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.4 }}
              href={downloadUrl.url}
              download={downloadUrl.name}
              className="mb-4 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors text-sm font-bold shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download {downloadUrl.name}
            </motion.a>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-150">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try "compress to 100KB" or "remove blank pages"'
            disabled={isBusy}
            className="flex-1 bg-transparent px-4 py-2 outline-none text-[15px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 transition-all shadow-sm flex items-center gap-2"
          >
            Send
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
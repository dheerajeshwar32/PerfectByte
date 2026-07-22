import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { compressToTarget, compressToWebp } from './compressionService';
import { addHistoryEntry } from './historyService';
import { removeBlankPages } from './pdfUtils';

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

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, fileCount: files.length }),
      });
      const data = await response.json();

      if (data.type === 'function_call' && files.length === 0) {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Upload an image first, then ask me again.' }]);
      } else if (data.type === 'function_call' && data.name === 'compress_to_target') {
        const targetKB = Number(data.args?.targetKB) || 200;
        const result = await runCompressToTarget(targetKB);
        if (downloadUrl) URL.revokeObjectURL(downloadUrl.url);
        setDownloadUrl({ url: result.url, name: result.name });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Done — compressed to ${(result.compressed / 1024).toFixed(1)}KB (from ${(result.original / 1024).toFixed(1)}KB). Download link is below.`,
          },
        ]);
      } else if (data.type === 'function_call' && data.name === 'bulk_compress') {
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
        const result = await removeBlankPages(file);
        const blob = new Blob([result.bytes as BlobPart], { type: 'application/pdf' });
        if (downloadUrl) URL.revokeObjectURL(downloadUrl.url);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Link to="/" className="mb-8 text-blue-500 hover:underline self-start max-w-2xl w-full mx-auto font-medium">
        &larr; Back to Tools
      </Link>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full flex flex-col h-[600px]">
        <h2 className="text-xl font-bold text-gray-800 mb-4">AI File Assistant</h2>

        <div className="mb-4">
          <input
            type="file"
            multiple
            accept="image/jpeg, image/png, image/webp, application/pdf"
            onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {files.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {files.length} file{files.length !== 1 ? 's' : ''} ready
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isBusy && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-500">Thinking...</div>
            </div>
          )}
        </div>

        {downloadUrl && (
          <a
            href={downloadUrl.url}
            download={downloadUrl.name}
            className="mb-3 block text-center bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition-colors text-sm font-medium"
          >
            Download {downloadUrl.name}
          </a>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try "make this smaller" or "remove blank pages"'
            disabled={isBusy}
            className="flex-1 border border-gray-300 px-4 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

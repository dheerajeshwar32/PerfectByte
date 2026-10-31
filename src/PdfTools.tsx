import React, { useState } from 'react';
import ToolShell from './ToolShell';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { haptic } from './usePWA';

export default function PdfTools() {
  useDocumentTitle('PDF Tools');

  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');

  // Merge State
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string>('');
  const [mergedSize, setMergedSize] = useState(0);

  // Split State
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitTotalPages, setSplitTotalPages] = useState(0);
  const [pageRange, setPageRange] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitPdfUrl, setSplitPdfUrl] = useState<string>('');
  const [splitSize, setSplitSize] = useState(0);
  const [splitFinalPages, setSplitFinalPages] = useState(0);

  // Merge Logic
  const handleMergeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      if (newFiles.length !== e.target.files.length) {
        toast.error('Only PDF files are allowed');
      }
      setMergeFiles([...mergeFiles, ...newFiles]);
      setMergedPdfUrl('');
    }
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFiles = [...mergeFiles];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      setMergeFiles(newFiles);
    } else if (direction === 'down' && index < mergeFiles.length - 1) {
      const newFiles = [...mergeFiles];
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      setMergeFiles(newFiles);
    }
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles(mergeFiles.filter((_, i) => i !== index));
  };

  const mergePdfs = async () => {
    if (mergeFiles.length < 2) {
      toast.error('Please add at least 2 PDFs to merge');
      return;
    }
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of mergeFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      setMergedSize(blob.size);
      setMergedPdfUrl(URL.createObjectURL(blob));
      haptic([12, 40, 20]);
      toast.success('PDFs merged successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error merging PDFs');
    } finally {
      setIsMerging(false);
    }
  };

  // Split Logic
  const handleSplitFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSplitFile(file);
      setSplitPdfUrl('');

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setSplitTotalPages(pdfDoc.getPageCount());
      } catch (err) {
        console.error(err);
        toast.error('Error reading PDF file');
        setSplitFile(null);
      }
    }
  };

  const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s, 10));
        if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > maxPages) {
          throw new Error(`Invalid range: ${part}`);
        }
        for (let i = start; i <= end; i++) {
          pages.add(i - 1);
        }
      } else {
        const page = parseInt(part, 10);
        if (isNaN(page) || page < 1 || page > maxPages) {
          throw new Error(`Invalid page number: ${part}`);
        }
        pages.add(page - 1);
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const splitPdf = async () => {
    if (!splitFile || !pageRange) return;
    setIsSplitting(true);

    try {
      const indicesToCopy = parsePageRange(pageRange, splitTotalPages);
      if (indicesToCopy.length === 0) {
        throw new Error('No valid pages specified');
      }

      const arrayBuffer = await splitFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(originalPdf, indicesToCopy);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

      setSplitSize(blob.size);
      setSplitFinalPages(indicesToCopy.length);
      setSplitPdfUrl(URL.createObjectURL(blob));
      haptic([12, 40, 20]);
      toast.success('PDF split successfully!');
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || 'Error splitting PDF');
    } finally {
      setIsSplitting(false);
    }
  };

  // ─── Canvas Content (70% Left / Mobile Top) ───
  const canvasContent = (
    <div className="flex flex-col items-center justify-center w-full gap-4 max-w-xl mx-auto">
      {activeTab === 'merge' ? (
        !mergedPdfUrl ? (
          <div className="w-full space-y-4">
            <div className="relative w-full p-10 md:p-14 border-2 border-dashed rounded-3xl cursor-pointer group/drop pb-panel text-center border-zinc-300 dark:border-zinc-700/60 hover:border-[#5668FF]/60 transition-all">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleMergeFiles}
                aria-label="Upload PDF files to merge"
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl pb-control flex items-center justify-center text-orange-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">Drop PDF files to merge</p>
                <p className="text-xs text-zinc-500">Add two or more files to assemble into a single document</p>
              </div>
            </div>

            {mergeFiles.length > 0 && (
              <div className="pb-panel p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  Assembly Order ({mergeFiles.length} files)
                </span>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {mergeFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl pb-control text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-4 h-4 rounded bg-[#5668FF]/20 text-[#5668FF] text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="truncate text-zinc-800 dark:text-zinc-200">{file.name}</span>
                        <span className="text-zinc-400 text-[10px]">({formatBytes(file.size)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveMergeFile(idx, 'up')}
                          disabled={idx === 0}
                          aria-label={`Move ${file.name} up`}
                          className="px-1.5 py-0.5 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveMergeFile(idx, 'down')}
                          disabled={idx === mergeFiles.length - 1}
                          aria-label={`Move ${file.name} down`}
                          className="px-1.5 py-0.5 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMergeFile(idx)}
                          aria-label={`Remove ${file.name}`}
                          className="px-1.5 py-0.5 rounded hover:bg-red-500/20 text-red-500 ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full pb-panel p-8 rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">PDFs Assembled Successfully</h3>
            <p className="text-xs font-mono text-zinc-400">Total Output Size: {formatBytes(mergedSize)}</p>
          </div>
        )
      ) : (
        /* Split Tab Canvas */
        !splitPdfUrl ? (
          <div className="w-full space-y-4">
            <div className="relative w-full p-10 md:p-14 border-2 border-dashed rounded-3xl cursor-pointer group/drop pb-panel text-center border-zinc-300 dark:border-zinc-700/60 hover:border-[#5668FF]/60 transition-all">
              <input
                type="file"
                accept=".pdf"
                onChange={handleSplitFile}
                aria-label="Upload PDF file to split"
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl pb-control flex items-center justify-center text-orange-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                  {splitFile ? splitFile.name : 'Drop a PDF file to split'}
                </p>
                <p className="text-xs text-zinc-500">
                  {splitFile ? `${splitTotalPages} total pages identified` : 'Extract custom pages or sub-ranges'}
                </p>
              </div>
            </div>

            {splitFile && (
              <div className="pb-panel p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  Page Selection Range
                </span>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-10"
                  aria-label="Pages to extract (comma-separated or ranges)"
                  className="w-full pb-control rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-900 dark:text-white outline-none border border-[var(--pb-border)] focus:border-[#5668FF]"
                />
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {[
                    { label: 'First Page Only', val: '1' },
                    { label: `Pages 1-${Math.min(5, splitTotalPages)}`, val: `1-${Math.min(5, splitTotalPages)}` },
                    { label: 'All Pages', val: `1-${splitTotalPages}` },
                  ].map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setPageRange(r.val)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono pb-control text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full pb-panel p-8 rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Extracted {splitFinalPages} Pages</h3>
            <p className="text-xs font-mono text-zinc-400">Total Output Size: {formatBytes(splitSize)}</p>
          </div>
        )
      )}
    </div>
  );

  // ─── Inspector Rail Content ───
  const inspectorContent = (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1.5 pb-control p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('merge')}
          className={`py-2 text-xs font-mono font-bold rounded-lg transition-all ${
            activeTab === 'merge' ? 'bg-[#5668FF] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Merge Studio
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('split')}
          className={`py-2 text-xs font-mono font-bold rounded-lg transition-all ${
            activeTab === 'split' ? 'bg-[#5668FF] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Split &amp; Extract
        </button>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2">
        {activeTab === 'merge' ? (
          mergedPdfUrl ? (
            <>
              <a
                href={mergedPdfUrl}
                download="perfectbyte_merged.pdf"
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] text-center block"
              >
                Download Merged PDF
              </a>
              <button
                type="button"
                onClick={() => { setMergeFiles([]); setMergedPdfUrl(''); }}
                className="w-full py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-xl pb-control text-center"
              >
                ← Merge Another Set
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={mergePdfs}
              disabled={isMerging || mergeFiles.length < 2}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] disabled:opacity-40"
            >
              {isMerging ? 'Merging Documents...' : `Merge All PDFs (${mergeFiles.length})`}
            </button>
          )
        ) : (
          splitPdfUrl ? (
            <>
              <a
                href={splitPdfUrl}
                download="perfectbyte_extracted.pdf"
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] text-center block"
              >
                Download Extracted PDF
              </a>
              <button
                type="button"
                onClick={() => { setSplitFile(null); setSplitPdfUrl(''); setPageRange(''); }}
                className="w-full py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-xl pb-control text-center"
              >
                ← Split Another PDF
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={splitPdf}
              disabled={isSplitting || !splitFile || !pageRange}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_20px_rgba(86,104,255,0.4)] disabled:opacity-40"
            >
              {isSplitting ? 'Extracting Pages...' : 'Extract Pages'}
            </button>
          )
        )}
      </div>

      <div className="pb-panel p-3.5 rounded-xl space-y-1.5 text-xs font-mono text-zinc-500">
        <div className="flex items-center justify-between">
          <span>Engine</span>
          <span className="text-zinc-700 dark:text-zinc-300">pdf-lib Client WASM</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Vector Integrity</span>
          <span className="text-zinc-700 dark:text-zinc-300">100% Lossless</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Server Uploads</span>
          <span className="text-emerald-500 font-bold">0 Bytes</span>
        </div>
      </div>
    </div>
  );

  return (
    <ToolShell
      title="PDF Studio"
      accentColor="bg-orange-500"
      badgeText="VECTOR LOSSLESS"
      canvas={canvasContent}
      inspector={inspectorContent}
    />
  );
}

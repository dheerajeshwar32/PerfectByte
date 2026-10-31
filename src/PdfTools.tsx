import React, { useState, useRef } from 'react';
import ToolShell from './ToolShell';
import StudioDropzone from './components/StudioDropzone';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { haptic } from './usePWA';

export default function PdfTools() {
  useDocumentTitle('PDF Studio');

  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');

  // Merge State
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string>('');
  const [mergedSize, setMergedSize] = useState(0);
  const [isMergeDragging, setIsMergeDragging] = useState(false);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  // Split State
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitTotalPages, setSplitTotalPages] = useState(0);
  const [pageRange, setPageRange] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitPdfUrl, setSplitPdfUrl] = useState<string>('');
  const [splitSize, setSplitSize] = useState(0);
  const [splitFinalPages, setSplitFinalPages] = useState(0);
  const [isSplitDragging, setIsSplitDragging] = useState(false);
  const splitFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Merge Handlers ───
  const addMergeFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const newFiles = list.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (newFiles.length !== list.length) {
      toast.error('Only PDF documents are allowed');
    }
    if (newFiles.length > 0) {
      setMergeFiles((prev) => [...prev, ...newFiles]);
      setMergedPdfUrl('');
      haptic(10);
    }
  };

  const handleMergeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addMergeFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleMergeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsMergeDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addMergeFiles(e.dataTransfer.files);
    }
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const next = [...mergeFiles];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      setMergeFiles(next);
      haptic(8);
    } else if (direction === 'down' && index < mergeFiles.length - 1) {
      const next = [...mergeFiles];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      setMergeFiles(next);
      haptic(8);
    }
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles((prev) => prev.filter((_, i) => i !== index));
    haptic(8);
  };

  const mergePdfs = async () => {
    if (mergeFiles.length < 2) {
      toast.error('Please queue at least 2 PDF documents to merge');
      return;
    }
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of mergeFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      setMergedSize(blob.size);
      setMergedPdfUrl(URL.createObjectURL(blob));
      haptic([12, 40, 20]);
      toast.success(`Successfully merged ${mergeFiles.length} PDF documents!`);
    } catch (err) {
      console.error(err);
      toast.error('Error assembling PDF documents. Please ensure files are not password protected.');
    } finally {
      setIsMerging(false);
    }
  };

  // ─── Split Handlers ───
  const processSplitFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a valid PDF document');
      return;
    }
    setSplitFile(file);
    setSplitPdfUrl('');
    setPageRange('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      setSplitTotalPages(pageCount);
      setPageRange(`1-${Math.min(5, pageCount)}`);
      haptic(10);
    } catch (err) {
      console.error(err);
      toast.error('Error reading PDF document. Verify it is not corrupted or encrypted.');
      setSplitFile(null);
    }
  };

  const handleSplitFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSplitFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleSplitDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsSplitDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSplitFile(e.dataTransfer.files[0]);
    }
  };

  const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map((s) => parseInt(s, 10));
        if (isNaN(start) || isNaN(end) || start > end || start < 1 || end > maxPages) {
          throw new Error(`Invalid range "${part}". Valid pages are 1 to ${maxPages}.`);
        }
        for (let i = start; i <= end; i++) {
          pages.add(i - 1);
        }
      } else {
        const page = parseInt(part, 10);
        if (isNaN(page) || page < 1 || page > maxPages) {
          throw new Error(`Invalid page "${part}". Valid pages are 1 to ${maxPages}.`);
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
        throw new Error('No valid pages specified for extraction');
      }

      const arrayBuffer = await splitFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(originalPdf, indicesToCopy);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

      setSplitSize(blob.size);
      setSplitFinalPages(indicesToCopy.length);
      setSplitPdfUrl(URL.createObjectURL(blob));
      haptic([12, 40, 20]);
      toast.success(`Extracted ${indicesToCopy.length} page${indicesToCopy.length > 1 ? 's' : ''} cleanly!`);
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || 'Error extracting pages from PDF');
    } finally {
      setIsSplitting(false);
    }
  };

  const totalMergeBytes = mergeFiles.reduce((acc, f) => acc + f.size, 0);

  // ─── 7-Column Left Interactive Stage ───
  const canvasContent = (
    <div className="w-full h-full flex flex-col justify-center">
      {activeTab === 'merge' ? (
        // ─── MERGE TAB ───
        mergeFiles.length === 0 ? (
          <StudioDropzone
            isDragging={isMergeDragging}
            onDragOver={(e) => {
              e.preventDefault();
              setIsMergeDragging(true);
            }}
            onDragLeave={() => setIsMergeDragging(false)}
            onDrop={handleMergeDrop}
            onClick={() => mergeFileInputRef.current?.click()}
            title="Drop PDF documents to merge"
            subtitle="Queue two or more documents to assemble into a single vector-lossless PDF"
            formats={['PDF']}
            iconColor="text-orange-500"
            fileInput={
              <input
                ref={mergeFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleMergeFileInput}
                aria-label="Upload PDF files to merge"
                className="hidden"
              />
            }
          />
        ) : mergedPdfUrl ? (
          // Merged Success State
          <div className="w-full flex-1 min-h-[460px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#12141C]/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-5 shadow-[0_10px_30px_-5px_rgba(16,185,129,0.3)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Assembly Complete
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              {mergeFiles.length} documents compiled cleanly into a single lossless vector PDF.
            </p>

            <div className="inline-flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 mb-8 font-mono text-xs text-slate-600 dark:text-slate-300">
              <span>Source: <strong className="text-slate-900 dark:text-white">{formatBytes(totalMergeBytes)}</strong></span>
              <span>•</span>
              <span>Compiled: <strong className="text-emerald-600 dark:text-emerald-400">{formatBytes(mergedSize)}</strong></span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <a
                href={mergedPdfUrl}
                download="perfectbyte_assembled.pdf"
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-center transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
              >
                Download Assembled PDF
              </a>
              <button
                type="button"
                onClick={() => {
                  setMergeFiles([]);
                  setMergedPdfUrl('');
                }}
                className="w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        ) : (
          // Staged Merge Files Queue
          <div className="w-full flex-1 min-h-[460px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#12141C]/80 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header inside canvas */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-mono text-xs font-bold">
                    PDF
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assembly Queue</h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Drag or shift files to adjust final page sequence
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={mergeFileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    onChange={handleMergeFileInput}
                    aria-label="Upload additional PDF files"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => mergeFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 transition-all flex items-center gap-1.5"
                  >
                    <span>+ Add More</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMergeFiles([])}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Document Cards List */}
              <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {mergeFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.07] transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="w-6 h-6 rounded-md bg-[#5668FF]/15 text-[#5668FF] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveMergeFile(idx, 'up')}
                        disabled={idx === 0}
                        aria-label={`Move ${file.name} up`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 disabled:opacity-20 transition-all"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMergeFile(idx, 'down')}
                        disabled={idx === mergeFiles.length - 1}
                        aria-label={`Move ${file.name} down`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 disabled:opacity-20 transition-all"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMergeFile(idx)}
                        aria-label={`Remove ${file.name}`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-red-500 hover:bg-red-500/15 ml-1 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Status strip */}
            <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>100% Lossless Vector Stream</span>
              </span>
              <span>{mergeFiles.length} file{mergeFiles.length > 1 ? 's' : ''} queued • {formatBytes(totalMergeBytes)}</span>
            </div>
          </div>
        )
      ) : (
        // ─── SPLIT TAB ───
        !splitFile ? (
          <StudioDropzone
            isDragging={isSplitDragging}
            onDragOver={(e) => {
              e.preventDefault();
              setIsSplitDragging(true);
            }}
            onDragLeave={() => setIsSplitDragging(false)}
            onDrop={handleSplitDrop}
            onClick={() => splitFileInputRef.current?.click()}
            title="Drop a PDF document to split"
            subtitle="Extract page ranges or individual pages into a standalone vector document"
            formats={['PDF']}
            iconColor="text-orange-500"
            fileInput={
              <input
                ref={splitFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleSplitFileInput}
                aria-label="Upload PDF file to split"
                className="hidden"
              />
            }
          />
        ) : splitPdfUrl ? (
          // Split Success State
          <div className="w-full flex-1 min-h-[460px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#12141C]/80 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-5 shadow-[0_10px_30px_-5px_rgba(16,185,129,0.3)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Extracted {splitFinalPages} Page{splitFinalPages > 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Specified page ranges carved losslessly without re-encoding fonts or vectors.
            </p>

            <div className="inline-flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 mb-8 font-mono text-xs text-slate-600 dark:text-slate-300">
              <span>Source: <strong className="text-slate-900 dark:text-white">{splitTotalPages} pgs ({formatBytes(splitFile.size)})</strong></span>
              <span>•</span>
              <span>Extracted: <strong className="text-emerald-600 dark:text-emerald-400">{formatBytes(splitSize)}</strong></span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <a
                href={splitPdfUrl}
                download={`extracted_${splitFile.name}`}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-center transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
              >
                Download Extracted PDF
              </a>
              <button
                type="button"
                onClick={() => {
                  setSplitFile(null);
                  setSplitPdfUrl('');
                  setPageRange('');
                }}
                className="w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 transition-colors"
              >
                Split Another
              </button>
            </div>
          </div>
        ) : (
          // Active Split Document Stage
          <div className="w-full flex-1 min-h-[460px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#12141C]/80 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Document Identity Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {splitFile.name}
                    </h4>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {splitTotalPages} total pages • {formatBytes(splitFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSplitFile(null);
                    setPageRange('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200/60 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.1] transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Page Selection Controls */}
              <div className="mt-8 space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2 font-semibold">
                    Page Selection Range
                  </label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g. 1-3, 5, 7-10"
                    aria-label="Pages to extract (comma-separated or ranges)"
                    className="w-full px-4 py-3 rounded-xl text-base font-mono bg-white dark:bg-[#0B0E1B] text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 focus:border-[#5668FF] focus:ring-2 focus:ring-[#5668FF]/20 outline-none transition-all shadow-inner"
                  />
                  <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1.5">
                    Enter individual page numbers or ranges separated by commas (valid 1 to {splitTotalPages}).
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 block mb-2 font-semibold">
                    QUICK PRESETS
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'First Page Only', val: '1' },
                      { label: `Pages 1-${Math.min(5, splitTotalPages)}`, val: `1-${Math.min(5, splitTotalPages)}` },
                      { label: 'All Pages', val: `1-${splitTotalPages}` },
                    ].map((r) => (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => {
                          setPageRange(r.val);
                          haptic(8);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                          pageRange === r.val
                            ? 'bg-[#5668FF]/15 border-[#5668FF] text-[#5668FF] font-bold'
                            : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom vector status */}
            <div className="pt-4 mt-6 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Lossless Vector Carving</span>
              </span>
              <span>Max Bounds: Page 1 - {splitTotalPages}</span>
            </div>
          </div>
        )
      )}
    </div>
  );

  // ─── 5-Column Right Inspector Console ───
  const inspectorContent = (
    <div className="flex flex-col gap-5">
      {/* Segmented Mode Switcher Pill */}
      <div className="p-1 rounded-2xl bg-slate-200/70 dark:bg-black/40 border border-slate-300/70 dark:border-white/10 grid grid-cols-2 gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setActiveTab('merge');
            haptic(10);
          }}
          className={`py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'merge'
              ? 'bg-white dark:bg-[#1E2028] text-slate-900 dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>📑</span>
          <span>Merge Studio</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('split');
            haptic(10);
          }}
          className={`py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'split'
              ? 'bg-white dark:bg-[#1E2028] text-slate-900 dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-white/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>✂️</span>
          <span>Split &amp; Extract</span>
        </button>
      </div>

      {/* Summary Bento Tile */}
      <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-bold">
          {activeTab === 'merge' ? 'ASSEMBLY SPECIFICATION' : 'EXTRACTION CONSOLE'}
        </span>

        {activeTab === 'merge' ? (
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Mode</span>
              <span className="font-semibold text-slate-900 dark:text-white">Linear Assembly</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Documents Queued</span>
              <span className="font-semibold text-slate-900 dark:text-white">{mergeFiles.length} files</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Total Payload</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatBytes(totalMergeBytes)}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Active Document</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                {splitFile ? splitFile.name : 'None mounted'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Total Pages</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {splitFile ? `${splitTotalPages} pages` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Target Selection</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {pageRange || '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="space-y-2">
        {activeTab === 'merge' ? (
          mergedPdfUrl ? (
            <>
              <a
                href={mergedPdfUrl}
                download="perfectbyte_assembled.pdf"
                className="w-full py-4 rounded-xl font-bold text-sm text-center block transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
              >
                Download Assembled PDF
              </a>
              <button
                type="button"
                onClick={() => {
                  setMergeFiles([]);
                  setMergedPdfUrl('');
                }}
                className="w-full py-2.5 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-center"
              >
                ← Assemble Another Set
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={mergePdfs}
              disabled={isMerging || mergeFiles.length < 2}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isMerging ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Assembling Documents...</span>
                </>
              ) : (
                <span>Merge {mergeFiles.length > 0 ? `${mergeFiles.length} PDFs` : 'Documents'}</span>
              )}
            </button>
          )
        ) : splitPdfUrl ? (
          <>
            <a
              href={splitPdfUrl}
              download={`extracted_${splitFile?.name || 'document'}`}
              className="w-full py-4 rounded-xl font-bold text-sm text-center block transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              Download Extracted PDF
            </a>
            <button
              type="button"
              onClick={() => {
                setSplitFile(null);
                setSplitPdfUrl('');
                setPageRange('');
              }}
              className="w-full py-2.5 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-center"
            >
              ← Split Another PDF
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={splitPdf}
            disabled={isSplitting || !splitFile || !pageRange}
            className="w-full py-4 rounded-xl font-bold text-sm transition-all bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-[0_8px_24px_-4px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSplitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Extracting Pages...</span>
              </>
            ) : (
              <span>Extract Pages</span>
            )}
          </button>
        )}
      </div>

      {/* Micro-Trust & Specs Card */}
      <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] space-y-2 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Engine</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">pdf-lib Client WASM</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Vector Stream</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Lossless</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Server Uploads</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0 Bytes • Absolute Local</span>
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

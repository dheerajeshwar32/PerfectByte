import React, { useState } from 'react';
import Navbar from './Navbar';
import { useDocumentTitle } from './useDocumentTitle';
import { formatBytes } from './utils';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';

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
          pages.add(i - 1); // 0-based index
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
      toast.success('PDF split successfully!');
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || 'Error splitting PDF');
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <Navbar />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>

      <main className="bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-5xl w-full text-center relative z-10 mt-4 mx-4">
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 to-slate-600 dark:from-white dark:to-slate-400 mb-8 md:mb-12 leading-tight px-4 pb-2">
          PDF <br className="hidden sm:block" />
          <span 
            className="text-[#5668FF] drop-shadow-sm"
            style={{ textShadow: '-2px 0px 0px rgba(0,255,255,0.3), 2px 0px 0px rgba(255,0,255,0.3)' }}
          >
            Studio
          </span>
        </h1>

        <div className="flex justify-center mb-12">
          <div className="bg-white/40 dark:bg-[#0a0f1c]/40 backdrop-blur-md p-1.5 rounded-full inline-flex border border-white/60 dark:border-indigo-800/30 shadow-sm">
            <button
              onClick={() => setActiveTab('merge')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === 'merge' 
                  ? 'bg-[#5668FF] text-white shadow-lg'
                  : 'bg-white/60 dark:bg-[#0a0f1c]/50 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Merge PDFs
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === 'split'
                  ? 'bg-[#5668FF] text-white shadow-lg'
                  : 'bg-white/60 dark:bg-[#0a0f1c]/50 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Split PDF
            </button>
          </div>
        </div>

        {/* MERGE TAB */}
        {activeTab === 'merge' && (
          <div className="max-w-2xl mx-auto text-left bg-white/60 dark:bg-[#0a0f1c]/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] border border-slate-100/80 dark:border-indigo-800/40 shadow-sm">
            {!mergedPdfUrl ? (
              <>
                <div className="mb-8">
                  <div className="relative w-full max-w-2xl mx-auto p-10 md:p-14 border-2 border-dashed rounded-[2rem] transition-all duration-500 cursor-pointer group/drop bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/40 dark:to-slate-900/40 border-slate-200/60 dark:border-slate-700/40 hover:border-[#5668FF]/50 hover:shadow-[0_0_40px_rgba(86,104,255,0.08)] backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#5668FF]/10 dark:bg-[#5668FF]/20 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-[#5668FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Drop your PDFs here</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">or <span className="text-[#5668FF] font-medium hover:underline">browse files</span></p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleMergeFiles}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {mergeFiles.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">File Order</h2>
                    <div className="space-y-2">
                      {mergeFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-white/60 dark:bg-[#0a0f1c]/40 backdrop-blur-sm rounded-[1rem] border border-slate-200/60 dark:border-indigo-800/40 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-1 truncate pr-4">
                            <span className="font-medium text-indigo-800 dark:text-slate-200 text-sm">{file.name}</span>
                            <span className="ml-2 text-xs text-slate-400">{formatBytes(file.size)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => moveMergeFile(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">↑</button>
                            <button onClick={() => moveMergeFile(idx, 'down')} disabled={idx === mergeFiles.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">↓</button>
                            <button onClick={() => removeMergeFile(idx)} className="p-1 text-red-400 hover:text-red-600 ml-2">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={mergePdfs}
                  disabled={isMerging || mergeFiles.length < 2}
                  className="w-full py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isMerging ? 'Merging...' : 'Merge All'}
                </button>
              </>
            ) : (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mb-6">Merged Successfully!</h2>
                <div className="bg-slate-50 dark:bg-indigo-900 p-6 rounded-2xl mb-8">
                  <p className="text-slate-500 dark:text-slate-400 mb-2">Total Output Size</p>
                  <p className="text-3xl font-black text-[#5668FF] dark:text-[#7888FF]">{formatBytes(mergedSize)}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setMergeFiles([]); setMergedPdfUrl(''); }}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-indigo-800 dark:text-white py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Start Over
                  </button>
                  <a
                    href={mergedPdfUrl}
                    download="merged_document.pdf"
                    className="flex-1 py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)] text-center flex items-center justify-center"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPLIT TAB */}
        {activeTab === 'split' && (
          <div className="max-w-2xl mx-auto text-left bg-white/60 dark:bg-[#0a0f1c]/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] border border-slate-100/80 dark:border-indigo-800/40 shadow-sm">
            {!splitPdfUrl ? (
              <>
                <div className="mb-8">
                  <div className="relative w-full max-w-2xl mx-auto p-10 md:p-14 border-2 border-dashed rounded-[2rem] transition-all duration-500 cursor-pointer group/drop bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/40 dark:to-slate-900/40 border-slate-200/60 dark:border-slate-700/40 hover:border-[#5668FF]/50 hover:shadow-[0_0_40px_rgba(86,104,255,0.08)] backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#5668FF]/10 dark:bg-[#5668FF]/20 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-[#5668FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Drop your PDF here</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">or <span className="text-[#5668FF] font-medium hover:underline">browse files</span></p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleSplitFile}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  {splitFile && (
                    <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                      Loaded: {splitFile.name} — <span className="font-bold text-[#5668FF]">{splitTotalPages} pages</span>
                    </p>
                  )}
                </div>

                {splitFile && (
                  <div className="mb-8">
                    <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Pages to Extract</h2>
                    <input
                      type="text"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 7-10"
                      className="w-full bg-slate-50 dark:bg-indigo-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-indigo-800 dark:text-white"
                    />
                    <p className="mt-2 text-xs text-slate-400">Comma-separated page numbers or ranges.</p>
                  </div>
                )}

                <button
                  onClick={splitPdf}
                  disabled={isSplitting || !splitFile || !pageRange}
                  className="w-full py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSplitting ? 'Splitting...' : 'Split'}
                </button>
              </>
            ) : (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mb-6">Split Successfully!</h2>
                <div className="bg-slate-50 dark:bg-indigo-900 p-6 rounded-2xl mb-8 flex justify-around">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 mb-2">Pages Extracted</p>
                    <p className="text-3xl font-black text-indigo-800 dark:text-white">{splitFinalPages}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 mb-2">Output Size</p>
                    <p className="text-3xl font-black text-[#5668FF] dark:text-[#7888FF]">{formatBytes(splitSize)}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setSplitFile(null); setSplitPdfUrl(''); setPageRange(''); }}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-indigo-800 dark:text-white py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Start Over
                  </button>
                  <a
                    href={splitPdfUrl}
                    download="split_document.pdf"
                    className="flex-1 py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_4px_20px_rgba(86,104,255,0.3)] text-center flex items-center justify-center"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect, useCallback, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import Footer from './Footer';
import { useDocumentTitle } from './useDocumentTitle';

export default function Home() {
  useDocumentTitle('Home');
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Record that the user has visited for smart PWA mobile bypass
    if (typeof window !== 'undefined') {
      localStorage.setItem('has_visited', 'true');
    }
  }, []);

  const tools = [
    {
      id: 'target-compress',
      title: 'Target File Size',
      desc: 'Compress an image or PDF to an exact byte size with micro-convergent precision. Built for strict portal limits.',
      path: '/target-size',
      iconColor: 'text-blue-500',
      badge: {
        icon: (
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        label: <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">100% LOCAL PROCESSING</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
    },
    {
      id: 'bulk-compress',
      title: 'Bulk Compression',
      desc: 'Process entire folders of images instantly with zero network roundtrips. Concurrently optimized in browser WASM.',
      path: '/bulk-compress',
      iconColor: 'text-teal-500',
      badge: {
        icon: (
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        ),
        label: <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">ZERO-SERVER RUNTIME</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
    },
    {
      id: 'ai-assistant',
      title: 'AI File Assistant',
      desc: 'Type natural language instructions—"compress PDF to 100KB" or "remove margins"—powered by Gemini AI.',
      path: '/assistant',
      iconColor: 'text-purple-500',
      badge: {
        icon: (
          <svg className="w-3.5 h-3.5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        label: (
          <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
            GEMINI ENGINE
          </span>
        )
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"></path>
    },
    {
      id: 'format-converter',
      title: 'Format Converter',
      desc: 'Convert seamlessly between WebP, PNG, JPEG, and AVIF formats entirely client-side using native SIMD WASM.',
      path: '/convert',
      iconColor: 'text-cyan-500',
      badge: {
        icon: (
          <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        ),
        label: <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">MULTI-FORMAT CODECS</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
    },
    {
      id: 'image-resizer',
      title: 'Image Resizer',
      desc: 'Resize images by pixel dimensions or scale percentage with Lanczos-3 filtering and aspect ratio locking.',
      path: '/resize',
      iconColor: 'text-rose-500',
      badge: {
        icon: (
          <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        ),
        label: <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">LANCZOS-3 INTERPOLATION</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
    },
    {
      id: 'pdf-tools',
      title: 'PDF Studio',
      desc: 'Merge, split, compress, and organize PDF documents locally. Absolute zero privacy risk or server uploading.',
      path: '/pdf-tools',
      iconColor: 'text-orange-500',
      badge: {
        icon: (
          <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        label: <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">COMPLETE PDF STUDIO</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    }
  ];

  const handleNext = useCallback(() => setActiveIndex((prev) => (prev + 1) % tools.length), [tools.length]);
  const handlePrev = useCallback(() => setActiveIndex((prev) => (prev - 1 + tools.length) % tools.length), [tools.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files;
        if (!dropped || dropped.length === 0) return;
        if (dropped.length === 1) {
          navigate('/target-size');
        } else {
          navigate('/bulk-compress');
        }
      }}
      className="min-h-dvh pb-canvas flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-200"
    >
      {/* ─── Drag Overlay ─── */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-md bg-[#09090B]/80 border-2 border-dashed border-[#5668FF] flex flex-col items-center justify-center gap-4 text-center p-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#5668FF]/20 text-[#5668FF] flex items-center justify-center animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-2xl font-black text-white tracking-tight">Drop Files to Launch Tool</p>
            <p className="text-xs font-mono text-zinc-400">
              1 file opens <span className="text-[#5668FF] font-bold">Target Compressor</span> · Multiple files open <span className="text-teal-400 font-bold">Bulk Processor</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top Specular Navigation ─── */}
      <nav className="absolute top-0 left-0 w-full p-4 md:px-10 flex justify-between items-center z-50">
        <Logo />
      </nav>

      {/* ─── Hero Heading (Machined Specular Minimalist Look) ─── */}
      <main className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center mb-8 md:mb-12 px-4">
        <div className="h-9 flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full pb-panel border border-[var(--pb-border)] shadow-sm"
              style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
            >
              {tools[activeIndex]?.badge && (
                <>
                  {tools[activeIndex].badge.icon}
                  {tools[activeIndex].badge.label}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
          Flawless files. <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-[#5668FF] to-purple-600 dark:from-blue-400 dark:via-[#7888FF] dark:to-purple-400">
            Zero compromises.
          </span>
        </h1>
        <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mt-3 font-medium">
          Professional client-side precision tools engineered for absolute privacy and strict upload limits.
        </p>
      </main>

      {/* ─── Interactive Carousel with 1px Specular Luminance Hairlines ─── */}
      <div
        onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const touchEnd = e.changedTouches[0].clientX;
          if (touchStart - touchEnd > 50) handleNext();
          if (touchStart - touchEnd < -50) handlePrev();
          setTouchStart(null);
        }}
        style={{ touchAction: 'pan-y' }}
        className="relative w-full max-w-7xl h-[340px] md:h-[380px] mx-auto flex items-center justify-center z-20 touch-pan-y"
      >
        {tools.map((tool, index) => {
          const isActive = index === activeIndex;
          const isLeft = index === (activeIndex - 1 + tools.length) % tools.length;
          const isRight = index === (activeIndex + 1) % tools.length;

          let xOffset: string;
          let scale: number;
          let zIndex: number;
          let blur: string;
          let opacity: number;

          if (isActive) {
            xOffset = "0%"; scale = 1; zIndex = 30; opacity = 1; blur = "blur(0px)";
          } else if (isLeft) {
            xOffset = "-72%"; scale = 0.88; zIndex = 10; opacity = 0.35; blur = "blur(4px)";
          } else if (isRight) {
            xOffset = "72%"; scale = 0.88; zIndex = 10; opacity = 0.35; blur = "blur(4px)";
          } else {
            xOffset = "0%"; scale = 0.75; zIndex = 0; opacity = 0; blur = "blur(10px)";
          }

          return (
            <motion.div
              key={tool.id}
              animate={{ x: xOffset, scale, zIndex, opacity, filter: blur }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="absolute w-[88%] sm:w-[90%] md:w-full max-w-[440px]"
            >
              <div
                onClick={() => {
                  if (!isActive) setActiveIndex(index);
                }}
                className={`relative overflow-hidden pb-panel pb-noise p-6 md:p-8 rounded-3xl border border-[var(--pb-border)] flex flex-col items-start text-left transition-all duration-300 h-[340px] md:h-[380px] group ${
                  isActive
                    ? 'shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] ring-1 ring-[#5668FF]/30 cursor-default'
                    : 'cursor-pointer hover:border-[#5668FF]/40'
                }`}
                style={{
                  boxShadow: isActive
                    ? 'inset 0 1px 0 0 var(--pb-specular), 0 20px 40px -15px rgba(0,0,0,0.3)'
                    : 'inset 0 1px 0 0 var(--pb-specular)',
                }}
              >
                <div className="relative z-10 w-full flex flex-col flex-grow">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 pb-control shadow-sm ${tool.iconColor}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tool.svg}
                    </svg>
                  </div>

                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                    {tool.title}
                  </h2>

                  <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-normal leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                {isActive && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative z-10 w-full flex items-center justify-between mt-auto pt-4 border-t border-[var(--pb-border)] group/btn cursor-pointer bg-transparent"
                    aria-label={`Open ${tool.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(tool.path);
                    }}
                  >
                    <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider group-hover/btn:text-[#5668FF] transition-colors">
                      Launch Workspace →
                    </span>
                    <div className="w-8 h-8 rounded-xl pb-control flex items-center justify-center text-zinc-800 dark:text-white transition-transform duration-200 group-hover/btn:translate-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </div>
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Carousel Controls ─── */}
      <div className="flex items-center gap-4 mt-8 z-30 mb-12">
        <button
          onClick={handlePrev}
          aria-label="Previous tool"
          className="w-10 h-10 rounded-xl pb-control flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="Tool selection">
          {tools.map((tool, idx) => (
            <button
              key={tool.id}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Jump to ${tool.title}`}
              aria-selected={idx === activeIndex}
              role="tab"
              className={`h-2 rounded-full transition-all duration-200 ${
                idx === activeIndex
                  ? 'w-7 bg-[#5668FF]'
                  : 'w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          aria-label="Next tool"
          className="w-10 h-10 rounded-xl pb-control flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

      <Footer />
    </div>
  );
}

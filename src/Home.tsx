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
      desc: 'Compress an image or PDF to an exact byte size. Perfect for strict government portals and upload limits.',
      path: '/target-size',
      iconColor: 'text-blue-600 dark:text-blue-400',
      glowColor: 'bg-blue-500',
      badge: {
        icon: (
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        label: <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">100% Local Processing</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
    },
    {
      id: 'bulk-compress',
      title: 'Bulk Compression',
      desc: 'Process entire folders of images instantly. Reduce your storage footprint while maintaining crisp visual quality.',
      path: '/bulk-compress',
      iconColor: 'text-teal-600 dark:text-teal-400',
      glowColor: 'bg-teal-500',
      badge: {
        icon: (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        ),
        label: <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Zero-Server Architecture</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
    },
    {
      id: 'ai-assistant',
      title: 'AI File Assistant',
      desc: 'Type what you need—"compress this PDF to 100KB" or "remove blank pages"—and let the Gemini engine handle it.',
      path: '/assistant',
      iconColor: 'text-purple-600 dark:text-purple-400',
      glowColor: 'bg-purple-500',
      badge: {
        icon: (
          <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        label: (
          <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">
            Powered by <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Gemini AI</span>
          </span>
        )
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"></path>
    },
    {
      id: 'format-converter',
      title: 'Format Converter',
      desc: 'Seamlessly convert between WebP, PNG, JPEG, and AVIF formats entirely in your browser using WASM.',
      path: '/convert',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      glowColor: 'bg-cyan-500',
      badge: {
        icon: (
          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        ),
        label: <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Any Format, Anywhere</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
    },
    {
      id: 'image-resizer',
      title: 'Image Resizer',
      desc: 'Resize images by exact pixel dimensions or percentage scale while maintaining perfect aspect ratios.',
      path: '/resize',
      iconColor: 'text-rose-600 dark:text-rose-400',
      glowColor: 'bg-rose-500',
      badge: {
        icon: (
          <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        ),
        label: <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Pixel-Perfect Resizing</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
    },
    {
      id: 'pdf-tools',
      title: 'PDF Studio',
      desc: 'Merge, split, compress, and manipulate PDF documents locally with zero privacy compromises.',
      path: '/pdf-tools',
      iconColor: 'text-orange-600 dark:text-orange-400',
      glowColor: 'bg-orange-500',
      badge: {
        icon: (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        label: <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Complete PDF Control</span>
      },
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
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
      className="min-h-dvh flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-200"
    >
      {/* ─── Background Ambient Glows (Apple Frosted Aesthetic) ─── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-blue-400/15 dark:bg-blue-600/10 blur-[130px]"></div>
        <div className="absolute top-[20%] right-[15%] w-[40%] h-[40%] rounded-full bg-teal-300/15 dark:bg-teal-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-400/15 dark:bg-indigo-600/10 blur-[140px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>

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

      {/* ─── Top Navigation ─── */}
      <nav className="absolute top-0 left-0 w-full p-4 md:px-10 flex justify-between items-center z-50">
        <Logo />
      </nav>

      {/* ─── Hero Heading ─── */}
      <main className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center mb-8 md:mb-14 px-4">
        <div className="h-10 flex items-center justify-center mb-4 md:mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-sm cursor-default"
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

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Flawless files. <br className="hidden sm:block" />
          <span className="text-[#5668FF]">
            Zero compromises.
          </span>
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mt-3 font-normal">
          Professional client-side precision tools engineered for absolute privacy and strict upload limits.
        </p>
      </main>

      {/* ─── Apple-Inspired Glassmorphic Carousel ─── */}
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
        className="relative w-full max-w-7xl h-[360px] md:h-[420px] mx-auto flex items-center justify-center z-20 touch-pan-y"
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
            xOffset = "-75%"; scale = 0.85; zIndex = 10; opacity = 0.3; blur = "blur(8px)";
          } else if (isRight) {
            xOffset = "75%"; scale = 0.85; zIndex = 10; opacity = 0.3; blur = "blur(8px)";
          } else {
            xOffset = "0%"; scale = 0.7; zIndex = 0; opacity = 0; blur = "blur(10px)";
          }

          return (
            <motion.div
              key={tool.id}
              animate={{ x: xOffset, scale, zIndex, opacity, filter: blur }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="absolute w-[88%] sm:w-[90%] md:w-full max-w-[460px]"
            >
              <div
                onClick={() => {
                  if (!isActive) setActiveIndex(index);
                }}
                className={`relative overflow-hidden bg-white/70 dark:bg-[#111118]/80 backdrop-blur-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border ${
                  isActive
                    ? 'border-white/80 dark:border-white/10 shadow-[0_30px_60px_-15px_rgba(86,104,255,0.12)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-[#5668FF]/20 cursor-default'
                    : 'border-white/40 dark:border-white/5 cursor-pointer shadow-none'
                } flex flex-col items-start text-left transition-all duration-500 h-[360px] md:h-[420px] group`}
              >
                {/* Soft ambient corner glow */}
                <div
                  className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-opacity duration-700 ${
                    isActive ? 'opacity-35 dark:opacity-25' : 'opacity-0'
                  } ${tool.glowColor}`}
                />

                <div className="relative z-10 w-full flex flex-col flex-grow">
                  <div
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-5 md:mb-8 shadow-sm border border-slate-200/50 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-white/10 dark:to-white/5 transition-transform duration-500 ${
                      isActive ? 'scale-100' : 'scale-95'
                    } ${tool.iconColor}`}
                  >
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tool.svg}
                    </svg>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2 md:mb-4">
                    {tool.title}
                  </h2>

                  <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-light leading-relaxed line-clamp-3 md:line-clamp-none">
                    {tool.desc}
                  </p>
                </div>

                {isActive && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 w-full flex items-center justify-between mt-auto pt-4 md:pt-6 border-t border-slate-200/60 dark:border-white/10 group/btn cursor-pointer bg-transparent"
                    aria-label={`Open ${tool.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(tool.path);
                    }}
                  >
                    <span className="text-[10px] md:text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]">
                      Initialize Tool
                    </span>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 transition-transform duration-300 group-hover/btn:translate-x-1">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* ─── Apple-Inspired Circular Carousel Controls ─── */}
      <div className="flex items-center gap-4 md:gap-6 mt-8 md:mt-12 z-30 mb-12">
        <button
          onClick={handlePrev}
          aria-label="Previous tool"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-105 transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label="Tool selection">
          {tools.map((tool, idx) => (
            <button
              key={tool.id}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Jump to ${tool.title}`}
              aria-selected={idx === activeIndex}
              role="tab"
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? 'w-8 bg-[#5668FF] shadow-[0_0_12px_rgba(86,104,255,0.4)]'
                  : 'w-2.5 bg-slate-300/80 dark:bg-zinc-700/80 hover:bg-slate-400 dark:hover:bg-zinc-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          aria-label="Next tool"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-105 transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

      <Footer />
    </div>
  );
}

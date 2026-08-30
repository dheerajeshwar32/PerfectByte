import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import Footer from './Footer';

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  const tools = [
    {
      id: 'target-compress',
      title: 'Target File Size',
      desc: 'Compress an image or PDF to an exact byte size. Perfect for strict government portals and upload limits.',
      path: '/target-size',
      iconColor: 'text-blue-600 dark:text-blue-400',
      glowColor: 'bg-blue-500',
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
    },
    {
      id: 'bulk-compress',
      title: 'Bulk Compression',
      desc: 'Process entire folders of images instantly. Reduce your storage footprint while maintaining crisp visual quality.',
      path: '/bulk-compress',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      glowColor: 'bg-emerald-500',
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
    },
    {
      id: 'ai-assistant',
      title: 'AI File Assistant',
      desc: 'Type what you need—"compress this PDF to 100KB" or "remove blank pages"—and let the Gemini engine handle it.',
      path: '/assistant',
      iconColor: 'text-purple-600 dark:text-purple-400',
      glowColor: 'bg-purple-500',
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"></path>
    }
  ];

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % tools.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + tools.length) % tools.length);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center justify-start pt-24 relative overflow-hidden font-sans transition-colors duration-300">
      
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 w-full p-6 md:px-12 flex justify-between items-center z-50">
        <Logo />
      </div>

      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px] pointer-events-none"></div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center mb-16">
        
        {/* Dynamic Architecture Badge */}
        <div className="h-10 flex items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm cursor-default"
            >
              {activeIndex === 0 && (
                <>
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">100% Local Processing</span>
                </>
              )}
              {activeIndex === 1 && (
                <>
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Zero-Server Architecture</span>
                </>
              )}
              {activeIndex === 2 && (
                <>
                  <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Powered by <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Gemini AI</span>
                  </span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight transition-colors">
          Flawless files. <br className="hidden md:block" />
          <span 
            className="text-[#5668FF] dark:text-[#7888FF]"
            style={{ textShadow: '-3px 0px 0px rgba(0,255,255,0.6), 3px 0px 0px rgba(255,0,255,0.6)' }}
          >
            Zero compromises.
          </span>
        </h1>
      </div>

      {/* Cinematic Spotlight Carousel */}
      <div className="relative w-full max-w-7xl h-[420px] mx-auto flex items-center justify-center z-20">
        {tools.map((tool, index) => {
          const isActive = index === activeIndex;
          const isLeft = index === (activeIndex - 1 + tools.length) % tools.length;
          const isRight = index === (activeIndex + 1) % tools.length;

          let xOffset = "0%";
          let scale = 1;
          let zIndex = 0;
          let blur = "blur(0px)";
          let opacity = 1;

          if (isActive) {
            xOffset = "0%"; scale = 1; zIndex = 30; opacity = 1; blur = "blur(0px)";
          } else if (isLeft) {
            xOffset = "-75%"; scale = 0.85; zIndex = 10; opacity = 0.3; blur = "blur(8px)";
          } else if (isRight) {
            xOffset = "75%"; scale = 0.85; zIndex = 10; opacity = 0.3; blur = "blur(8px)";
          }

          return (
            <motion.div
              key={tool.id}
              animate={{ x: xOffset, scale, zIndex, opacity, filter: blur }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="absolute w-[90%] md:w-full max-w-[460px]"
            >
              <div 
                onClick={() => {
                  if (!isActive) setActiveIndex(index);
                }}
                className={`relative overflow-hidden bg-white/40 dark:bg-[#0a0f1c]/60 backdrop-blur-3xl p-10 rounded-[2.5rem] border ${isActive ? 'border-white/60 dark:border-slate-700 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 cursor-default' : 'border-white/20 dark:border-slate-800/50 cursor-pointer shadow-none'} flex flex-col items-start text-left transition-all duration-500 h-[420px] group`}
              >
                
                {/* Internal Ambient Glow */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-0 transition-opacity duration-700 ${isActive ? 'opacity-30 dark:opacity-20' : ''} ${tool.glowColor}`} />

                {/* Top Half: Icon & Text */}
                <div className="relative z-10 w-full flex flex-col flex-grow">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 transition-transform duration-500 ${isActive ? 'scale-100' : 'scale-95'} ${tool.iconColor}`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tool.svg}
                    </svg>
                  </div>
                  
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-4">
                    {tool.title}
                  </h3>
                  
                  <p className="text-slate-500 dark:text-slate-400 text-base font-light leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                {/* Bottom Half: Action Bar */}
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 w-full flex items-center justify-between mt-auto pt-6 border-t border-slate-200/60 dark:border-slate-700/60 group/btn cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(tool.path);
                    }}
                  >
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                      Initialize Tool
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 transition-transform duration-300 group-hover/btn:translate-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Carousel Controls */}
      <div className="flex gap-6 mt-12 z-30 mb-24">
        <button 
          onClick={handlePrev}
          className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-110 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <button 
          onClick={handleNext}
          className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-110 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      <Footer />
    </div>
  );
}
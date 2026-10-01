import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';
import Footer from './Footer';
import { useDocumentTitle } from './useDocumentTitle';

export default function Home() {
  useDocumentTitle('Home');
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
    },
    {
      id: 'history',
      title: 'Action History',
      desc: 'Instantly retrieve and download your previously processed files. Everything stays locally on your device.',
      path: '/history',
      iconColor: 'text-amber-600 dark:text-amber-400',
      glowColor: 'bg-amber-500',
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    },
    {
      id: 'format-converter',
      title: 'Format Converter',
      desc: 'Seamlessly convert between WebP, PNG, JPEG, and AVIF formats entirely in your browser using WASM.',
      path: '/convert',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      glowColor: 'bg-cyan-500',
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
    },
    {
      id: 'image-resizer',
      title: 'Image Resizer',
      desc: 'Resize images by exact pixel dimensions or percentage scale while maintaining perfect aspect ratios.',
      path: '/resize',
      iconColor: 'text-rose-600 dark:text-rose-400',
      glowColor: 'bg-rose-500',
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
    },
    {
      id: 'pdf-tools',
      title: 'PDF Studio',
      desc: 'Merge, split, compress, and manipulate PDF documents locally with zero privacy compromises.',
      path: '/pdf-tools',
      iconColor: 'text-orange-600 dark:text-orange-400',
      glowColor: 'bg-orange-500',
      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-black flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300 pb-20">
      
      <div className="absolute top-0 left-0 w-full p-5 md:px-12 flex justify-between items-center z-50">
        <Logo />
      </div>

      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center mb-8 md:mb-16">
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-2 md:mb-4 leading-tight transition-colors px-4 pb-2">
          Flawless files. <br className="hidden sm:block" />
          <span 
            className="text-[#5668FF] drop-shadow-sm"
            style={{ textShadow: '-2px 0px 0px rgba(0,255,255,0.8), 2px 0px 0px rgba(255,0,255,0.8)' }}
          >
            Zero compromises.
          </span>
        </h1>
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 z-20 pb-20">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`w-full h-full ${index === 6 ? 'md:col-span-2 lg:col-span-1 lg:col-start-2' : ''}`}
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                navigate(tool.path);
              }}
              className="relative overflow-hidden bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-6 md:p-8 rounded-[2rem] border border-white/30 dark:border-slate-800/60 hover:border-white/80 dark:hover:border-slate-600/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] hover:ring-1 hover:ring-[#5668FF]/30 cursor-pointer flex flex-col items-start text-left transition-all duration-500 h-[320px] md:h-[360px] group"
            >
              <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-0 transition-opacity duration-700 group-hover:opacity-30 dark:group-hover:opacity-20 ${tool.glowColor}`} />

              <div className="relative z-10 w-full flex flex-col flex-grow">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 transition-transform duration-500 group-hover:scale-110 ${tool.iconColor}`}>
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {tool.svg}
                  </svg>
                </div>
                
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2 md:mb-3">
                  {tool.title}
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm font-light leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              <div className="relative z-10 w-full flex items-center justify-between mt-auto pt-4 border-t border-slate-200/60 dark:border-slate-700/60 group/btn">
                <span className="text-[10px] md:text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                  Initialize Tool
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 transition-transform duration-300 group-hover/btn:translate-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
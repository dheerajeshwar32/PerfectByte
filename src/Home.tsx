import { Link } from 'react-router-dom';

export default function Home() {
  const tools = [
    {
      id: 'target-compress',
      title: 'Target File Size',
      desc: 'Compress or expand an image to an exact byte size. Perfect for strict portal limits.',
      path: '/target-size',
      iconColor: 'text-blue-500 dark:text-blue-400',
      bgHover: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10',
      borderHover: 'group-hover:border-blue-200 dark:group-hover:border-blue-500/30'
    },
    {
      id: 'bulk-compress',
      title: 'Bulk Compression',
      desc: 'Process entire folders of images instantly, reducing footprint while keeping quality.',
      path: '/bulk-compress',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgHover: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10',
      borderHover: 'group-hover:border-emerald-200 dark:group-hover:border-emerald-500/30'
    },
    {
      id: 'ai-assistant',
      title: 'AI File Assistant',
      desc: 'Type what you need—"compress to 100KB" or "remove blank pages"—and let AI handle it.',
      path: '/assistant',
      iconColor: 'text-violet-500 dark:text-violet-400',
      bgHover: 'group-hover:bg-violet-50 dark:group-hover:bg-violet-500/10',
      borderHover: 'group-hover:border-violet-200 dark:group-hover:border-violet-500/30'
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center py-20 px-4 font-sans selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-150">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 backdrop-blur-md text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 shadow-sm transition-colors duration-150">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Powered by Gemini AI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 mb-6 tracking-tight transition-colors duration-150">
          Flawless files. <br className="hidden md:block" />
          Zero compromises.
        </h1>
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed transition-colors duration-150">
          The privacy-first utility toolkit. Compress to exact byte sizes, clean PDFs, and batch process images entirely locally on your device.
        </p>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full relative z-10">
        {tools.map((tool) => (
          <Link 
            key={tool.id} 
            to={tool.path}
            className={`block bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${tool.borderHover}`}
          >
            <div className={`w-14 h-14 mb-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center transition-colors duration-300 ${tool.iconColor} ${tool.bgHover}`}>
               {tool.id === 'target-compress' && (
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
               )}
               {tool.id === 'bulk-compress' && (
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
               )}
               {tool.id === 'ai-assistant' && (
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"></path></svg>
               )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {tool.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm transition-colors duration-300">
              {tool.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Decorative background blurs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-[120px] opacity-50 transition-colors duration-700"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-100/50 dark:bg-purple-900/20 blur-[120px] opacity-50 transition-colors duration-700"></div>
      </div>
    </div>
  );
}
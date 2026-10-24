import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useDocumentTitle } from './useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('404 - Page Not Found');

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-8 md:p-16 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-2xl w-[calc(100%-2rem)] mx-auto text-center relative z-10 mt-8 mb-16">
        <span
          className="text-8xl md:text-9xl font-black font-mono text-[#5668FF] leading-none mb-4"
          style={{ textShadow: '-3px 0px 0px rgba(0,255,255,0.6), 3px 0px 0px rgba(255,0,255,0.6)' }}
        >
          404
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-900 dark:text-white mb-3">
          Destination Unreachable
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md mb-8">
          The requested page does not exist or has been relocated. All compression tools remain online and accessible from the homepage.
        </p>

        <Link
          to="/"
          className="px-8 py-3.5 rounded-2xl font-bold text-sm bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_8px_30px_rgba(86,104,255,0.3)] hover:shadow-[0_12px_40px_rgba(86,104,255,0.4)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
        >
          Return to Tools
        </Link>
      </main>

      <Footer />
    </div>
  );
}


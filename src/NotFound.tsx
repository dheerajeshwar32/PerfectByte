import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useDocumentTitle } from './useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('404 - Page Not Found');

  return (
    <div className="min-h-dvh pb-canvas flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-200">
      <Navbar />

      <main
        className="flex-1 flex flex-col items-center justify-center pb-panel p-8 md:p-14 rounded-3xl max-w-xl w-[calc(100%-2rem)] mx-auto text-center relative z-10 mt-6 mb-16 border border-[var(--pb-border)]"
        style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
      >
        <span className="text-7xl md:text-8xl font-black font-mono text-[#5668FF] leading-none mb-3">
          404
        </span>
        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-2">
          Destination Unreachable
        </h1>
        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
          The requested route is not available. Precision client-side tools are available in the workspace.
        </p>

        <Link
          to="/"
          className="px-6 py-3 rounded-xl font-bold text-xs font-mono uppercase tracking-wider bg-[#5668FF] hover:bg-[#4858E0] text-white shadow-[0_4px_16px_rgba(86,104,255,0.4)] transition-all"
        >
          Return to Tools
        </Link>
      </main>

      <Footer />
    </div>
  );
}

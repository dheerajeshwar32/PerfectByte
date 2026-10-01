// Shared Navbar component (#5: Extract shared Navbar)
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <Link
      to="/"
      className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-indigo-900/80 backdrop-blur-md border border-slate-200 dark:border-indigo-800 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 hover:scale-105 hover:shadow-md transition-all"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
      </svg>
      Back to Tools
    </Link>
  );
}


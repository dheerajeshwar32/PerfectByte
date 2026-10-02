// Shared Navbar component (#5: Extract shared Navbar)
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <Link
      to="/"
      className="group fixed top-6 left-6 z-50 flex items-center gap-2.5 px-5 py-2.5 bg-white/70 dark:bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/50 dark:border-indigo-800/50 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5668FF] dark:hover:text-[#7888FF] hover:border-[#5668FF]/30 dark:hover:border-[#7888FF]/30 hover:shadow-[0_8px_25px_rgba(86,104,255,0.12)] active:scale-[0.97] transition-all duration-300"
    >
      <span className="group-hover:-translate-x-1 transition-transform duration-300">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
      </span>
      <span className="tracking-wide">Back to Tools</span>
    </Link>
  );
}

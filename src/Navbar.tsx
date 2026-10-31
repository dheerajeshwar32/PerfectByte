import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav aria-label="Navigation">
      <Link
        to="/"
        aria-label="Back to Tools"
        className="group fixed top-5 left-5 md:top-6 md:left-6 z-50 flex items-center gap-2.5 px-4 py-2 pb-panel rounded-xl text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#5668FF] dark:hover:text-[#7888FF] transition-all duration-200"
        style={{
          boxShadow: 'inset 0 1px 0 0 var(--pb-specular)',
        }}
      >
        <span className="group-hover:-translate-x-1 transition-transform duration-200">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
        </span>
        <span className="tracking-wide">BACK TO TOOLS</span>
      </Link>
    </nav>
  );
}

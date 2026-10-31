import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <footer className="w-full mt-auto z-40 relative">
      {/* Specular border transition */}
      <div className="h-16 bg-gradient-to-b from-transparent to-[var(--pb-surface)]"></div>

      {/* Main footer body with machined-aluminum specular finish */}
      <div className="bg-[var(--pb-surface)] border-t border-[var(--pb-border)] relative overflow-hidden"
        style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8">

            {/* Column 1: About Me Toggle */}
            <div className="md:col-span-5 flex flex-col">
              <button
                onClick={() => setShowAbout(!showAbout)}
                aria-expanded={showAbout}
                aria-controls="about-me-panel"
                className="group flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2 tracking-tight hover:text-[#5668FF] transition-all duration-200 w-fit text-left focus:outline-none font-mono"
              >
                <span>ABOUT PERFECTBYTE</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showAbout ? 'rotate-180 text-[#5668FF]' : 'text-zinc-400 group-hover:text-[#5668FF]'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              <div
                id="about-me-panel"
                className={`grid transition-all duration-300 ease-in-out ${showAbout ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="pb-control rounded-2xl p-4 border border-[var(--pb-border)]">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                      Nagula Dheeraj Eshwar Prudhvi
                    </h3>
                    <p className="text-xs text-zinc-500 mb-2 font-mono">
                      B.Tech Computer Science &amp; Engineering &apos;28 · VIT Vellore
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">
                      Zero-compromise client-side systems, SIMD WebAssembly optimization, and high-precision developer tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Connect */}
            <div className="md:col-span-3 md:col-start-7 flex flex-col">
              <h2 className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest mb-4">
                CONNECT
              </h2>
              <ul className="flex flex-col gap-2.5 text-xs font-mono">
                <li>
                  <a
                    href="https://www.linkedin.com/in/nagula-dheeraj-eshwar-b297a2320"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 hover:text-[#5668FF] transition-colors"
                  >
                    <span className="w-5 h-5 rounded pb-control flex items-center justify-center text-[10px] font-bold">in</span>
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/dheerajeshwar32"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <span className="w-5 h-5 rounded pb-control flex items-center justify-center text-[10px] font-bold">gh</span>
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:dheerajeshwarnagula@gmail.com"
                    className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <span className="w-5 h-5 rounded pb-control flex items-center justify-center text-[10px] font-bold">@</span>
                    Email
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Feedback */}
            <div className="md:col-span-3 md:col-start-10 flex flex-col">
              <h2 className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest mb-4">
                FEEDBACK
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                Found a bug or need custom limits? Open a ticket on GitHub.
              </p>

              <a
                href="https://github.com/dheerajeshwar32/PerfectByte/issues"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 pb-control text-xs font-mono font-bold rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-[#5668FF] transition-colors w-fit border border-[var(--pb-border)]"
              >
                <span>Report Issue →</span>
              </a>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--pb-border)] py-4 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#5668FF]">PB</span>
            <span>PerfectByte © {new Date().getFullYear()}</span>
          </div>
          <div>
            <Link to="/privacy" className="hover:text-[#5668FF] transition-colors">
              Privacy Architecture Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

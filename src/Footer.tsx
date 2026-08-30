import { useState } from 'react';

export default function Footer() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <footer className="w-full border-t border-slate-800 bg-slate-900 dark:bg-[#050914] mt-auto z-40 relative">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600&display=swap');`}
      </style>
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

          {/* Column 1: About Me Toggle */}
          <div className="md:col-span-5 flex flex-col">
            <button
              onClick={() => setShowAbout(!showAbout)}
              aria-expanded={showAbout}
              aria-controls="about-me-panel"
              className="group flex items-center gap-2 text-lg font-bold text-white mb-3 tracking-tight hover:text-[#7888FF] transition-colors w-fit text-left focus:outline-none"
            >
              About Me
              <svg
                className={`w-5 h-5 transition-transform duration-300 ease-in-out ${showAbout ? 'rotate-180 text-[#7888FF]' : 'text-slate-500 group-hover:text-[#7888FF]'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div
              id="about-me-panel"
              className={`grid transition-all duration-500 ease-in-out ${showAbout ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
            >
              <div className="overflow-hidden">
                <h4 className="text-base font-bold text-slate-100 mb-1">
                  Nagula Dheeraj Eshwar Prudhvi
                </h4>
                <p className="text-sm font-medium text-slate-400 mb-2">
                  B.Tech Computer Science & Engineering (Core) '28
                  <br />
                  Vellore Institute of Technology (VIT), Vellore
                </p>
                <p className="text-sm text-slate-400 font-light leading-relaxed mt-4 max-w-sm">
                  Engineering high-performance web systems and writing efficient algorithms. I care about speed, architecture, and zero-compromise code.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Connect */}
          <div className="md:col-span-2 md:col-start-8 flex flex-col">
            <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">
              Connect
            </h4>
            <ul className="flex flex-col gap-4">
              <li>
                <a
                href="https://www.linkedin.com/in/nagula-dheeraj-eshwar-b297a2320"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 text-sm text-slate-400 hover:text-[#7888FF] transition-colors"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/dheerajeshwar32"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:dheerajeshwarnagula@gmail.com"
                  className="group flex items-center gap-3 text-sm text-slate-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Email
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Feedback */}
          <div className="md:col-span-3 md:col-start-10 flex flex-col">
            <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">
              Feedback
            </h4>
            <p className="text-sm text-slate-400 font-light mb-4">
              Encountered a bug or have a feature request? Let me know via GitHub Issues.
            </p>
            
            <a
              href="https://github.com/dheerajeshwar32/PerfectByte/issues"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors w-fit shadow-sm"
            >
              Submit Feedback
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>

        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="w-full border-t border-slate-800/80 bg-slate-950 dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span
              className="text-base font-semibold text-[#7888FF] leading-none"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                textShadow: '-1px 0px 0px #00FFFF, 1px 0px 0px #FF00FF'
              }}
            >
              PB
            </span>
            PerfectByte © {new Date().getFullYear()}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Architected for local-first privacy.
          </div>
        </div>
      </div>
    </footer>
  );
}
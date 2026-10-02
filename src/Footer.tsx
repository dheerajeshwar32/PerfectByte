import { useState } from 'react';

export default function Footer() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <footer className="w-full mt-auto z-40 relative">
      {/* Gradient fade from page → footer */}
      <div className="h-32 md:h-40 bg-gradient-to-b from-transparent via-[#131835]/60 to-[#0c1029]"></div>
      
      {/* Main footer body */}
      <div className="bg-[#0c1029] relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#5668FF]/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none"></div>
        
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600&display=swap');`}
        </style>

        <div className="max-w-7xl mx-auto px-8 md:px-12 py-16 md:py-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

            {/* Column 1: About Me Toggle */}
            <div className="md:col-span-5 flex flex-col">
              <button
                onClick={() => setShowAbout(!showAbout)}
                aria-expanded={showAbout}
                aria-controls="about-me-panel"
                className="group flex items-center gap-2.5 text-lg font-semibold text-white/90 mb-3 tracking-tight hover:text-[#7888FF] transition-all duration-300 w-fit text-left focus:outline-none"
              >
                About Me
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ease-out ${showAbout ? 'rotate-180 text-[#7888FF]' : 'text-slate-500 group-hover:text-[#7888FF]'}`}
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
                  <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06]">
                    <h4 className="text-base font-semibold text-white/90 mb-1">
                      Nagula Dheeraj Eshwar Prudhvi
                    </h4>
                    <p className="text-sm text-slate-400/80 mb-3">
                      B.Tech Computer Science & Engineering (Core) '28
                      <br />
                      Vellore Institute of Technology (VIT), Vellore
                    </p>
                    <p className="text-sm text-slate-500 font-light leading-relaxed max-w-sm">
                      Engineering high-performance web systems and writing efficient algorithms. I care about speed, architecture, and zero-compromise code.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Connect */}
            <div className="md:col-span-2 md:col-start-8 flex flex-col">
              <h4 className="text-[11px] font-semibold text-white/40 mb-6 uppercase tracking-[0.2em]">
                Connect
              </h4>
              <ul className="flex flex-col gap-3.5">
                <li>
                  <a
                  href="https://www.linkedin.com/in/nagula-dheeraj-eshwar-b297a2320"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 text-sm text-slate-400 hover:text-[#7888FF] transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#5668FF]/10 group-hover:border-[#5668FF]/20 transition-all duration-200">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/dheerajeshwar32"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/15 transition-all duration-200">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:dheerajeshwarnagula@gmail.com"
                    className="group flex items-center gap-3 text-sm text-slate-400 hover:text-rose-400 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-all duration-200">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    Email
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Feedback */}
            <div className="md:col-span-3 md:col-start-10 flex flex-col">
              <h4 className="text-[11px] font-semibold text-white/40 mb-6 uppercase tracking-[0.2em]">
                Feedback
              </h4>
              <p className="text-sm text-slate-500 font-light leading-relaxed mb-5">
                Encountered a bug or have a feature request? Let me know via GitHub Issues.
              </p>
              
              <a
                href="https://github.com/dheerajeshwar32/PerfectByte/issues"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-white/[0.06] backdrop-blur-sm text-white/80 text-sm font-semibold rounded-xl border border-white/[0.08] hover:bg-[#5668FF]/20 hover:border-[#5668FF]/30 hover:text-white transition-all duration-300 w-fit"
              >
                Submit Feedback
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </a>
            </div>

          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-8 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">
              <span
                className="text-base font-semibold text-[#7888FF] leading-none"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  textShadow: '-1px 0px 0px rgba(0,255,255,0.4), 1px 0px 0px rgba(255,0,255,0.4)'
                }}
              >
                PB
              </span>
              PerfectByte © {new Date().getFullYear()}
            </div>
            <div className="text-[11px] text-slate-600 font-medium tracking-wider uppercase">
              Architected for local-first privacy.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
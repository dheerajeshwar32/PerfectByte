import sys

with open('src/Home.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the badges
badge_replacement = '''              {activeIndex === 2 && (
                <>
                  <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Powered by <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Gemini AI</span>
                  </span>
                </>
              )}
              {activeIndex === 3 && (
                <>
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Track Your Savings</span>
                </>
              )}
              {activeIndex === 4 && (
                <>
                  <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Any Format, Anywhere</span>
                </>
              )}
              {activeIndex === 5 && (
                <>
                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Pixel-Perfect Resizing</span>
                </>
              )}
              {activeIndex === 6 && (
                <>
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Complete PDF Control</span>
                </>
              )}'''

content = content.replace(
'''              {activeIndex === 2 && (
                <>
                  <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Powered by <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Gemini AI</span>
                  </span>
                </>
              )}''', badge_replacement)

# 2. Add the else opacity = 0 block
opacity_replacement = '''          if (isActive) {
            xOffset = "0%"; scale = 1; zIndex = 30; opacity = 1; blur = "blur(0px)";
          } else if (isLeft) {
            xOffset = "-75%"; scale = 0.85; zIndex = 10; opacity = 0.3; blur = "blur(8px)";
          } else if (isRight) {
            xOffset = "75%"; scale = 0.85; zIndex = 10; opacity = 0.3; blur = "blur(8px)";
          } else {
            xOffset = "0%"; scale = 0.7; zIndex = 0; opacity = 0; blur = "blur(10px)";
          }'''

content = content.replace(
'''          if (isActive) {
            xOffset = "0%"; scale = 1; zIndex = 30; opacity = 1; blur = "blur(0px)";
          } else if (isLeft) {
            xOffset = "-75%"; scale = 0.85; zIndex = 10; opacity = 0.3; blur = "blur(8px)";
          } else if (isRight) {
            xOffset = "75%"; scale = 0.85; zIndex = 10; opacity = 0.3; blur = "blur(8px)";
          }''', opacity_replacement)


# 3. Enhance styling

# Update title gradient & shadow
title_replacement = '''        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-2 md:mb-4 leading-tight transition-colors px-4 pb-2">
          Flawless files. <br className="hidden sm:block" />
          <span 
            className="text-[#5668FF] drop-shadow-sm"
            style={{ textShadow: '-2px 0px 0px rgba(0,255,255,0.8), 2px 0px 0px rgba(255,0,255,0.8)' }}
          >
            Zero compromises.
          </span>
        </h1>'''

content = content.replace(
'''        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 md:mb-4 leading-tight transition-colors px-4">
          Flawless files. <br className="hidden sm:block" />
          <span 
            className="text-[#5668FF] dark:text-[#7888FF]"
            style={{ textShadow: '-3px 0px 0px rgba(0,255,255,0.6), 3px 0px 0px rgba(255,0,255,0.6)' }}
          >
            Zero compromises.
          </span>
        </h1>''', title_replacement)

# Update Carousel Card styling
card_replacement = '''                className={`relative overflow-hidden bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border ${isActive ? 'border-white/80 dark:border-slate-600/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-[#5668FF]/10 dark:ring-[#5668FF]/30 cursor-default' : 'border-white/30 dark:border-slate-800/60 cursor-pointer shadow-none'} flex flex-col items-start text-left transition-all duration-500 h-[360px] md:h-[420px] group`}'''

content = content.replace(
'''                className={`relative overflow-hidden bg-white/40 dark:bg-[#0a0f1c]/60 backdrop-blur-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border ${isActive ? 'border-white/60 dark:border-slate-700 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 cursor-default' : 'border-white/20 dark:border-slate-800/50 cursor-pointer shadow-none'} flex flex-col items-start text-left transition-all duration-500 h-[360px] md:h-[420px] group`}''', card_replacement)

# Update Main background
bg_replacement = '''    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-black flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300 pb-20">'''

content = content.replace(
'''    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300 pb-20">''', bg_replacement)


with open('src/Home.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

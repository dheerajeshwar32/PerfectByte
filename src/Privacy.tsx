import Navbar from './Navbar';
import Footer from './Footer';
import { useDocumentTitle } from './useDocumentTitle';

export default function Privacy() {
  useDocumentTitle('Privacy Architecture');

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-white dark:from-[#080B14] dark:via-[#0D1220] dark:to-[#050810] flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>
      <Navbar />

      <main className="flex-1 bg-white/50 dark:bg-[#0a0f1c]/70 backdrop-blur-3xl p-8 md:p-14 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/80 dark:border-indigo-800/60 max-w-4xl w-[calc(100%-2rem)] mx-auto text-left relative z-10 mt-4 mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <span className="text-xs font-bold font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Zero-Server Architecture
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-900 dark:text-white">
              Privacy & Security Policy
            </h1>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-8">
          PerfectByte was engineered from the ground up on a local-first philosophy. Unlike conventional cloud compression platforms, your files are never uploaded to remote processing servers.
        </p>

        <div className="space-y-6">
          <section className="p-6 rounded-2xl bg-white/60 dark:bg-indigo-900/30 border border-slate-200/60 dark:border-indigo-800/60">
            <h2 className="text-lg font-bold text-indigo-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🔒</span> 1. Your Files Never Leave Your Device
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              All image conversions, target compression calculations, rasterization, and PDF manipulations are executed 100% inside your browser using sandboxed WebAssembly (WASM) modules and HTML5 Canvas hardware acceleration. We run zero backend file conversion servers.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/60 dark:bg-indigo-900/30 border border-slate-200/60 dark:border-indigo-800/60">
            <h2 className="text-lg font-bold text-indigo-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🤖</span> 2. AI Command Center Transparency
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              When using the AI Assistant, only your text command (e.g., &quot;compress to 100KB&quot;) along with non-sensitive file metadata (file name, MIME type, and file size in bytes) is routed to Google Gemini to interpret your intent. <strong className="text-indigo-900 dark:text-white font-semibold">Your file contents and byte payloads are never transmitted to any AI model or external API.</strong>
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/60 dark:bg-indigo-900/30 border border-slate-200/60 dark:border-indigo-800/60">
            <h2 className="text-lg font-bold text-indigo-900 dark:text-white mb-2 flex items-center gap-2">
              <span>💾</span> 3. Client-Side History Only
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your compression history records only metadata (file name, original byte count, compressed byte count, and timestamp) in your browser&apos;s local storage. No file content is retained. You can purge this data at any moment with the &quot;Clear History&quot; button.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/60 dark:bg-indigo-900/30 border border-slate-200/60 dark:border-indigo-800/60">
            <h2 className="text-lg font-bold text-indigo-900 dark:text-white mb-2 flex items-center gap-2">
              <span>✈️</span> 4. Full Offline Capability
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              As a Progressive Web App (PWA), PerfectByte caches all application code, fonts, and WebAssembly decoders locally via service workers. Once cached, all tools (excluding AI chat queries) operate completely offline without an active internet connection.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

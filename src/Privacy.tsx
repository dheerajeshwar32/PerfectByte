import Navbar from './Navbar';
import Footer from './Footer';
import { useDocumentTitle } from './useDocumentTitle';

export default function Privacy() {
  useDocumentTitle('Privacy Architecture');

  return (
    <div className="min-h-dvh pb-canvas flex flex-col items-center justify-start pt-20 md:pt-24 relative overflow-x-hidden font-sans transition-colors duration-200">
      <Navbar />

      <main
        className="flex-1 pb-panel p-6 md:p-12 rounded-3xl max-w-4xl w-[calc(100%-2rem)] mx-auto text-left relative z-10 mt-2 mb-16 border border-[var(--pb-border)]"
        style={{ boxShadow: 'inset 0 1px 0 0 var(--pb-specular)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold block">
              ZERO-SERVER RUNTIME GUARANTEE
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
              Privacy &amp; Security Policy
            </h1>
          </div>
        </div>

        <p className="text-zinc-600 dark:text-zinc-300 text-sm md:text-base leading-relaxed mb-6 font-medium">
          PerfectByte is built on a local-first architecture. Unlike conventional cloud compression platforms, your files are never uploaded to remote processing servers.
        </p>

        <div className="space-y-4">
          <section className="p-5 rounded-2xl pb-control border border-[var(--pb-border)]">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 flex items-center gap-2">
              <span>🔒</span> 1. Your Files Never Leave Your Device
            </h2>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              All image conversions, target compression calculations, rasterization, and PDF manipulations execute 100% inside your browser using sandboxed WebAssembly (WASM) modules and HTML5 Canvas hardware acceleration. We run zero backend file conversion servers.
            </p>
          </section>

          <section className="p-5 rounded-2xl pb-control border border-[var(--pb-border)]">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 flex items-center gap-2">
              <span>🤖</span> 2. AI Command Center Transparency
            </h2>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When using the AI Assistant, only your text command along with non-sensitive file metadata (file name, MIME type, and file size in bytes) is routed to interpret your intent. <strong className="text-zinc-900 dark:text-white font-semibold">Your file contents and byte payloads are never transmitted to any AI model or external API.</strong>
            </p>
          </section>

          <section className="p-5 rounded-2xl pb-control border border-[var(--pb-border)]">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 flex items-center gap-2">
              <span>🧹</span> 3. Zero Telemetry &amp; Metadata Stripping
            </h2>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              During processing, embedded EXIF metadata, GPS coordinates, camera serial numbers, and device fingerprints are automatically stripped to safeguard your identity. History records stay strictly within your browser&apos;s localStorage and can be wiped instantly.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

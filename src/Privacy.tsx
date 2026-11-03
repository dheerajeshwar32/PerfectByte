import { Link } from 'react-router-dom';
import { Lock, Sparkles, ShieldCheck, Shield, Zap, ArrowLeft } from 'lucide-react';
import Footer from './Footer';
import { useDocumentTitle } from './useDocumentTitle';

export default function Privacy() {
  useDocumentTitle('Privacy & Security Policy');

  return (
    <div className="min-h-screen w-full bg-[#F6F8FC] dark:bg-[#0E1229] py-10 md:py-16 px-4 flex flex-col items-center justify-center transition-colors duration-300">
      <main className="w-full max-w-3xl mx-auto bg-white/95 dark:bg-[#11152B]/95 backdrop-blur-2xl border border-[#E2E8F8] dark:border-[#262E5A] rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_16px_50px_-12px_rgba(45,50,90,0.08)] relative">
        {/* Navigation pill */}
        <Link
          to="/"
          aria-label="Back to Tools"
          className="text-[#2D325A] dark:text-[#F0F4FF] bg-white dark:bg-[#151A36] border border-[#DCE6FA] dark:border-[#2B3566] hover:border-[#5268FF] px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1.5 w-fit mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO TOOLS</span>
        </Link>

        {/* Security Header Badge */}
        <div className="flex flex-col items-start mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] dark:bg-[#1E264D] border border-[#C7D4FF] dark:border-[#334185] flex items-center justify-center text-[#5268FF] shrink-0 mb-4 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-[#5268FF] text-xs font-bold tracking-widest uppercase mb-1">
            ZERO-KNOWLEDGE ARCHITECTURE
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#2D325A] dark:text-[#F0F4FF]">
            Privacy &amp; Security Policy
          </h1>
          <p className="text-sm sm:text-base text-[#5A628A] dark:text-[#9BA6D1] leading-relaxed mt-2">
            PerfectByte is engineered from the ground up on a strict client-side architecture. By eliminating backend file ingestion, we guarantee that your sensitive documents and media never leave your hardware perimeter.
          </p>
        </div>

        {/* Inner Policy Cards */}
        <div className="space-y-4 mt-8">
          {/* Card 1 */}
          <section className="bg-[#F4F7FF] dark:bg-[#151A36] border border-[#DCE6FA] dark:border-[#252D58] rounded-2xl p-5 sm:p-6 transition-all hover:border-[#5268FF]/40">
            <h2 className="text-sm sm:text-base font-bold text-[#2D325A] dark:text-[#F0F4FF] flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#1E264D] border border-[#DCE6FA] dark:border-[#334185] flex items-center justify-center shrink-0 shadow-2xs">
                <Lock className="w-4 h-4 text-[#5268FF]" />
              </div>
              <span>1. Client-Side Sandboxing &amp; Zero Server Ingestion</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#5A628A] dark:text-[#9BA6D1] leading-relaxed mt-2">
              All file parsing, image compression, format conversion, and cryptographic PDF operations execute 100% locally inside your browser runtime utilizing WebAssembly and hardware acceleration. We operate zero file-storage servers, ensuring absolute data sovereignty.
            </p>
          </section>

          {/* Card 2 */}
          <section className="bg-[#F4F7FF] dark:bg-[#151A36] border border-[#DCE6FA] dark:border-[#252D58] rounded-2xl p-5 sm:p-6 transition-all hover:border-[#5268FF]/40">
            <h2 className="text-sm sm:text-base font-bold text-[#2D325A] dark:text-[#F0F4FF] flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#1E264D] border border-[#DCE6FA] dark:border-[#334185] flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4 text-[#5268FF]" />
              </div>
              <span>2. Zero-Knowledge AI Assistant Routing</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#5A628A] dark:text-[#9BA6D1] leading-relaxed mt-2">
              When executing operations via the AI Command Center, only your abstract text intent and non-sensitive file parameters (such as container format and byte length) are transmitted for parsing.{' '}
              <strong className="font-semibold text-[#2D325A] dark:text-[#E0E7FF]">
                Your raw file contents and binary payloads are never routed to any LLM model or external endpoint.
              </strong>
            </p>
          </section>

          {/* Card 3 */}
          <section className="bg-[#F4F7FF] dark:bg-[#151A36] border border-[#DCE6FA] dark:border-[#252D58] rounded-2xl p-5 sm:p-6 transition-all hover:border-[#5268FF]/40">
            <h2 className="text-sm sm:text-base font-bold text-[#2D325A] dark:text-[#F0F4FF] flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#1E264D] border border-[#DCE6FA] dark:border-[#334185] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#5268FF]" />
              </div>
              <span>3. Deterministic Metadata Scrubbing &amp; Local Persistence</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#5A628A] dark:text-[#9BA6D1] leading-relaxed mt-2">
              To safeguard your digital footprint, processing routines automatically purge embedded EXIF telemetry, geolocation tags, and device identifiers. Activity histories and audit ledgers persist exclusively within your browser&apos;s private indexed storage and can be purged instantly.
            </p>
          </section>
        </div>

        {/* Enterprise Trust Footer Row */}
        <div className="border-t border-[#DCE6FA] dark:border-[#262E5A] mt-8 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#848DB3] dark:text-[#6E78A3]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#5268FF]" />
            <span>Encryption: TLS 1.3 / In-Browser Sandbox</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#5268FF]" />
            <span>Cloud Telemetry: 0 Bytes</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#5268FF]" />
            <span>Compliance: GDPR &amp; SOC-2 Aligned Design</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Navbar() {
  return (
    <nav aria-label="Navigation">
      <Link
        to="/"
        aria-label="Back to Tools"
        className="group fixed top-5 left-5 md:top-6 md:left-6 z-50 flex items-center gap-2 text-[#2D325A] dark:text-[#F0F4FF] bg-white/90 dark:bg-[#151A36]/90 backdrop-blur-md border border-[#DCE6FA] dark:border-[#2B3566] hover:border-[#5268FF] px-4 py-2 rounded-full text-xs font-semibold shadow-xs transition active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span className="tracking-wide">BACK TO TOOLS</span>
      </Link>
    </nav>
  );
}

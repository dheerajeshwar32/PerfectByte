import { Link, useLocation } from 'react-router-dom';
import { Target, Zap, FileText, Maximize2, Sparkles } from 'lucide-react';

interface DockTab {
  path: string;
  label: string;
  icon: typeof Target;
}

const TABS: DockTab[] = [
  { path: '/target-size', label: 'Target Size', icon: Target },
  { path: '/bulk-compress', label: 'Bulk', icon: Zap },
  { path: '/pdf-tools', label: 'PDF Studio', icon: FileText },
  { path: '/resize', label: 'Resizer', icon: Maximize2 },
  { path: '/assistant', label: 'AI Command', icon: Sparkles },
];

/**
 * Native iOS Mobile Bottom Tab Dock (< 768px only).
 * Maps over 5 tools: Target Size, Bulk, PDF Studio, Resizer, AI Command.
 */
export default function BottomDock() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex md:hidden items-center justify-around bg-white/90 dark:bg-[#11152B]/92 backdrop-blur-2xl backdrop-saturate-150 border-t border-[#DCE6FA] dark:border-[#252D58] px-1.5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(45,50,90,0.08)]"
      aria-label="Mobile Studio Dock"
    >
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-1 transition-all active:scale-95 ${
              isActive
                ? 'text-[#5268FF] font-bold'
                : 'text-[#848DB3] dark:text-[#6E78A3] font-medium hover:text-[#5268FF]'
            }`}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div
              className={`flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[#EEF2FF] dark:bg-[#1E264D] px-3.5 py-0.5 rounded-full text-[#5268FF]'
                  : 'p-0.5'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight truncate max-w-[62px]">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

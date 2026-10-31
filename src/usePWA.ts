import { useState, useEffect } from 'react';

/** Detect if app is running as an installed PWA (standalone mode) */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isStandalone;
}

/** Detect if viewport is mobile-sized */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

/** Trigger haptic feedback if supported */
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** Share a file via native share sheet, with download fallback */
export async function shareOrDownload(file: File, url: string): Promise<void> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return;
    } catch {
      // User cancelled or share failed — fall through to download
    }
  }
  // Fallback: standard download
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
}

/** Sync the theme-color meta tag when dark mode changes */
export function syncThemeColor(isDark: boolean): void {
  const lightMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
  const darkMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
  
  // Also set a non-media theme-color for browsers that don't support media
  let genericMeta = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null;
  if (!genericMeta) {
    genericMeta = document.createElement('meta');
    genericMeta.name = 'theme-color';
    document.head.appendChild(genericMeta);
  }
  genericMeta.content = isDark ? '#0B0E1B' : '#FAFAFA';
  
  // Update the media-specific ones too
  if (lightMeta) (lightMeta as HTMLMetaElement).content = '#FAFAFA';
  if (darkMeta) (darkMeta as HTMLMetaElement).content = '#0B0E1B';
}

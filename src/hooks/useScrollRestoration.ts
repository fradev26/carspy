import { useEffect, useRef } from 'react';

const STORE_PREFIX = 'vatuur:scroll:';

/**
 * Persists and restores the window scroll position for a feed, so returning
 * from a detail page (/auto/:id) keeps both the loaded batches (TanStack Query
 * cache) and the scroll position instead of resetting to the top.
 */
export function useScrollRestoration(key: string, ready: boolean) {
  const restored = useRef(false);

  // Save continuously (cheap, rAF-throttled).
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        try {
          sessionStorage.setItem(STORE_PREFIX + key, String(window.scrollY));
        } catch {
          /* storage unavailable — non-critical */
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [key]);

  // Restore once data is on screen.
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(STORE_PREFIX + key);
    } catch {
      stored = null;
    }
    const y = stored ? Number(stored) : 0;
    if (!y) return;
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
  }, [key, ready]);
}

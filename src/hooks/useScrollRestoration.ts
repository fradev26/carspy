import { useEffect, useRef } from 'react';
import { useNavigationType } from 'react-router-dom';

/**
 * Bewaart de scrollpositie in de history-entry en herstelt die bij een
 * browser back/forward (POP). De browser-eigen restauratie wordt uitgezet,
 * omdat die te vroeg gebeurt: de lijst (infinite scroll + virtualisatie) is
 * dan nog niet opgebouwd, waardoor de pagina naar boven springt.
 *
 * @param key    unieke sleutel binnen history.state
 * @param ready  true zodra de lijst met de juiste hoogte gerenderd is
 */
export function useScrollRestoration(key: string, ready: boolean) {
  const navigationType = useNavigationType();
  const restored = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('scrollRestoration' in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  // Scrollpositie continu (per frame, gethrottled) in de history-entry schrijven.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const state = (window.history.state ?? {}) as Record<string, unknown>;
        try {
          window.history.replaceState({ ...state, [key]: window.scrollY }, '');
        } catch {
          /* replaceState kan in sommige embeds falen; scrollherstel is dan best-effort */
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key]);

  // Eenmalig herstellen zodra de lijst klaar is.
  useEffect(() => {
    if (restored.current || !ready || typeof window === 'undefined') return;
    restored.current = true;
    if (navigationType !== 'POP') return;
    const saved = (window.history.state as Record<string, unknown> | null)?.[key];
    if (typeof saved !== 'number' || saved <= 0) return;
    window.requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'auto' }));
  }, [ready, navigationType, key]);

  return restored;
}

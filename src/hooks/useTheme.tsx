import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ThemePref = 'system' | 'light' | 'dark';
type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemePref;
  resolvedTheme: Resolved;
  setTheme: (t: ThemePref) => Promise<void> | void;
}

const STORAGE_KEY = 'vatuur-theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemPrefers(): Resolved {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(): ThemePref {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function applyToDOM(resolved: Resolved) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemePref>(() => readStored());
  const [resolvedTheme, setResolvedTheme] = useState<Resolved>(() => {
    const t = readStored();
    return t === 'system' ? systemPrefers() : t;
  });

  // Apply on change
  useEffect(() => {
    const resolved: Resolved = theme === 'system' ? systemPrefers() : theme;
    setResolvedTheme(resolved);
    applyToDOM(resolved);
  }, [theme]);

  // Follow system when in 'system' — with robust fallbacks for browsers
  // where MediaQueryList 'change' events are unreliable (older Safari,
  // some WebViews, Samsung Internet, etc.).
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const sync = () => {
      const r: Resolved = mq.matches ? 'dark' : 'light';
      setResolvedTheme((prev) => {
        if (prev !== r) applyToDOM(r);
        return r;
      });
    };

    // 1) Modern API
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', sync);
    } else if (typeof (mq as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener === 'function') {
      // 2) Legacy Safari/WebKit fallback
      (mq as MediaQueryList & { addListener: (cb: () => void) => void }).addListener(sync);
    }

    // 3) Re-check when the tab regains focus or becomes visible
    //    (covers browsers that don't fire 'change' at all).
    const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVisible);

    // 4) Polling safety net (cheap: 1 boolean read every 30s)
    const interval = window.setInterval(sync, 30_000);

    // Initial sync in case state drifted before listeners attached
    sync();

    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', sync);
      } else if (typeof (mq as MediaQueryList & { removeListener?: (cb: () => void) => void }).removeListener === 'function') {
        (mq as MediaQueryList & { removeListener: (cb: () => void) => void }).removeListener(sync);
      }
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, [theme]);

  // Sync from server profile on login (server wins over local)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('theme_preference')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data as { theme_preference?: ThemePref } | null)?.theme_preference;
      if (remote && (remote === 'system' || remote === 'light' || remote === 'dark')) {
        window.localStorage.setItem(STORAGE_KEY, remote);
        setThemeState(remote);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const setTheme = useCallback(async (t: ThemePref) => {
    setThemeState(t);
    try { window.localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
    if (user) {
      await supabase.from('profiles').update({ theme_preference: t }).eq('id', user.id);
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

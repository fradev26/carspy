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

  // Follow system when in 'system'
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const r: Resolved = mq.matches ? 'dark' : 'light';
      setResolvedTheme(r);
      applyToDOM(r);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
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

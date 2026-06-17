import { forwardRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, Heart, Sparkles, Plus,
  Car, Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { AIFullscreenChat } from '@/modules/chat/AIFullscreenChat';

const consumerItems = [
  { icon: Home,     label: 'Home',       path: '/' },
  { icon: Search,   label: 'Zoeken',     path: '/zoeken' },
  { icon: Sparkles, label: 'AI',         path: null, isAI: true },
  { icon: Heart,    label: 'Favorieten', path: '/favorieten' },
  { icon: Plus,     label: 'Verkopen',   path: '/verkopen', authPath: '/auth' },
];

const dealerItems = [
  { icon: Home,     label: 'Home',         path: '/' },
  { icon: Search,   label: 'Zoeken',       path: '/zoeken' },
  { icon: Sparkles, label: 'SalesAI',      path: '/zakelijk' },
  { icon: Car,      label: 'Zakelijk',     path: '/zakelijk/voorraad' },
  { icon: Settings, label: 'Instellingen', path: '/zakelijk/instellingen' },
];

export const BottomNav = forwardRef<HTMLElement>(function BottomNav(_props, ref) {
  const location = useLocation();
  const { user } = useAuth();
  const { isDealer } = useProfile();
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const onNavigate = () => setAiOpen(false);
    window.addEventListener('vatuur:chat-navigate-listing', onNavigate);
    return () => window.removeEventListener('vatuur:chat-navigate-listing', onNavigate);
  }, []);

  useEffect(() => {
    let flag: string | null = null;
    try { flag = sessionStorage.getItem('vatuur:reopenChatOnBack'); } catch {}
    if (flag === '1' && !location.pathname.startsWith('/auto/')) {
      try { sessionStorage.removeItem('vatuur:reopenChatOnBack'); } catch {}
      setAiOpen(true);
    }
  }, [location.pathname]);

  const handleAiClose = () => {
    setAiOpen(false);
    try { sessionStorage.removeItem('vatuur:reopenChatOnBack'); } catch {}
  };

  const items = user && isDealer ? dealerItems : consumerItems;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-16 left-0 right-0 z-40 h-6 bg-gradient-to-t from-background/70 to-transparent lg:hidden safe-x"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      />
      <nav
        ref={ref}
        aria-label="Hoofdnavigatie"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 dark:border-white/[0.06] bg-card shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] lg:hidden safe-bottom safe-x"
      >
        <div className="flex items-center justify-around h-16">
          {items.map((item: any) => {
            if (item.isAI) {
              return (
                <button
                  key={item.label}
                  onClick={() => setAiOpen(true)}
                  aria-label="Open AI assistent"
                  className="flex flex-col items-center justify-center w-full h-full relative"
                >
                  <div className="flex items-center justify-center w-12 h-12 -mt-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-primary -mt-0.5">AI</span>
                </button>
              );
            }

            const path = item.authPath && !user ? item.authPath : item.path!;
            const cleanPath = path.split('?')[0];
            const isActive =
              location.pathname === cleanPath ||
              (cleanPath !== '/' && location.pathname.startsWith(cleanPath));

            return (
              <Link
                key={item.label}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center w-full h-full"
              >
                <div
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ease-out',
                    isActive
                      ? 'bg-white/55 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-sm shadow-primary/15 text-primary'
                      : 'text-muted-foreground active:scale-[0.97]'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <AIFullscreenChat open={aiOpen} onClose={handleAiClose} />
    </>
  );
});

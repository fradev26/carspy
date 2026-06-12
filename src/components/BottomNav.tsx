import { forwardRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { AIFullscreenChat } from '@/modules/chat/AIFullscreenChat';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Zoeken', path: '/zoeken' },
  { icon: Sparkles, label: 'AI', path: null, isAI: true },
  { icon: Heart, label: 'Favorieten', path: '/favorieten' },
  { icon: Plus, label: 'Verkopen', path: '/verkopen', authPath: '/auth', dealerPath: '/zakelijk' },
];

export const BottomNav = forwardRef<HTMLElement>(function BottomNav(_props, ref) {
  const location = useLocation();
  const { user } = useAuth();
  const { isDealer } = useProfile();
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80 lg:hidden safe-bottom safe-x">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            // AI center button
            if (item.isAI) {
              return (
                <button
                  key={item.label}
                  onClick={() => setAiOpen(true)}
                  aria-label="Open AI assistent"
                  className="flex flex-col items-center justify-center w-full h-full relative"
                >
                  <div className="flex items-center justify-center w-12 h-12 -mt-2 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-primary -mt-0.5">AI</span>
                </button>
              );
            }

            const path = item.authPath && !user
              ? item.authPath
              : (item.dealerPath && user && isDealer ? item.dealerPath : item.path!);
            const isActive = location.pathname === path || location.pathname === item.path || (item.authPath && location.pathname === item.authPath);
            
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
                  <span className="text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                </div>
              </Link>
            );



          })}
        </div>
      </nav>

      {/* Fullscreen AI Chat Overlay */}
      <AIFullscreenChat open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
});

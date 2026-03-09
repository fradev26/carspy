import { forwardRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { AIFullscreenChat } from '@/modules/chat/AIFullscreenChat';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Zoeken', path: '/zoeken' },
  { icon: Sparkles, label: 'AI', path: null, isAI: true },
  { icon: Heart, label: 'Favorieten', path: '/favorieten' },
  { icon: Plus, label: 'Verkopen', path: '/verkopen', authPath: '/auth' },
];

export const BottomNav = forwardRef<HTMLElement>(function BottomNav(_props, ref) {
  const location = useLocation();
  const { user } = useAuth();
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80 lg:hidden safe-bottom">
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
                  <div className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-primary -mt-0.5">AI</span>
                </button>
              );
            }

            const path = item.authPath && !user ? item.authPath : item.path!;
            const isActive = location.pathname === item.path || (item.authPath && location.pathname === item.authPath);
            
            return (
              <Link
                key={item.label}
                to={path}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground active:scale-95'
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <item.icon className={cn(
                    'h-5 w-5 transition-colors duration-200',
                    isActive && 'text-primary'
                  )} />
                  <span className={cn(
                    "text-[10px] font-medium transition-colors duration-200",
                    isActive && "text-primary"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary animate-scale-in" />
                  )}
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

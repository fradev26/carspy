import { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { consumerNavItems, dealerMobileNavItems, type NavItem } from '@/config/navigation';
import { isNavItemActive } from '@/lib/navActive';
import { useAIChat } from '@/context/AIChatContext';

export const BottomNav = forwardRef<HTMLElement>(function BottomNav(_props, ref) {
  const location = useLocation();
  const { user } = useAuth();
  const { isDealer } = useProfile();
  const { openChat } = useAIChat();

  const items: NavItem[] = user && isDealer ? dealerMobileNavItems : consumerNavItems;

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
          {items.map((item) => {
            if (item.isAI) {
              const isActive = isNavItemActive(location.pathname, item.path, item.exact);
              const aiContent = (
                <div className="flex flex-col items-center justify-center w-full h-full relative">
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 -mt-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95'
                  )}>
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-primary-strong -mt-0.5">{item.label}</span>
                </div>
              );

              if (item.path) {
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className="flex flex-col items-center justify-center w-full h-full relative"
                  >
                    {aiContent}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={openChat}
                  aria-label="Open AI assistent"
                  className="flex flex-col items-center justify-center w-full h-full relative"
                >
                  {aiContent}
                </button>
              );
            }

            const path = item.authPath && !user ? item.authPath : item.path!;
            const isActive = isNavItemActive(location.pathname, path);
            const Icon = item.icon;

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
                      ? 'bg-transparent text-primary shadow-sm shadow-primary/15'
                      : 'text-muted-foreground active:scale-[0.97]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
});

import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Heart, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Zoeken', path: '/zoeken' },
  { icon: Plus, label: 'Verkopen', path: '/verkopen', accent: true },
  { icon: Heart, label: 'Favorieten', path: '/favorieten' },
  { icon: User, label: 'Account', path: '/dashboard', authPath: '/auth' },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const path = item.authPath && !user ? item.authPath : item.path;
          const isActive = location.pathname === item.path || (item.authPath && location.pathname === item.authPath);
          
          return (
            <Link
              key={item.label}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-full h-full transition-colors',
                item.accent && 'relative',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.accent ? (
                <div className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <item.icon className="h-6 w-6" />
                </div>
              ) : (
                <>
                  <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

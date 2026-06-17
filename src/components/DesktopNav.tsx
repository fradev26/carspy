import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { consumerNavItems, dealerNavItems, type NavItem } from '@/config/navigation';
import { isNavItemActive } from '@/lib/navActive';
import { useAIChat } from '@/context/AIChatContext';

type Props = {
  isTransparent?: boolean;
};

export function DesktopNav({ isTransparent }: Props) {
  const location = useLocation();
  const { user } = useAuth();
  const { isDealer } = useProfile();
  const { openChat } = useAIChat();

  const items: NavItem[] = user && isDealer ? dealerNavItems : consumerNavItems;

  return (
    <nav aria-label="Hoofdnavigatie" className="flex items-center gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const resolvedPath =
          item.authPath && !user ? item.authPath : item.path ?? undefined;
        const active = isNavItemActive(location.pathname, resolvedPath ?? null);

        if (item.isAI) {
          const aiClasses =
            'gap-2 px-3 py-2 rounded-md font-semibold inline-flex items-center text-sm transition-all bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:text-primary-foreground focus-ring';

          if (item.path) {
            return (
              <Link
                key={item.label}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={aiClasses}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={openChat}
              aria-label="Open AI assistent"
              className={aiClasses}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        }

        const base =
          'gap-2 px-3 py-2 rounded-md inline-flex items-center text-sm font-semibold transition-colors focus-ring';
        const inactive = isTransparent
          ? 'text-white/90 hover:bg-white/10 hover:text-white'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground';
        const activeCls = isTransparent
          ? 'bg-white/15 text-white backdrop-blur-sm'
          : 'bg-muted text-primary';

        return (
          <Link
            key={item.label}
            to={resolvedPath ?? '#'}
            aria-current={active ? 'page' : undefined}
            className={cn(base, active ? activeCls : inactive)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

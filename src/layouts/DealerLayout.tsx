import { Outlet, Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Upload, Inbox, BarChart3, Settings } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/zakelijk/voorraad',    label: 'Voorraad',     icon: Car },
  { to: '/zakelijk/import',      label: 'Import & Sync', icon: Upload },
  { to: '/zakelijk/leads',       label: 'Leads',        icon: Inbox },
  { to: '/zakelijk/analytics',   label: 'Analytics',    icon: BarChart3 },
  { to: '/zakelijk/instellingen',label: 'Instellingen', icon: Settings },
];

export default function DealerLayout() {
  const { profile } = useProfile();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="flex items-center gap-4 px-4 h-14">
          <Link to="/zakelijk/voorraad" className="text-sm font-bold text-primary shrink-0">
            VATUUR. <span className="text-muted-foreground font-medium">Zakelijk</span>
          </Link>
          <div className="hidden md:block flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">
              {profile?.dealer_name ?? profile?.full_name ?? ''}
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-1.5 ml-auto">
            <Link to="/zakelijk/instellingen">
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Instellingen</span>
            </Link>
          </Button>
        </div>
        <nav
          aria-label="Dealer navigatie"
          className="hidden md:flex items-center gap-1 px-4 -mt-1 overflow-x-auto"
        >
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )
              }
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 pb-20 md:pb-6">
        <Outlet />
      </main>
    </div>
  );
}

import { Outlet, Link } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DealerSidebar } from '@/components/dealer/DealerSidebar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

export default function DealerLayout() {
  const { profile } = useProfile();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DealerSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b bg-card px-3 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.dealer_name ?? profile?.full_name ?? 'Zakelijk'}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to="/zakelijk/import">
                  <Upload className="h-3.5 w-3.5" /> Import CSV
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to="/zakelijk/instellingen">
                  <Link2 className="h-3.5 w-3.5" /> AutoScout
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/verkopen?dealer=1">
                  <Plus className="h-3.5 w-3.5" /> Voertuig toevoegen
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

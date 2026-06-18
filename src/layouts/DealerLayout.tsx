import { Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function DealerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-40 md:pb-6">
        <Outlet />
      </main>
      {/* Mobile sticky CTA above bottom nav */}
      <div className="fixed bottom-nav-above left-0 right-0 z-40 px-4 pt-3 pb-2 bg-gradient-to-t from-background via-background to-transparent md:hidden safe-x">
        <Button asChild className="w-full min-h-12 text-base font-semibold shadow-elevated">
          <Link to="/verkopen">Auto verkopen</Link>
        </Button>
      </div>
    </div>
  );
}

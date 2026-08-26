import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDealerLeadsRealtime } from '@/hooks/useDealerLeadsRealtime';

export default function DealerLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hideStickyCta = pathname.startsWith('/zakelijk/abonnement');

  // Toast bij elke realtime binnenkomende lead, met directe doorklik naar de lead.
  useDealerLeadsRealtime(true, (lead) => {
    toast.success(
      lead.type === 'bericht' ? 'Nieuwe lead via berichten' : `Nieuwe contactaanvraag van ${lead.name}`,
      {
        description:
          lead.type === 'bericht'
            ? 'Een koper heeft een gesprek gestart.'
            : 'Bekijk en volg deze lead meteen op.',
        action: {
          label: 'Bekijk lead',
          onClick: () => navigate(`/zakelijk/leads/${lead.id}`),
        },
      },
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* AppLayout levert al de <main>-landmark; hier geen tweede. */}
      <div className={`flex-1 ${hideStickyCta ? 'pb-6' : 'pb-40 md:pb-6'}`}>
        <Outlet />
      </div>
      {!hideStickyCta && (
        <div className="fixed bottom-nav-above left-0 right-0 z-40 px-4 pt-3 pb-2 bg-gradient-to-t from-background via-background to-transparent md:hidden safe-x">
          <Link
            to="/verkopen?dealer=1"
            className="inline-flex items-center justify-center w-full min-h-12 text-base font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated transition-colors"
          >
            Auto verkopen
          </Link>
        </div>
      )}
    </div>
  );
}

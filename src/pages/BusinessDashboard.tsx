import { Navigate, useSearchParams } from 'react-router-dom';

// Backwards-compatible redirect from the legacy /zakelijk?tab=... URLs to the
// new voertuig-centrische dealer routes.
const TAB_TO_ROUTE: Record<string, string> = {
  inventory: '/zakelijk/voorraad',
  voorraad: '/zakelijk/voorraad',
  overzicht: '/zakelijk/voorraad',
  performance: '/zakelijk/analytics',
  statistieken: '/zakelijk/analytics',
  leads: '/zakelijk/leads',
  explorer: '/zakelijk/analytics',
  marktverkenner: '/zakelijk/analytics',
  autoscout: '/zakelijk/instellingen',
};

export default function BusinessDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? '';
  const target = TAB_TO_ROUTE[tab] ?? '/zakelijk/voorraad';
  return <Navigate to={target} replace />;
}

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  getAccountType,
  getSettingsRoute,
  isSettingsPathAllowed,
} from '@/lib/settingsRoute';

interface Props {
  /** Welk accounttype mag deze route bezoeken. */
  requires: 'private' | 'dealer';
  children: ReactNode;
}

/**
 * Guard die instellingenroutes rolafhankelijk afschermt.
 * - Gast → redirect naar /auth (met huidige path als redirect).
 * - Verkeerde rol → redirect naar de juiste settings-route.
 * - Loading → toont skeleton in plaats van te redirecten (geen flikker).
 */
export function SettingsRouteGuard({ requires, children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="container py-12">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const accountType = getAccountType(user, profile);

  if (accountType === 'guest') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  if (accountType !== requires || !isSettingsPathAllowed(location.pathname, accountType)) {
    return <Navigate to={getSettingsRoute(accountType)} replace />;
  }

  return <>{children}</>;
}

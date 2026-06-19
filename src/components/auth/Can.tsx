import { ReactNode } from 'react';
import { usePermissions, Permissions } from '@/hooks/usePermissions';

type Capability = keyof Omit<Permissions, 'role' | 'loading' | 'isMember'>;

export function Can({ do: capability, children, fallback = null }: {
  do: Capability;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const perms = usePermissions();
  if (perms.loading) return null;
  return perms[capability] ? <>{children}</> : <>{fallback}</>;
}

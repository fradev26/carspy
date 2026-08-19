import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';


export type CompanyRole = 'owner' | 'manager' | 'seller' | 'marketing';

export interface Permissions {
  role: CompanyRole | null;
  isMember: boolean;
  isOwner: boolean;
  canManageUsers: boolean;
  canManageBilling: boolean;
  canEditCompany: boolean;
  canEditListings: boolean;
  canDeleteListings: boolean;
  canBoost: boolean;
  canViewLeads: boolean;
  loading: boolean;
}

const DEFAULTS: Omit<Permissions, 'loading'> = {
  role: null,
  isMember: false,
  isOwner: false,
  canManageUsers: false,
  canManageBilling: false,
  canEditCompany: false,
  canEditListings: false,
  canDeleteListings: false,
  canBoost: false,
  canViewLeads: false,
};

function rolePerms(role: CompanyRole | null): Omit<Permissions, 'loading'> {
  if (!role) return DEFAULTS;
  return {
    role,
    isMember: true,
    isOwner: role === 'owner',
    canManageUsers: role === 'owner',
    canManageBilling: role === 'owner',
    canEditCompany: role === 'owner',
    canEditListings: ['owner', 'manager', 'seller', 'marketing'].includes(role),
    canDeleteListings: ['owner', 'manager', 'seller'].includes(role),
    canBoost: ['owner', 'manager', 'marketing'].includes(role),
    canViewLeads: ['owner', 'manager', 'seller'].includes(role),
  };
}

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Ensure membership exists for dealer users (idempotent)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.rpc('ensure_company_membership').then(({ error }) => {
      if (cancelled) return;
      if (error) {
        console.error('ensure_company_membership failed', error);
        toast({
          title: 'Bedrijfsprofiel kon niet geladen worden',
          description: 'Sommige zakelijke functies zijn mogelijk niet beschikbaar. Herlaad de pagina of probeer later opnieuw.',
          variant: 'destructive',
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['company-role', user.id] });
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const { data, isLoading } = useQuery({
    queryKey: ['company-role', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_members')
        .select('role, status')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return (data?.role as CompanyRole) ?? null;
    },
  });

  return { ...rolePerms(data ?? null), loading: isLoading };
}


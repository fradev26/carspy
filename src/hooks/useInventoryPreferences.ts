import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DEFAULT_INVENTORY_PREFS,
  InventoryPrefs,
  InventoryPrefsSchema,
} from '@/lib/inventoryPrefsSchema';
import { toast } from 'sonner';

export function useInventoryPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<InventoryPrefs>({
    queryKey: ['inventory-preferences', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_or_create_inventory_preferences');
      if (error) throw error;
      const { user_id: _unused, created_at: _ca, updated_at: _ua, ...prefs } =
        (data as Record<string, unknown>) ?? {};
      const parsed = InventoryPrefsSchema.safeParse(prefs);
      return parsed.success ? parsed.data : DEFAULT_INVENTORY_PREFS;
    },
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (prefs: InventoryPrefs) => {
      if (!user) throw new Error('not authenticated');
      const validated = InventoryPrefsSchema.parse(prefs);
      const { error } = await supabase
        .from('dealer_inventory_preferences')
        .upsert({ user_id: user.id, ...validated }, { onConflict: 'user_id' });
      if (error) throw error;
      return validated;
    },
    onSuccess: (data) => {
      qc.setQueryData(['inventory-preferences', user?.id], data);
      toast.success('Voorkeuren opgeslagen');
    },
    onError: (err: Error) => {
      toast.error(`Opslaan mislukt: ${err.message}`);
    },
  });

  return {
    preferences: query.data ?? DEFAULT_INVENTORY_PREFS,
    isLoading: query.isLoading,
    isError: query.isError,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

export function useActiveListingsCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['active-listings-count', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'active');
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDealerLeadsRealtime } from '@/hooks/useDealerLeadsRealtime';

/** Lichte teller van nieuwe (nog niet opgevolgde) leads voor de header-badge. */
export function useNewLeadsCount(enabled: boolean) {
  const { user } = useAuth();
  useDealerLeadsRealtime(enabled);

  const { data } = useQuery({
    queryKey: ['new-leads-count', user?.id],
    enabled: !!user && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('dealer_leads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new');
      if (error) throw error;
      return count ?? 0;
    },
  });

  return { count: data ?? 0 };
}

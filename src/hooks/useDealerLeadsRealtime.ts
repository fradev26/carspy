import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Queries die verversen zodra er een leadgerelateerde wijziging binnenkomt. */
export function invalidateLeadQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['dealer-leads'] });
  queryClient.invalidateQueries({ queryKey: ['new-leads-count'] });
}

/**
 * Debounce-helper: bundelt een burst aan realtime-events tot één invalidatie.
 * Geeft een `flush`-functie terug plus een `cancel` voor cleanup.
 */
export function createLeadRefreshScheduler(
  run: () => void,
  delayMs = 300,
): { schedule: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        run();
      }, delayMs);
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}

/**
 * Abonneert op wijzigingen in contactaanvragen, gesprekken en berichten zodat
 * nieuwe leads automatisch verschijnen zonder refresh. RLS bepaalt welke rijen
 * een dealer ontvangt.
 */
export function useDealerLeadsRealtime(enabled = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !enabled) return;

    const scheduler = createLeadRefreshScheduler(() => invalidateLeadQueries(queryClient));

    const channel = supabase
      .channel(`dealer-leads-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dealer_leads' }, () =>
        scheduler.schedule(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () =>
        scheduler.schedule(),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () =>
        scheduler.schedule(),
      )
      .subscribe();

    return () => {
      scheduler.cancel();
      supabase.removeChannel(channel);
    };
  }, [user, enabled, queryClient]);
}

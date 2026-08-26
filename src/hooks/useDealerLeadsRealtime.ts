import { useEffect, useRef } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { LeadType } from '@/hooks/useDealerLeads';

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

/** Een net binnengekomen lead, klaar voor een melding. */
export interface NewLeadEvent {
  /** Route-id van de lead (gesprekken krijgen het `conv-`-prefix). */
  id: string;
  name: string;
  type: LeadType;
}

/**
 * Zet een realtime INSERT-payload om naar een NewLeadEvent.
 * Geeft `null` terug bij een onbruikbare rij (bv. ontbrekend id).
 */
export function newLeadFromInsert(
  table: 'dealer_leads' | 'conversations',
  row: Record<string, unknown>,
): NewLeadEvent | null {
  const id = typeof row.id === 'string' && row.id ? row.id : null;
  if (!id) return null;
  if (table === 'dealer_leads') {
    const name =
      typeof row.name === 'string' && row.name.trim() ? row.name.trim() : 'Onbekende bezoeker';
    return { id, name, type: 'contactaanvraag' };
  }
  // Gesprekken bevatten geen naam in de payload; de detailpagina toont die wel.
  return { id: `conv-${id}`, name: 'Koper', type: 'bericht' };
}

/**
 * Abonneert op wijzigingen in contactaanvragen, gesprekken en berichten zodat
 * nieuwe leads automatisch verschijnen zonder refresh. RLS bepaalt welke rijen
 * een dealer ontvangt.
 *
 * `onNewLead` wordt aangeroepen bij elke nieuwe lead (INSERT op dealer_leads
 * of conversations) — handig voor toastmeldingen. De callback mag bij elke
 * render een nieuwe identiteit hebben; er wordt geen nieuw kanaal geopend.
 */
export function useDealerLeadsRealtime(
  enabled = true,
  onNewLead?: (lead: NewLeadEvent) => void,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const onNewLeadRef = useRef(onNewLead);
  onNewLeadRef.current = onNewLead;

  useEffect(() => {
    if (!user || !enabled) return;

    const scheduler = createLeadRefreshScheduler(() => invalidateLeadQueries(queryClient));
    const notify = (table: 'dealer_leads' | 'conversations') => (payload: { new: Record<string, unknown> }) => {
      scheduler.schedule();
      const lead = newLeadFromInsert(table, payload.new);
      if (lead) onNewLeadRef.current?.(lead);
    };

    const channel = supabase
      .channel(`dealer-leads-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dealer_leads' }, notify('dealer_leads'))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dealer_leads' }, () =>
        scheduler.schedule(),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, notify('conversations'))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () =>
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

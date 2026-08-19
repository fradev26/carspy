import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'vatuur_session_id';

function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

/**
 * Registreert één weergave per advertentie per paginabezoek. De server ontdubbelt
 * verder per bezoeker per dag; tracking mag de UX nooit breken.
 */
export function useTrackListingView(listingId: string | undefined, source = 'detail') {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!listingId || sent.current === listingId) return;
    sent.current = listingId;
    supabase.functions
      .invoke('track-listing-view', { body: { listingId, source, sessionId: sessionId() } })
      .catch(() => {
        /* stil falen */
      });
  }, [listingId, source]);
}

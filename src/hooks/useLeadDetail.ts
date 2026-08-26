import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  LEAD_STATUSES,
  normalizeConversationLead,
  normalizeDealerLead,
  type DealerLead,
} from '@/hooks/useDealerLeads';

/** Voertuigblok op de leaddetailpagina. */
export interface LeadVehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  image: string | null;
}

/** Één gebeurtenis in de lead-timeline. */
export interface LeadTimelineEvent {
  id: string;
  kind: 'created' | 'status' | 'message';
  at: string;
  /** Voor status-events. */
  fromStatus?: string;
  toStatus?: string;
  /** Voor bericht-events. */
  content?: string;
  senderName?: string;
  senderIsDealer?: boolean;
}

export interface LeadDetailData {
  lead: DealerLead;
  vehicle: LeadVehicle | null;
  events: LeadTimelineEvent[];
}

/** Is dit lead-id een berichtgesprek (conv-<uuid>) of een contactaanvraag? */
export function isConversationLeadId(id: string): boolean {
  return id.startsWith('conv-');
}

interface AuditRow {
  id: string;
  action: string;
  metadata: { from?: string; to?: string } | null;
  created_at: string;
}

interface MessageRow {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

/**
 * Voegt statuswijzigingen, berichten en het aanmaakmoment samen tot één
 * chronologische timeline (nieuwste eerst).
 */
export function buildTimeline(opts: {
  createdAt: string;
  createdLabelType: 'bericht' | 'contactaanvraag';
  auditRows: AuditRow[];
  messages?: { rows: MessageRow[]; buyerId: string; buyerName: string; dealerName: string };
}): LeadTimelineEvent[] {
  const events: LeadTimelineEvent[] = [
    {
      id: 'created',
      kind: 'created',
      at: opts.createdAt,
      content: opts.createdLabelType === 'bericht' ? 'Gesprek gestart' : 'Contactaanvraag ontvangen',
    },
  ];

  for (const row of opts.auditRows) {
    if (row.action !== 'lead_status_changed') continue;
    events.push({
      id: `audit-${row.id}`,
      kind: 'status',
      at: row.created_at,
      fromStatus: row.metadata?.from ?? undefined,
      toStatus: row.metadata?.to ?? undefined,
    });
  }

  if (opts.messages) {
    const { rows, buyerId, buyerName, dealerName } = opts.messages;
    for (const m of rows) {
      const senderIsDealer = m.sender_id !== buyerId;
      events.push({
        id: `msg-${m.id}`,
        kind: 'message',
        at: m.created_at,
        content: m.content,
        senderIsDealer,
        senderName: senderIsDealer ? dealerName : buyerName,
      });
    }
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

const LISTING_SELECT = 'id, title, brand, model, year, price, images';

async function fetchVehicle(listingId: string | null): Promise<LeadVehicle | null> {
  if (!listingId) return null;
  const { data, error } = await supabase.from('listings').select(LISTING_SELECT).eq('id', listingId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const images = (data.images as string[] | null) ?? [];
  return {
    id: data.id,
    title: data.title,
    brand: data.brand,
    model: data.model,
    year: data.year,
    price: data.price,
    image: images[0] ?? null,
  };
}

async function fetchAuditRows(table: 'dealer_leads' | 'conversations', targetId: string): Promise<AuditRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, metadata, created_at')
    .eq('category', 'leads')
    .eq('target_table', table)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

async function fetchContactLeadDetail(id: string): Promise<LeadDetailData | null> {
  const { data: row, error } = await supabase
    .from('dealer_leads')
    .select('id, name, email, phone, company, message, status, source, listing_id, created_at, follow_up_at, snoozed_until, answered_at, assigned_to')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const [vehicle, auditRows] = await Promise.all([
    fetchVehicle(row.listing_id),
    fetchAuditRows('dealer_leads', id),
  ]);

  const lead = normalizeDealerLead(row, vehicle?.title ?? null);
  return {
    lead,
    vehicle,
    events: buildTimeline({ createdAt: row.created_at, createdLabelType: 'contactaanvraag', auditRows }),
  };
}

async function fetchConversationLeadDetail(convId: string, sellerId: string): Promise<LeadDetailData | null> {
  const { data: conv, error } = await supabase
    .from('conversations')
    .select('id, listing_id, buyer_id, seller_id, status, created_at, updated_at, follow_up_at, snoozed_until, answered_at, assigned_to')
    .eq('id', convId)
    .eq('seller_id', sellerId)
    .maybeSingle();
  if (error) throw error;
  if (!conv) return null;

  const [buyerRes, dealerRes, vehicle, auditRows, msgsRes] = await Promise.all([
    supabase.from('public_profiles').select('id, full_name, dealer_name').eq('id', conv.buyer_id).maybeSingle(),
    supabase.rpc('get_my_profile'),
    fetchVehicle(conv.listing_id),
    fetchAuditRows('conversations', convId),
    supabase.from('messages').select('id, sender_id, content, created_at').eq('conversation_id', convId).order('created_at', { ascending: true }),
  ]);
  if (msgsRes.error) throw msgsRes.error;

  const buyerName = buyerRes.data?.dealer_name ?? buyerRes.data?.full_name ?? 'Koper';
  const dealerProfile = Array.isArray(dealerRes.data) ? dealerRes.data[0] : dealerRes.data;
  const dealerName = dealerProfile?.dealer_name ?? dealerProfile?.full_name ?? 'Jij';
  const messages = (msgsRes.data ?? []) as MessageRow[];
  const last = messages[messages.length - 1];

  const lead = normalizeConversationLead(
    conv,
    vehicle?.title ?? null,
    buyerName,
    last?.content ?? null,
    last?.created_at ?? conv.created_at,
    { lastSenderIsBuyer: last ? last.sender_id === conv.buyer_id : false, hasMessages: messages.length > 0 },
  );

  return {
    lead,
    vehicle,
    events: buildTimeline({
      createdAt: conv.created_at,
      createdLabelType: 'bericht',
      auditRows,
      messages: { rows: messages, buyerId: conv.buyer_id, buyerName, dealerName },
    }),
  };
}

/** Haalt één lead op met voertuig en timeline. Ondersteunt beide leadtypes. */
export function useLeadDetail(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-detail', user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<LeadDetailData | null> => {
      if (!user || !id) return null;
      return isConversationLeadId(id)
        ? fetchConversationLeadDetail(id.slice('conv-'.length), user.id)
        : fetchContactLeadDetail(id);
    },
  });
}

/** Zet een lead om naar een andere status (zelfde logica als de lijstpagina). */
export async function updateLeadStatus(leadId: string, status: string) {
  if (isConversationLeadId(leadId)) {
    return supabase.rpc('set_conversation_status', {
      _conversation_id: leadId.slice('conv-'.length),
      _status: status,
    });
  }
  // Nieuwe RPC staat nog niet in de gegenereerde types; runtime-validatie via de DB.
  return (supabase.rpc as (name: string, params: Record<string, unknown>) => Promise<{ error: { message: string } | null }>)(
    'set_dealer_lead_status',
    { _lead_id: leadId, _status: status },
  );
}

/** Labels voor statussen in de timeline (incl. verouderde waarden). */
export const TIMELINE_STATUS_LABELS: Record<string, string> = {
  new: 'Nieuw',
  in_progress: 'In behandeling',
  waiting_customer: 'Wachten op klant',
  scheduled: 'Gepland',
  done: 'Afgehandeld',
  contacted: 'Opgevolgd',
  won: 'Gewonnen',
  lost: 'Verloren',
};

export function isValidLeadStatus(s: string): s is LeadStatus {
  return (LEAD_STATUSES as string[]).includes(s);
}

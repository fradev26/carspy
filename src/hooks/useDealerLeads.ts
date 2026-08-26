import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

/** Opvolgstatussen voor een lead: Nieuw → In behandeling → Afgehandeld. */
export type LeadStatus = 'new' | 'in_progress' | 'done';

export const LEAD_STATUSES: LeadStatus[] = ['new', 'in_progress', 'done'];

/** Waar de lead vandaan komt. */
export type LeadType = 'bericht' | 'contactaanvraag';

export interface DealerLead {
  /** Lokaal id. */
  id: string;
  type: LeadType;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  /** Titel (en optioneel id) van de wagen waar de lead over gaat. */
  listingTitle: string | null;
  listingId: string | null;
  snippet: string;
  status: LeadStatus;
  createdAt: string;
  /** Voor berichtleads: verwijst naar het gesprek in /berichten. */
  conversationId?: string;
}

interface DealerLeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  status: string;
  listing_id: string | null;
  created_at: string;
}

interface ConversationRow {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function normalizeDealerLead(row: DealerLeadRow, listingTitle: string | null = null): DealerLead {
  return {
    id: row.id,
    type: 'contactaanvraag',
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company ?? null,
    listingTitle,
    listingId: row.listing_id,
    snippet: row.message?.trim() ?? '',
    status: (LEAD_STATUSES.includes(row.status as LeadStatus) ? row.status : 'new') as LeadStatus,
    createdAt: row.created_at,
  };
}

export function normalizeConversationLead(
  conv: ConversationRow,
  listingTitle: string | null,
  buyerName: string | null,
  lastMessage: string | null,
  createdAt: string,
): DealerLead {
  return {
    id: `conv-${conv.id}`,
    type: 'bericht',
    name: buyerName ?? 'Koper',
    email: null,
    phone: null,
    company: null,
    listingTitle,
    listingId: conv.listing_id,
    snippet: lastMessage?.trim() ?? 'Nieuw gesprek gestart',
    status: (LEAD_STATUSES.includes(conv.status as LeadStatus) ? conv.status : 'in_progress') as LeadStatus,
    createdAt,
    conversationId: conv.id,
  };
}

/** Sorteert leads van nieuwste naar oudste. */
export function sortLeads(leads: DealerLead[]): DealerLead[] {
  return [...leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function useDealerLeads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dealer-leads', user?.id],
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async (): Promise<DealerLead[]> => {
      if (!user) return [];
      const uid = user.id;

      const [contactRes, convRes] = await Promise.all([
        supabase.from('dealer_leads').select('id, name, email, phone, company, message, status, listing_id, created_at').order('created_at', { ascending: false }),
        supabase.from('conversations').select('id, listing_id, buyer_id, seller_id, status, created_at, updated_at').eq('seller_id', uid).order('updated_at', { ascending: false }),
      ]);

      if (contactRes.error) throw contactRes.error;
      if (convRes.error) throw convRes.error;

      const contactRows = (contactRes.data ?? []) as DealerLeadRow[];
      const convs = (convRes.data ?? []) as ConversationRow[];

      // Wagens van beide leadtypes in één query ophalen.
      const listingIds = Array.from(new Set([
        ...contactRows.map((r) => r.listing_id),
        ...convs.map((c) => c.listing_id),
      ].filter((x): x is string => !!x)));
      const buyerIds = Array.from(new Set(convs.map((c) => c.buyer_id)));

      const [listingsRes, profilesRes, msgsRes] = await Promise.all([
        listingIds.length ? supabase.from('listings').select('id, title').in('id', listingIds) : Promise.resolve({ data: [], error: null }),
        buyerIds.length ? supabase.from('public_profiles').select('id, full_name, dealer_name').in('id', buyerIds) : Promise.resolve({ data: [], error: null }),
        convs.length ? supabase.from('messages').select('conversation_id, content, created_at').in('conversation_id', convs.map((c) => c.id)).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
      ]);

      if (listingsRes.error) throw listingsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (msgsRes.error) throw msgsRes.error;

      const listingMap = new Map((listingsRes.data ?? []).map((l: { id: string; title: string }) => [l.id, l.title]));
      const profileMap = new Map(
        (profilesRes.data ?? []).map((p: { id: string; full_name: string | null; dealer_name: string | null }) => [p.id, p.dealer_name ?? p.full_name]),
      );
      const lastMsgByConv = new Map<string, { content: string; created_at: string }>();
      (msgsRes.data ?? []).forEach((m: { conversation_id: string; content: string; created_at: string }) => {
        if (!lastMsgByConv.has(m.conversation_id)) lastMsgByConv.set(m.conversation_id, m);
      });

      const dealerLeads = contactRows.map((r) => normalizeDealerLead(r, r.listing_id ? listingMap.get(r.listing_id) ?? null : null));
      const convLeads = convs.map((c) => {
        const last = lastMsgByConv.get(c.id);
        return normalizeConversationLead(
          c,
          c.listing_id ? listingMap.get(c.listing_id) ?? null : null,
          profileMap.get(c.buyer_id) ?? null,
          last?.content ?? null,
          last?.created_at ?? c.created_at,
        );
      });

      return sortLeads([...dealerLeads, ...convLeads]);
    },
  });
}

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

/** Opvolgstatussen voor een lead. */
export type LeadStatus = 'new' | 'in_progress' | 'waiting_customer' | 'scheduled' | 'done';

export const LEAD_STATUSES: LeadStatus[] = ['new', 'in_progress', 'waiting_customer', 'scheduled', 'done'];

/** Waar de lead vandaan komt. */
export type LeadType = 'bericht' | 'contactaanvraag';

export interface DealerLead {
  /** Lokaal id (`conv-<uuid>` voor gesprekken). */
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
  /** Laatste activiteit (laatste bericht of aanmaak) — basis voor wachttijd. */
  lastActivityAt: string;
  /** Geplande opvolging/reminder. */
  followUpAt: string | null;
  /** Gesnoozet tot dit tijdstip. */
  snoozedUntil: string | null;
  /** Eerste reactie van de dealer. */
  answeredAt: string | null;
  /** Verantwoordelijke verkoper (company_member id + naam). */
  assignedTo: string | null;
  assignedName: string | null;
  /** Kanaal/bron (bijv. contact_form, mock-seed; gesprekken → 'bericht'). */
  source: string;
  /** Land afgeleid van telefoonprefix (BE/NL/…), null indien onbekend. */
  country: string | null;
  /** Nog geen reactie van de dealer. */
  isUnanswered: boolean;
  /** Systeemactiviteit (bv. gesprek zonder berichten) — geen echte lead. */
  isSystemActivity: boolean;
  /** Heuristische koopintentie 0–100. */
  intentScore: number;
  /** Voor berichtleads: verwijst naar het gesprek in /berichten. */
  conversationId?: string;
}

/** Verkoper aan wie een lead toegewezen kan worden. */
export interface LeadAssignee {
  /** company_member id. */
  id: string;
  name: string;
}

interface DealerLeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  status: string;
  source: string | null;
  listing_id: string | null;
  created_at: string;
  follow_up_at: string | null;
  snoozed_until: string | null;
  answered_at: string | null;
  assigned_to: string | null;
}

interface ConversationRow {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  follow_up_at: string | null;
  snoozed_until: string | null;
  answered_at: string | null;
  assigned_to: string | null;
}

const VALID_STATUSES = LEAD_STATUSES as readonly string[];

function coerceStatus(raw: string, fallback: LeadStatus): LeadStatus {
  return (VALID_STATUSES.includes(raw) ? raw : fallback) as LeadStatus;
}

/** Leidt het land af uit de telefoonprefix. */
export function countryFromPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[\s().-]/g, '');
  const intl = digits.startsWith('00') ? `+${digits.slice(2)}` : digits;
  if (intl.startsWith('+32')) return 'BE';
  if (intl.startsWith('+31')) return 'NL';
  if (intl.startsWith('+352')) return 'LU';
  if (intl.startsWith('+33')) return 'FR';
  if (intl.startsWith('+49')) return 'DE';
  // Belgisch nationaal nummer zonder prefix
  if (/^0[1-9]/.test(digits)) return 'BE';
  return null;
}

const INTENT_KEYWORDS = [
  'prijs', 'kopen', 'testrit', 'proefrit', 'financiering', 'financieren',
  'inruil', 'reserveren', 'afspraak', 'beschikbaar', 'onderhandel',
];

/**
 * Heuristische koopintentie (0–100): telefoonnummer, intentiewoorden in het
 * bericht en recentheid. Later vervangbaar door een AI-score.
 */
export function computeIntentScore(
  opts: { phone: string | null; message: string; createdAt: string },
  now: Date = new Date(),
): number {
  let score = 20;
  if (opts.phone) score += 30;
  const text = opts.message.toLowerCase();
  if (text && INTENT_KEYWORDS.some((k) => text.includes(k))) score += 25;
  const ageDays = Math.max(0, (now.getTime() - new Date(opts.createdAt).getTime()) / 86_400_000);
  score += Math.max(0, Math.round(25 * (1 - ageDays / 14)));
  return Math.min(100, score);
}

export function normalizeDealerLead(
  row: DealerLeadRow,
  listingTitle: string | null = null,
  assignedName: string | null = null,
): DealerLead {
  const snippet = row.message?.trim() ?? '';
  return {
    id: row.id,
    type: 'contactaanvraag',
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company ?? null,
    listingTitle,
    listingId: row.listing_id,
    snippet,
    status: coerceStatus(row.status, 'new'),
    createdAt: row.created_at,
    lastActivityAt: row.created_at,
    followUpAt: row.follow_up_at ?? null,
    snoozedUntil: row.snoozed_until ?? null,
    answeredAt: row.answered_at ?? null,
    assignedTo: row.assigned_to ?? null,
    assignedName,
    source: row.source ?? 'contact_form',
    country: countryFromPhone(row.phone),
    isUnanswered: !row.answered_at,
    isSystemActivity: false,
    intentScore: computeIntentScore({ phone: row.phone, message: snippet, createdAt: row.created_at }),
  };
}

export function normalizeConversationLead(
  conv: ConversationRow,
  listingTitle: string | null,
  buyerName: string | null,
  lastMessage: string | null,
  lastActivityAt: string,
  opts: { lastSenderIsBuyer?: boolean; hasMessages?: boolean; assignedName?: string | null } = {},
): DealerLead {
  const hasMessages = opts.hasMessages ?? lastMessage != null;
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
    status: coerceStatus(conv.status, 'in_progress'),
    createdAt: conv.created_at,
    lastActivityAt,
    followUpAt: conv.follow_up_at ?? null,
    snoozedUntil: conv.snoozed_until ?? null,
    answeredAt: conv.answered_at ?? null,
    assignedTo: conv.assigned_to ?? null,
    assignedName: opts.assignedName ?? null,
    source: 'bericht',
    country: null,
    isUnanswered: hasMessages ? (opts.lastSenderIsBuyer ?? false) : false,
    isSystemActivity: !hasMessages,
    intentScore: computeIntentScore({ phone: null, message: lastMessage ?? '', createdAt: conv.created_at }),
    conversationId: conv.id,
  };
}

/** Sorteert leads van nieuwste naar oudste. */
export function sortLeads(leads: DealerLead[]): DealerLead[] {
  return [...leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Periodepresets voor het datumfilter. */
export type LeadPeriod = 'all' | 'today' | '7d' | '30d';
/** Sorteeropties in de leadslijst. */
export type LeadSort = 'priority' | 'newest' | 'longest_unanswered' | 'followup' | 'intent';
/** Tabbladen: 'action' is de berekende "Actie nodig"-weergave. */
export type LeadTab = 'action' | 'in_progress' | 'waiting_customer' | 'scheduled' | 'done' | 'all';
/** Snelle focusfilters vanuit de prioriteitsbalk. */
export type LeadFocus = '' | 'new' | 'waiting' | 'followups';

const PERIOD_DAYS: Record<Exclude<LeadPeriod, 'all'>, number> = { today: 0, '7d': 6, '30d': 29 };

/** Ondergrens (start van de dag, lokale tijd) voor een periodepreset. */
export function periodStart(period: LeadPeriod, now: Date = new Date()): Date | null {
  if (period === 'all') return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - PERIOD_DAYS[period]);
  return start;
}

/** Einde van vandaag (lokale tijd). */
function endOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

/** Is de lead momenteel gesnoozet? */
export function isLeadSnoozed(lead: DealerLead, now: Date = new Date()): boolean {
  return !!lead.snoozedUntil && new Date(lead.snoozedUntil).getTime() > now.getTime();
}

/** Status van de geplande opvolging t.o.v. nu. */
export function followUpState(lead: DealerLead, now: Date = new Date()): 'overdue' | 'today' | 'upcoming' | null {
  if (!lead.followUpAt) return null;
  const at = new Date(lead.followUpAt).getTime();
  if (at <= now.getTime()) return 'overdue';
  if (at <= endOfToday(now).getTime()) return 'today';
  return 'upcoming';
}

/** Hoeveel hele dagen wacht deze lead al op een reactie. */
export function waitingDays(lead: DealerLead, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(lead.lastActivityAt).getTime()) / 86_400_000));
}

/** Wacht de lead langer dan 24 uur op een antwoord? */
export function waitsOver24h(lead: DealerLead, now: Date = new Date()): boolean {
  return lead.isUnanswered && now.getTime() - new Date(lead.lastActivityAt).getTime() > 86_400_000;
}

/**
 * De "Actie nodig"-weergave: nieuwe leads, onbeantwoorde leads en leads met
 * een opvolging die vandaag of te laat is. Afgehandelde, gesnoozete en
 * systeemactiviteiten tellen niet mee.
 */
export function needsAction(lead: DealerLead, now: Date = new Date()): boolean {
  if (lead.isSystemActivity || lead.status === 'done' || isLeadSnoozed(lead, now)) return false;
  if (lead.status === 'new' || lead.isUnanswered) return true;
  const fu = followUpState(lead, now);
  return fu === 'overdue' || fu === 'today';
}

/**
 * Prioriteitsscore voor sortering: te late opvolgingen bovenaan, dan
 * opvolgingen vandaag, dan langst wachtende onbeantwoorde leads, dan nieuwe.
 */
export function priorityScore(lead: DealerLead, now: Date = new Date()): number {
  if (lead.status === 'done' || lead.isSystemActivity) return -1;
  let score = 0;
  const fu = followUpState(lead, now);
  if (fu === 'overdue') score = 1000 + waitingDays(lead, now);
  else if (fu === 'today') score = 800;
  if (lead.isUnanswered) score = Math.max(score, 400 + waitingDays(lead, now) * 10);
  if (lead.status === 'new') score = Math.max(score, 300);
  return score + lead.intentScore / 100;
}

export interface LeadFilterCriteria {
  /** Actieve tab; 'action' = berekende actie-weergave, 'all' = alles. */
  tab: LeadTab;
  /** Vrije zoekterm op naam, e-mail, telefoon, bedrijf of wagen. */
  query: string;
  /** Advertentietitel; lege string toont alles. */
  listing: string;
  period: LeadPeriod;
  sort: LeadSort;
  /** company_member id, 'none' voor niet-toegewezen, '' voor alles. */
  assignee: string;
  /** Kanaal: 'bericht' of een bron uit dealer_leads.source; '' = alles. */
  source: string;
  /** Landcode (BE/NL/…); '' = alles. */
  country: string;
  unansweredOnly: boolean;
  /** Focusfilter vanuit de prioriteitsbalk. */
  focus: LeadFocus;
}

export const LEAD_FILTER_DEFAULTS: LeadFilterCriteria = {
  tab: 'action',
  query: '',
  listing: '',
  period: 'all',
  sort: 'priority',
  assignee: '',
  source: '',
  country: '',
  unansweredOnly: false,
  focus: '',
};

function matchesTab(lead: DealerLead, tab: LeadTab, now: Date): boolean {
  switch (tab) {
    case 'all':
      return true;
    case 'action':
      return needsAction(lead, now);
    default:
      return lead.status === tab;
  }
}

function matchesFocus(lead: DealerLead, focus: LeadFocus, now: Date): boolean {
  switch (focus) {
    case 'new':
      return lead.status === 'new' && !lead.isSystemActivity;
    case 'waiting':
      return waitsOver24h(lead, now);
    case 'followups': {
      const fu = followUpState(lead, now);
      return fu === 'overdue' || fu === 'today';
    }
    default:
      return true;
  }
}

/** Filtert en sorteert leads volgens de actieve criteria. */
export function filterLeads(
  leads: DealerLead[],
  criteria: LeadFilterCriteria,
  now: Date = new Date(),
): DealerLead[] {
  const q = criteria.query.trim().toLowerCase();
  const from = periodStart(criteria.period, now);

  const filtered = leads.filter((l) => {
    if (!matchesTab(l, criteria.tab, now)) return false;
    if (!matchesFocus(l, criteria.focus, now)) return false;
    if (criteria.listing && l.listingTitle !== criteria.listing) return false;
    if (criteria.assignee === 'none' ? l.assignedTo !== null : criteria.assignee && l.assignedTo !== criteria.assignee) return false;
    if (criteria.source && l.source !== criteria.source) return false;
    if (criteria.country && l.country !== criteria.country) return false;
    if (criteria.unansweredOnly && !l.isUnanswered) return false;
    if (from && new Date(l.createdAt).getTime() < from.getTime()) return false;
    if (!q) return true;
    return [l.name, l.email, l.phone, l.company, l.listingTitle].some((f) => (f ?? '').toLowerCase().includes(q));
  });

  switch (criteria.sort) {
    case 'priority':
      return [...filtered].sort((a, b) => {
        const diff = priorityScore(b, now) - priorityScore(a, now);
        return diff !== 0 ? diff : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case 'longest_unanswered':
      return [...filtered].sort((a, b) => {
        const diff = Number(b.isUnanswered) - Number(a.isUnanswered);
        if (diff !== 0) return diff;
        return new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
      });
    case 'followup':
      return [...filtered].sort((a, b) => {
        if (!a.followUpAt && !b.followUpAt) return 0;
        if (!a.followUpAt) return 1;
        if (!b.followUpAt) return -1;
        return new Date(a.followUpAt).getTime() - new Date(b.followUpAt).getTime();
      });
    case 'intent':
      return [...filtered].sort((a, b) => b.intentScore - a.intentScore);
    default:
      return sortLeads(filtered);
  }
}

/** Tellers per tab, o.b.v. de volledige (ongetabde) lijst. */
export function leadTabCounts(leads: DealerLead[], now: Date = new Date()): Record<LeadTab, number> {
  return {
    action: leads.filter((l) => needsAction(l, now)).length,
    in_progress: leads.filter((l) => l.status === 'in_progress').length,
    waiting_customer: leads.filter((l) => l.status === 'waiting_customer').length,
    scheduled: leads.filter((l) => l.status === 'scheduled').length,
    done: leads.filter((l) => l.status === 'done').length,
    all: leads.length,
  };
}

/** Tellers voor de prioriteitsbalk. */
export function leadPriorityCounts(leads: DealerLead[], now: Date = new Date()) {
  const real = leads.filter((l) => !l.isSystemActivity && l.status !== 'done' && !isLeadSnoozed(l, now));
  return {
    new: real.filter((l) => l.status === 'new').length,
    waiting: real.filter((l) => waitsOver24h(l, now)).length,
    followups: real.filter((l) => {
      const fu = followUpState(l, now);
      return fu === 'overdue' || fu === 'today';
    }).length,
  };
}

/** Unieke advertentietitels waarop leads binnenkwamen, alfabetisch. */
export function leadListingTitles(leads: DealerLead[]): string[] {
  return Array.from(
    new Set(leads.map((l) => l.listingTitle).filter((t): t is string => !!t)),
  ).sort((a, b) => a.localeCompare(b, 'nl'));
}

/** Unieke bronnen/kanalen in de huidige leads, alfabetisch ('bericht' eerst). */
export function leadSources(leads: DealerLead[]): string[] {
  const set = new Set(leads.map((l) => l.source));
  return Array.from(set).sort((a, b) => {
    if (a === 'bericht') return -1;
    if (b === 'bericht') return 1;
    return a.localeCompare(b, 'nl');
  });
}

/** Unieke landcodes in de huidige leads, alfabetisch. */
export function leadCountries(leads: DealerLead[]): string[] {
  return Array.from(new Set(leads.map((l) => l.country).filter((c): c is string => !!c))).sort();
}

const LEAD_SELECT =
  'id, name, email, phone, company, message, status, source, listing_id, created_at, follow_up_at, snoozed_until, answered_at, assigned_to';
const CONV_SELECT =
  'id, listing_id, buyer_id, seller_id, status, created_at, updated_at, follow_up_at, snoozed_until, answered_at, assigned_to';

export function useDealerLeads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dealer-leads', user?.id],
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async (): Promise<DealerLead[]> => {
      if (!user) return [];
      const uid = user.id;

      const [contactRes, convRes, membersRes] = await Promise.all([
        supabase.from('dealer_leads').select(LEAD_SELECT).order('created_at', { ascending: false }),
        supabase.from('conversations').select(CONV_SELECT).eq('seller_id', uid).order('updated_at', { ascending: false }),
        supabase.from('company_members').select('id, user_id').eq('status', 'active'),
      ]);

      if (contactRes.error) throw contactRes.error;
      if (convRes.error) throw convRes.error;

      const contactRows = (contactRes.data ?? []) as unknown as DealerLeadRow[];
      const convs = (convRes.data ?? []) as unknown as ConversationRow[];
      const members = (membersRes.data ?? []) as { id: string; user_id: string }[];

      // Wagens van beide leadtypes in één query ophalen.
      const listingIds = Array.from(new Set([
        ...contactRows.map((r) => r.listing_id),
        ...convs.map((c) => c.listing_id),
      ].filter((x): x is string => !!x)));
      const buyerIds = Array.from(new Set(convs.map((c) => c.buyer_id)));
      const memberUserIds = Array.from(new Set(members.map((m) => m.user_id)));

      const [listingsRes, profilesRes, memberProfilesRes, msgsRes] = await Promise.all([
        listingIds.length ? supabase.from('listings').select('id, title').in('id', listingIds) : Promise.resolve({ data: [], error: null }),
        buyerIds.length ? supabase.from('public_profiles').select('id, full_name, dealer_name').in('id', buyerIds) : Promise.resolve({ data: [], error: null }),
        memberUserIds.length ? supabase.from('public_profiles').select('id, full_name, dealer_name').in('id', memberUserIds) : Promise.resolve({ data: [], error: null }),
        convs.length ? supabase.from('messages').select('conversation_id, sender_id, content, created_at').in('conversation_id', convs.map((c) => c.id)).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
      ]);

      if (listingsRes.error) throw listingsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (msgsRes.error) throw msgsRes.error;

      const listingMap = new Map((listingsRes.data ?? []).map((l: { id: string; title: string }) => [l.id, l.title]));
      const profileMap = new Map(
        (profilesRes.data ?? []).map((p: { id: string; full_name: string | null; dealer_name: string | null }) => [p.id, p.dealer_name ?? p.full_name]),
      );
      const memberNameByUserId = new Map(
        (memberProfilesRes.data ?? []).map((p: { id: string; full_name: string | null; dealer_name: string | null }) => [p.id, p.full_name ?? p.dealer_name ?? 'Verkoper']),
      );
      const memberNameById = new Map(members.map((m) => [m.id, memberNameByUserId.get(m.user_id) ?? 'Verkoper']));

      const lastMsgByConv = new Map<string, { sender_id: string; content: string; created_at: string }>();
      const convHasMessages = new Set<string>();
      (msgsRes.data ?? []).forEach((m: { conversation_id: string; sender_id: string; content: string; created_at: string }) => {
        convHasMessages.add(m.conversation_id);
        if (!lastMsgByConv.has(m.conversation_id)) lastMsgByConv.set(m.conversation_id, m);
      });

      const dealerLeads = contactRows.map((r) =>
        normalizeDealerLead(
          r,
          r.listing_id ? listingMap.get(r.listing_id) ?? null : null,
          r.assigned_to ? memberNameById.get(r.assigned_to) ?? null : null,
        ),
      );
      const convLeads = convs.map((c) => {
        const last = lastMsgByConv.get(c.id);
        return normalizeConversationLead(
          c,
          c.listing_id ? listingMap.get(c.listing_id) ?? null : null,
          profileMap.get(c.buyer_id) ?? null,
          last?.content ?? null,
          last?.created_at ?? c.created_at,
          {
            lastSenderIsBuyer: last ? last.sender_id === c.buyer_id : false,
            hasMessages: convHasMessages.has(c.id),
            assignedName: c.assigned_to ? memberNameById.get(c.assigned_to) ?? null : null,
          },
        );
      });

      return sortLeads([...dealerLeads, ...convLeads]);
    },
  });
}

/** Actieve verkopers van het bedrijf voor het toewijs-/filtermenu. */
export function useLeadAssignees() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-assignees', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<LeadAssignee[]> => {
      if (!user) return [];
      const { data: members, error } = await supabase
        .from('company_members')
        .select('id, user_id')
        .eq('status', 'active');
      if (error) throw error;
      const rows = (members ?? []) as { id: string; user_id: string }[];
      if (rows.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from('public_profiles')
        .select('id, full_name, dealer_name')
        .in('id', rows.map((m) => m.user_id));
      if (pErr) throw pErr;
      const nameByUserId = new Map(
        (profiles ?? []).map((p: { id: string; full_name: string | null; dealer_name: string | null }) => [p.id, p.full_name ?? p.dealer_name ?? 'Verkoper']),
      );
      return rows
        .map((m) => ({ id: m.id, name: nameByUserId.get(m.user_id) ?? 'Verkoper' }))
        .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    },
  });
}

/** Aantal leads per zichtbare pagina op de Leads-lijst. */
export const LEADS_PAGE_SIZE = 20;

export interface LeadsPage {
  visible: DealerLead[];
  hasMore: boolean;
  remaining: number;
  total: number;
}

/**
 * Incrementeel renderen van de gefilterde lijst: pagina's 1..N worden
 * samengevoegd getoond (infinite scroll). Realtime-refetches laten
 * `pageCount` ongemoeid, waardoor enkel de zichtbare kaarten patchen
 * en de scrollpositie behouden blijft.
 */
export function paginateLeads(
  leads: DealerLead[],
  pageCount: number,
  pageSize: number = LEADS_PAGE_SIZE,
): LeadsPage {
  const limit = Math.max(1, pageCount) * pageSize;
  return {
    visible: leads.slice(0, limit),
    hasMore: leads.length > limit,
    remaining: Math.max(0, leads.length - limit),
    total: leads.length,
  };
}

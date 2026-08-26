import type { LeadFocus, LeadPeriod, LeadSort, LeadTab } from '@/hooks/useDealerLeads';

/**
 * URL-state voor de Leads-pagina (/zakelijk/leads): tab, filters, sortering en
 * infinite-scroll positie (paginanummer) zijn deelbaar en overleven een reload.
 * Defaults worden weggelaten zodat de URL schoon blijft.
 */
export interface LeadsUrlState {
  tab: LeadTab;
  query: string;
  listing: string;
  period: LeadPeriod;
  sort: LeadSort;
  /** company_member id, 'none' voor niet-toegewezen, '' voor alles. */
  assignee: string;
  /** Kanaal/bron ('bericht', 'contact_form', …); '' = alles. */
  source: string;
  /** Landcode (BE/NL/…); '' = alles. */
  country: string;
  unansweredOnly: boolean;
  /** Focusfilter vanuit de prioriteitsbalk. */
  focus: LeadFocus;
  page: number;
}

export const LEADS_URL_DEFAULTS: LeadsUrlState = {
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
  page: 1,
};

const TABS: readonly LeadTab[] = ['action', 'in_progress', 'waiting_customer', 'scheduled', 'done', 'all'];
const PERIODS: readonly LeadPeriod[] = ['all', 'today', '7d', '30d'];
const SORTS: readonly LeadSort[] = ['priority', 'newest', 'longest_unanswered', 'followup', 'intent'];
const FOCUS: readonly LeadFocus[] = ['', 'new', 'waiting', 'followups'];

function pick<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function parseLeadsUrl(params: URLSearchParams): LeadsUrlState {
  const pageRaw = Number.parseInt(params.get('page') ?? '', 10);
  const rawTab = params.get('tab');
  // Legacy: 'new' was een eigen tab; die leeft nu onder Actie nodig + focus.
  if (rawTab === 'new') {
    return {
      ...LEADS_URL_DEFAULTS,
      tab: 'action',
      focus: 'new',
      query: params.get('q') ?? '',
      listing: params.get('listing') ?? '',
      period: pick(params.get('period'), PERIODS, LEADS_URL_DEFAULTS.period),
      sort: pick(params.get('sort'), SORTS, LEADS_URL_DEFAULTS.sort),
      page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
    };
  }
  return {
    tab: pick(rawTab, TABS, LEADS_URL_DEFAULTS.tab),
    query: params.get('q') ?? '',
    listing: params.get('listing') ?? '',
    period: pick(params.get('period'), PERIODS, LEADS_URL_DEFAULTS.period),
    sort: pick(params.get('sort'), SORTS, LEADS_URL_DEFAULTS.sort),
    assignee: params.get('assignee') ?? '',
    source: params.get('source') ?? '',
    country: params.get('country') ?? '',
    unansweredOnly: params.get('unanswered') === '1',
    focus: pick(params.get('focus'), FOCUS, LEADS_URL_DEFAULTS.focus),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

export function leadsUrlParams(state: LeadsUrlState): URLSearchParams {
  const p = new URLSearchParams();
  if (state.tab !== LEADS_URL_DEFAULTS.tab) p.set('tab', state.tab);
  if (state.query) p.set('q', state.query);
  if (state.listing) p.set('listing', state.listing);
  if (state.period !== LEADS_URL_DEFAULTS.period) p.set('period', state.period);
  if (state.sort !== LEADS_URL_DEFAULTS.sort) p.set('sort', state.sort);
  if (state.assignee) p.set('assignee', state.assignee);
  if (state.source) p.set('source', state.source);
  if (state.country) p.set('country', state.country);
  if (state.unansweredOnly) p.set('unanswered', '1');
  if (state.focus) p.set('focus', state.focus);
  if (state.page > 1) p.set('page', String(state.page));
  return p;
}

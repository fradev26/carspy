import type { LeadPeriod, LeadSort } from '@/hooks/useDealerLeads';
import type { LeadTab } from '@/components/dealer/leads/LeadFilters';

/**
 * URL-state voor de Leads-pagina (/zakelijk/leads): filters, sortering en
 * infinite-scroll positie (paginanummer) zijn deelbaar en overleven een reload.
 * Defaults worden weggelaten zodat de URL schoon blijft.
 */
export interface LeadsUrlState {
  tab: LeadTab;
  query: string;
  listing: string;
  period: LeadPeriod;
  sort: LeadSort;
  page: number;
}

export const LEADS_URL_DEFAULTS: LeadsUrlState = {
  tab: 'all',
  query: '',
  listing: '',
  period: 'all',
  sort: 'newest',
  page: 1,
};

const TABS: readonly LeadTab[] = ['all', 'new', 'in_progress', 'done'];
const PERIODS: readonly LeadPeriod[] = ['all', 'today', '7d', '30d'];
const SORTS: readonly LeadSort[] = ['newest', 'oldest', 'name'];

function pick<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function parseLeadsUrl(params: URLSearchParams): LeadsUrlState {
  const pageRaw = Number.parseInt(params.get('page') ?? '', 10);
  return {
    tab: pick(params.get('tab'), TABS, LEADS_URL_DEFAULTS.tab),
    query: params.get('q') ?? '',
    listing: params.get('listing') ?? '',
    period: pick(params.get('period'), PERIODS, LEADS_URL_DEFAULTS.period),
    sort: pick(params.get('sort'), SORTS, LEADS_URL_DEFAULTS.sort),
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
  if (state.page > 1) p.set('page', String(state.page));
  return p;
}

import { describe, it, expect } from 'vitest';
import { normalizeDealerLead, normalizeConversationLead, sortLeads, filterLeads, leadListingTitles, paginateLeads, LEADS_PAGE_SIZE } from './useDealerLeads';

describe('normalizeDealerLead', () => {
  it('mapt een contactaanvraag naar een lead', () => {
    const lead = normalizeDealerLead({
      id: 'l1',
      name: 'Jan Peeters',
      email: 'jan@example.com',
      phone: '+32 470 12 34 56',
      company: 'Peeters BV',
      message: '  Zit deze nog te koop?  ',
      status: 'new',
      listing_id: null,
      created_at: '2026-08-20T10:00:00Z',
    });
    expect(lead.type).toBe('contactaanvraag');
    expect(lead.name).toBe('Jan Peeters');
    expect(lead.snippet).toBe('Zit deze nog te koop?');
    expect(lead.status).toBe('new');
    expect(lead.conversationId).toBeUndefined();
  });

  it('valt terug op new bij onbekende status', () => {
    const lead = normalizeDealerLead({
      id: 'l2', name: 'X', email: null, phone: null, company: null,
      message: null, status: 'archived', listing_id: null, created_at: '2026-08-20T10:00:00Z',
    });
    expect(lead.status).toBe('new');
  });
});

describe('normalizeConversationLead', () => {
  it('bouwt een berichtlead op met gesprekslink en status uit het gesprek', () => {
    const conv = {
      id: 'c1', listing_id: 'lis-1', buyer_id: 'buyer-1', seller_id: 'seller-1',
      status: 'in_progress',
      created_at: '2026-08-19T08:00:00Z', updated_at: '2026-08-20T09:00:00Z',
    };
    const lead = normalizeConversationLead(conv, 'Volkswagen Golf 1.4', 'Sofie', 'Is de prijs onderhandelbaar?', '2026-08-20T09:00:00Z');
    expect(lead.type).toBe('bericht');
    expect(lead.name).toBe('Sofie');
    expect(lead.listingTitle).toBe('Volkswagen Golf 1.4');
    expect(lead.snippet).toBe('Is de prijs onderhandelbaar?');
    expect(lead.status).toBe('in_progress');
    expect(lead.conversationId).toBe('c1');
  });

  it('valt terug op in_progress bij onbekende gespreksstatus', () => {
    const conv = {
      id: 'c2', listing_id: null, buyer_id: 'b', seller_id: 's',
      status: 'archived',
      created_at: '2026-08-19T08:00:00Z', updated_at: '2026-08-20T09:00:00Z',
    };
    expect(normalizeConversationLead(conv, null, null, null, '2026-08-20T09:00:00Z').status).toBe('in_progress');
  });

  it('neemt done over als afgehandelde gespreksstatus', () => {
    const conv = {
      id: 'c3', listing_id: null, buyer_id: 'b', seller_id: 's',
      status: 'done',
      created_at: '2026-08-19T08:00:00Z', updated_at: '2026-08-20T09:00:00Z',
    };
    expect(normalizeConversationLead(conv, null, null, null, '2026-08-20T09:00:00Z').status).toBe('done');
  });
});

describe('sortLeads', () => {
  it('sorteert van nieuw naar oud', () => {
    const leads = [
      normalizeDealerLead({ id: 'a', name: 'A', email: null, phone: null, company: null, message: null, status: 'new', listing_id: null, created_at: '2026-08-18T00:00:00Z' }),
      normalizeDealerLead({ id: 'b', name: 'B', email: null, phone: null, company: null, message: null, status: 'new', listing_id: null, created_at: '2026-08-20T00:00:00Z' }),
      normalizeDealerLead({ id: 'c', name: 'C', email: null, phone: null, company: null, message: null, status: 'new', listing_id: null, created_at: '2026-08-19T00:00:00Z' }),
    ];
    expect(sortLeads(leads).map((l) => l.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('filterLeads', () => {
  const lead = (over: Partial<import('./useDealerLeads').DealerLead>) => ({
    id: 'x', type: 'contactaanvraag' as const, name: 'N', email: null, phone: null, company: null,
    listingTitle: null, listingId: null, snippet: '', status: 'new' as const,
    createdAt: '2026-08-20T10:00:00Z', ...over,
  });
  const now = new Date('2026-08-26T12:00:00Z');
  const base = { status: 'all' as const, query: '', listing: '', period: 'all' as const, sort: 'newest' as const };

  it('filtert op advertentietitel', () => {
    const leads = [lead({ id: 'a', listingTitle: 'Tesla Model 3' }), lead({ id: 'b', listingTitle: 'VW Golf' })];
    expect(filterLeads(leads, { ...base, listing: 'Tesla Model 3' }, now).map((l) => l.id)).toEqual(['a']);
  });

  it('filtert op periode', () => {
    const leads = [
      lead({ id: 'oud', createdAt: '2026-06-01T10:00:00Z' }),
      lead({ id: 'recent', createdAt: '2026-08-25T10:00:00Z' }),
    ];
    expect(filterLeads(leads, { ...base, period: '7d' }, now).map((l) => l.id)).toEqual(['recent']);
    expect(filterLeads(leads, { ...base, period: 'all' }, now)).toHaveLength(2);
  });

  it('combineert status, zoekterm en advertentie', () => {
    const leads = [
      lead({ id: 'a', name: 'Nadia', status: 'new', listingTitle: 'Tesla Model 3' }),
      lead({ id: 'b', name: 'Nadia', status: 'done', listingTitle: 'Tesla Model 3' }),
      lead({ id: 'c', name: 'Piet', status: 'new', listingTitle: 'Tesla Model 3' }),
    ];
    expect(filterLeads(leads, { ...base, status: 'new', query: 'nadia', listing: 'Tesla Model 3' }, now).map((l) => l.id)).toEqual(['a']);
  });

  it('sorteert op oudste en op naam', () => {
    const leads = [
      lead({ id: 'a', name: 'Zoe', createdAt: '2026-08-18T00:00:00Z' }),
      lead({ id: 'b', name: 'Anna', createdAt: '2026-08-20T00:00:00Z' }),
    ];
    expect(filterLeads(leads, { ...base, sort: 'oldest' }, now).map((l) => l.id)).toEqual(['a', 'b']);
    expect(filterLeads(leads, { ...base, sort: 'newest' }, now).map((l) => l.id)).toEqual(['b', 'a']);
    expect(filterLeads(leads, { ...base, sort: 'name' }, now).map((l) => l.name)).toEqual(['Anna', 'Zoe']);
  });
});

describe('leadListingTitles', () => {
  it('geeft unieke titels alfabetisch zonder lege waarden', () => {
    const mk = (t: string | null) => ({
      id: t ?? 'n', type: 'bericht' as const, name: 'N', email: null, phone: null, company: null,
      listingTitle: t, listingId: null, snippet: '', status: 'new' as const, createdAt: '2026-08-20T10:00:00Z',
    });
    expect(leadListingTitles([mk('VW Golf'), mk('Audi A3'), mk('VW Golf'), mk(null)])).toEqual(['Audi A3', 'VW Golf']);
  });
});

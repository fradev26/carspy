import { describe, it, expect } from 'vitest';
import {
  normalizeDealerLead, normalizeConversationLead, sortLeads, filterLeads,
  leadListingTitles, leadTabCounts, leadPriorityCounts, leadSources, leadCountries,
  paginateLeads, countryFromPhone, computeIntentScore, needsAction, followUpState,
  priorityScore, LEADS_PAGE_SIZE, LEAD_FILTER_DEFAULTS,
  type DealerLead, type LeadFilterCriteria,
} from './useDealerLeads';

const NOW = new Date('2026-08-26T12:00:00Z');

const dealerRow = (over: Record<string, unknown> = {}) => ({
  id: 'l1', name: 'Jan Peeters', email: 'jan@example.com', phone: '+32 470 12 34 56',
  company: 'Peeters BV', message: '  Zit deze nog te koop?  ', status: 'new',
  source: 'contact_form', listing_id: null, created_at: '2026-08-20T10:00:00Z',
  follow_up_at: null, snoozed_until: null, answered_at: null, assigned_to: null,
  ...over,
});

const convRow = (over: Record<string, unknown> = {}) => ({
  id: 'c1', listing_id: 'lis-1', buyer_id: 'buyer-1', seller_id: 'seller-1',
  status: 'in_progress', created_at: '2026-08-19T08:00:00Z', updated_at: '2026-08-20T09:00:00Z',
  follow_up_at: null, snoozed_until: null, answered_at: null, assigned_to: null,
  ...over,
});

/** Volledige DealerLead voor filter/sorteer-tests. */
const lead = (over: Partial<DealerLead> = {}): DealerLead => ({
  id: 'x', type: 'contactaanvraag', name: 'N', email: null, phone: null, company: null,
  listingTitle: null, listingId: null, snippet: '', status: 'new',
  createdAt: '2026-08-20T10:00:00Z', lastActivityAt: '2026-08-20T10:00:00Z',
  followUpAt: null, snoozedUntil: null, answeredAt: null,
  assignedTo: null, assignedName: null, source: 'contact_form', country: null,
  isUnanswered: true, isSystemActivity: false, intentScore: 50,
  ...over,
});

const base: LeadFilterCriteria = { ...LEAD_FILTER_DEFAULTS, tab: 'all', sort: 'newest' };

describe('normalizeDealerLead', () => {
  it('mapt een contactaanvraag naar een lead', () => {
    const l = normalizeDealerLead(dealerRow(), 'VW Golf', 'Els');
    expect(l.type).toBe('contactaanvraag');
    expect(l.name).toBe('Jan Peeters');
    expect(l.snippet).toBe('Zit deze nog te koop?');
    expect(l.status).toBe('new');
    expect(l.listingTitle).toBe('VW Golf');
    expect(l.assignedName).toBe('Els');
    expect(l.country).toBe('BE');
    expect(l.isUnanswered).toBe(true);
    expect(l.conversationId).toBeUndefined();
  });

  it('valt terug op new bij onbekende status', () => {
    expect(normalizeDealerLead(dealerRow({ status: 'archived' })).status).toBe('new');
  });

  it('markeert beantwoorde leads', () => {
    const l = normalizeDealerLead(dealerRow({ answered_at: '2026-08-21T10:00:00Z' }));
    expect(l.isUnanswered).toBe(false);
  });
});

describe('normalizeConversationLead', () => {
  it('bouwt een berichtlead op met gesprekslink en status uit het gesprek', () => {
    const l = normalizeConversationLead(convRow(), 'Volkswagen Golf 1.4', 'Sofie', 'Is de prijs onderhandelbaar?', '2026-08-20T09:00:00Z');
    expect(l.type).toBe('bericht');
    expect(l.name).toBe('Sofie');
    expect(l.listingTitle).toBe('Volkswagen Golf 1.4');
    expect(l.status).toBe('in_progress');
    expect(l.conversationId).toBe('c1');
    expect(l.source).toBe('bericht');
    expect(l.isSystemActivity).toBe(false);
  });

  it('valt terug op in_progress bij onbekende gespreksstatus', () => {
    const l = normalizeConversationLead(convRow({ status: 'archived' }), null, null, null, '2026-08-20T09:00:00Z');
    expect(l.status).toBe('in_progress');
  });

  it('markeert een gesprek zonder berichten als systeemactiviteit', () => {
    const l = normalizeConversationLead(convRow(), null, 'Koper', null, '2026-08-20T09:00:00Z');
    expect(l.isSystemActivity).toBe(true);
    expect(l.snippet).toBe('Nieuw gesprek gestart');
  });

  it('zet isUnanswered als de koper als laatste stuurde', () => {
    const l = normalizeConversationLead(convRow(), null, 'Koper', 'Hallo?', '2026-08-20T09:00:00Z', { lastSenderIsBuyer: true });
    expect(l.isUnanswered).toBe(true);
  });
});

describe('countryFromPhone', () => {
  it('herkent BE/NL/LU/FR/DE prefixen', () => {
    expect(countryFromPhone('+32 470 12 34 56')).toBe('BE');
    expect(countryFromPhone('0031 6 12345678')).toBe('NL');
    expect(countryFromPhone('+352 621 000')).toBe('LU');
    expect(countryFromPhone('+33 6 12 34 56 78')).toBe('FR');
    expect(countryFromPhone('+49 151 234')).toBe('DE');
  });

  it('behandelt Belgisch nationaal nummer als BE', () => {
    expect(countryFromPhone('0470 12 34 56')).toBe('BE');
  });

  it('geeft null zonder nummer of bij onbekende prefix', () => {
    expect(countryFromPhone(null)).toBeNull();
    expect(countryFromPhone('+1 555 0100')).toBeNull();
  });
});

describe('computeIntentScore', () => {
  it('scoort hoger met telefoon en intentiewoorden', () => {
    const hoog = computeIntentScore({ phone: '+32470123456', message: 'Kan ik een proefrit plannen?', createdAt: NOW.toISOString() }, NOW);
    const laag = computeIntentScore({ phone: null, message: '', createdAt: '2026-08-01T00:00:00Z' }, NOW);
    expect(hoog).toBeGreaterThan(laag);
    expect(hoog).toBeLessThanOrEqual(100);
  });
});

describe('needsAction / followUpState / priorityScore', () => {
  it('nieuwe en onbeantwoorde leads hebben actie nodig', () => {
    expect(needsAction(lead({ status: 'new' }), NOW)).toBe(true);
    expect(needsAction(lead({ status: 'in_progress', isUnanswered: true }), NOW)).toBe(true);
  });

  it('afgehandelde, gesnoozete en systeemleads hebben geen actie nodig', () => {
    expect(needsAction(lead({ status: 'done' }), NOW)).toBe(false);
    expect(needsAction(lead({ snoozedUntil: '2026-08-27T00:00:00Z' }), NOW)).toBe(false);
    expect(needsAction(lead({ isSystemActivity: true }), NOW)).toBe(false);
  });

  it('beantwoorde leads in behandeling zonder opvolging hebben geen actie nodig', () => {
    expect(needsAction(lead({ status: 'in_progress', isUnanswered: false }), NOW)).toBe(false);
  });

  it('te late of opvolging van vandaag vereist actie', () => {
    expect(followUpState(lead({ followUpAt: '2026-08-25T09:00:00Z' }), NOW)).toBe('overdue');
    expect(followUpState(lead({ followUpAt: '2026-08-26T18:00:00Z' }), NOW)).toBe('today');
    expect(followUpState(lead({ followUpAt: '2026-08-30T09:00:00Z' }), NOW)).toBe('upcoming');
    expect(needsAction(lead({ status: 'in_progress', isUnanswered: false, followUpAt: '2026-08-25T09:00:00Z' }), NOW)).toBe(true);
  });

  it('te late opvolging krijgt de hoogste prioriteit', () => {
    const overdue = lead({ status: 'in_progress', isUnanswered: false, followUpAt: '2026-08-20T09:00:00Z' });
    const nieuw = lead({ status: 'new' });
    expect(priorityScore(overdue, NOW)).toBeGreaterThan(priorityScore(nieuw, NOW));
  });
});

describe('sortLeads', () => {
  it('sorteert van nieuw naar oud', () => {
    const leads = [
      lead({ id: 'a', createdAt: '2026-08-18T00:00:00Z' }),
      lead({ id: 'b', createdAt: '2026-08-20T00:00:00Z' }),
      lead({ id: 'c', createdAt: '2026-08-19T00:00:00Z' }),
    ];
    expect(sortLeads(leads).map((l) => l.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('filterLeads', () => {
  it('filtert op advertentietitel', () => {
    const leads = [lead({ id: 'a', listingTitle: 'Tesla Model 3' }), lead({ id: 'b', listingTitle: 'VW Golf' })];
    expect(filterLeads(leads, { ...base, listing: 'Tesla Model 3' }, NOW).map((l) => l.id)).toEqual(['a']);
  });

  it('filtert op periode', () => {
    const leads = [
      lead({ id: 'oud', createdAt: '2026-06-01T10:00:00Z' }),
      lead({ id: 'recent', createdAt: '2026-08-25T10:00:00Z' }),
    ];
    expect(filterLeads(leads, { ...base, period: '7d' }, NOW).map((l) => l.id)).toEqual(['recent']);
    expect(filterLeads(leads, { ...base, period: 'all' }, NOW)).toHaveLength(2);
  });

  it('tab "action" toont enkel leads die actie nodig hebben', () => {
    const leads = [
      lead({ id: 'nieuw', status: 'new' }),
      lead({ id: 'beantwoord', status: 'in_progress', isUnanswered: false }),
      lead({ id: 'klaar', status: 'done' }),
      lead({ id: 'systeem', isSystemActivity: true }),
    ];
    expect(filterLeads(leads, { ...base, tab: 'action' }, NOW).map((l) => l.id)).toEqual(['nieuw']);
  });

  it('filtert op verkoper, bron, land en onbeantwoord', () => {
    const leads = [
      lead({ id: 'a', assignedTo: 'm1', source: 'contact_form', country: 'BE', isUnanswered: true }),
      lead({ id: 'b', assignedTo: null, source: 'bericht', country: 'NL', isUnanswered: false }),
    ];
    expect(filterLeads(leads, { ...base, assignee: 'm1' }, NOW).map((l) => l.id)).toEqual(['a']);
    expect(filterLeads(leads, { ...base, assignee: 'none' }, NOW).map((l) => l.id)).toEqual(['b']);
    expect(filterLeads(leads, { ...base, source: 'bericht' }, NOW).map((l) => l.id)).toEqual(['b']);
    expect(filterLeads(leads, { ...base, country: 'BE' }, NOW).map((l) => l.id)).toEqual(['a']);
    expect(filterLeads(leads, { ...base, unansweredOnly: true }, NOW).map((l) => l.id)).toEqual(['a']);
  });

  it('focusfilters van de prioriteitsbalk', () => {
    const leads = [
      lead({ id: 'nieuw', status: 'new', isUnanswered: false }),
      lead({ id: 'wacht', status: 'in_progress', isUnanswered: true, lastActivityAt: '2026-08-20T12:00:00Z' }),
      lead({ id: 'opvolging', status: 'in_progress', isUnanswered: false, followUpAt: '2026-08-26T10:00:00Z' }),
    ];
    expect(filterLeads(leads, { ...base, focus: 'new' }, NOW).map((l) => l.id)).toEqual(['nieuw']);
    expect(filterLeads(leads, { ...base, focus: 'waiting' }, NOW).map((l) => l.id)).toEqual(['wacht']);
    expect(filterLeads(leads, { ...base, focus: 'followups' }, NOW).map((l) => l.id)).toEqual(['opvolging']);
  });

  it('sorteert op langst onbeantwoord en koopintentie', () => {
    const leads = [
      lead({ id: 'a', isUnanswered: true, lastActivityAt: '2026-08-25T00:00:00Z', intentScore: 10 }),
      lead({ id: 'b', isUnanswered: true, lastActivityAt: '2026-08-18T00:00:00Z', intentScore: 90 }),
      lead({ id: 'c', isUnanswered: false, intentScore: 100 }),
    ];
    expect(filterLeads(leads, { ...base, sort: 'longest_unanswered' }, NOW).map((l) => l.id)).toEqual(['b', 'a', 'c']);
    expect(filterLeads(leads, { ...base, sort: 'intent' }, NOW).map((l) => l.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorteert op eerstvolgende opvolging', () => {
    const leads = [
      lead({ id: 'later', followUpAt: '2026-09-01T09:00:00Z' }),
      lead({ id: 'geen', followUpAt: null }),
      lead({ id: 'vroeg', followUpAt: '2026-08-27T09:00:00Z' }),
    ];
    expect(filterLeads(leads, { ...base, sort: 'followup' }, NOW).map((l) => l.id)).toEqual(['vroeg', 'later', 'geen']);
  });

  it('combineert tab, zoekterm en advertentie', () => {
    const leads = [
      lead({ id: 'a', name: 'Nadia', status: 'new', listingTitle: 'Tesla Model 3' }),
      lead({ id: 'b', name: 'Nadia', status: 'done', listingTitle: 'Tesla Model 3' }),
      lead({ id: 'c', name: 'Piet', status: 'new', listingTitle: 'Tesla Model 3' }),
    ];
    expect(filterLeads(leads, { ...base, tab: 'action', query: 'nadia', listing: 'Tesla Model 3' }, NOW).map((l) => l.id)).toEqual(['a']);
  });
});

describe('tellers en facetten', () => {
  const leads = [
    lead({ id: 'nieuw', status: 'new' }),
    lead({ id: 'behandeling', status: 'in_progress', isUnanswered: false, source: 'bericht', country: 'NL' }),
    lead({ id: 'klaar', status: 'done', isUnanswered: false }),
    lead({ id: 'wachtend', status: 'waiting_customer', isUnanswered: true, lastActivityAt: '2026-08-20T00:00:00Z' }),
  ];

  it('leadTabCounts telt per tab inclusief actie-weergave', () => {
    const counts = leadTabCounts(leads, NOW);
    expect(counts.all).toBe(4);
    expect(counts.in_progress).toBe(1);
    expect(counts.waiting_customer).toBe(1);
    expect(counts.done).toBe(1);
    expect(counts.action).toBe(2); // nieuw + wachtend (onbeantwoord)
  });

  it('leadPriorityCounts telt nieuwe, wachtende en opvolgingen', () => {
    const counts = leadPriorityCounts(leads, NOW);
    expect(counts.new).toBe(1);
    expect(counts.waiting).toBe(1); // wachtend wacht > 24u
    expect(counts.followups).toBe(0);
  });

  it('leadSources zet bericht eerst en sorteert de rest', () => {
    expect(leadSources(leads)).toEqual(['bericht', 'contact_form']);
  });

  it('leadCountries geeft unieke landcodes', () => {
    expect(leadCountries(leads)).toEqual(['NL']);
  });
});

describe('leadListingTitles', () => {
  it('geeft unieke titels alfabetisch zonder lege waarden', () => {
    expect(leadListingTitles([
      lead({ listingTitle: 'VW Golf' }), lead({ listingTitle: 'Audi A3' }),
      lead({ listingTitle: 'VW Golf' }), lead({ listingTitle: null }),
    ])).toEqual(['Audi A3', 'VW Golf']);
  });
});

describe('paginateLeads', () => {
  const many = Array.from({ length: LEADS_PAGE_SIZE * 2 + 5 }, (_, i) => lead({ id: `l${i}`, name: `Lead ${i}` }));

  it('toont de eerste pagina en meldt dat er meer is', () => {
    const page = paginateLeads(many, 1);
    expect(page.visible).toHaveLength(LEADS_PAGE_SIZE);
    expect(page.hasMore).toBe(true);
    expect(page.remaining).toBe(LEADS_PAGE_SIZE + 5);
    expect(page.total).toBe(many.length);
  });

  it('breidt uit zonder eerdere items te vervangen (infinite scroll)', () => {
    const page = paginateLeads(many, 2);
    expect(page.visible).toHaveLength(LEADS_PAGE_SIZE * 2);
    expect(page.visible[0].id).toBe('l0');
    expect(page.hasMore).toBe(true);
    expect(page.remaining).toBe(5);
  });

  it('geeft hasMore=false zodra alles zichtbaar is', () => {
    const page = paginateLeads(many, 3);
    expect(page.visible).toHaveLength(many.length);
    expect(page.hasMore).toBe(false);
  });

  it('clampt pageCount naar minstens één pagina', () => {
    expect(paginateLeads(many, 0).visible).toHaveLength(LEADS_PAGE_SIZE);
    expect(paginateLeads([], 1)).toMatchObject({ visible: [], hasMore: false, remaining: 0, total: 0 });
  });
});

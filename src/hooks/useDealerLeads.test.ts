import { describe, it, expect } from 'vitest';
import { normalizeDealerLead, normalizeConversationLead, sortLeads } from './useDealerLeads';

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
      message: null, status: 'archived', created_at: '2026-08-20T10:00:00Z',
    });
    expect(lead.status).toBe('new');
  });
});

describe('normalizeConversationLead', () => {
  it('bouwt een berichtlead op met gesprekslink', () => {
    const conv = {
      id: 'c1', listing_id: 'lis-1', buyer_id: 'buyer-1', seller_id: 'seller-1',
      created_at: '2026-08-19T08:00:00Z', updated_at: '2026-08-20T09:00:00Z',
    };
    const lead = normalizeConversationLead(conv, 'Volkswagen Golf 1.4', 'Sofie', 'Is de prijs onderhandelbaar?', '2026-08-20T09:00:00Z');
    expect(lead.type).toBe('bericht');
    expect(lead.name).toBe('Sofie');
    expect(lead.listingTitle).toBe('Volkswagen Golf 1.4');
    expect(lead.snippet).toBe('Is de prijs onderhandelbaar?');
    expect(lead.status).toBe('contacted');
    expect(lead.conversationId).toBe('c1');
  });
});

describe('sortLeads', () => {
  it('sorteert van nieuw naar oud', () => {
    const leads = [
      normalizeDealerLead({ id: 'a', name: 'A', email: null, phone: null, company: null, message: null, status: 'new', created_at: '2026-08-18T00:00:00Z' }),
      normalizeDealerLead({ id: 'b', name: 'B', email: null, phone: null, company: null, message: null, status: 'new', created_at: '2026-08-20T00:00:00Z' }),
      normalizeDealerLead({ id: 'c', name: 'C', email: null, phone: null, company: null, message: null, status: 'new', created_at: '2026-08-19T00:00:00Z' }),
    ];
    expect(sortLeads(leads).map((l) => l.id)).toEqual(['b', 'c', 'a']);
  });
});

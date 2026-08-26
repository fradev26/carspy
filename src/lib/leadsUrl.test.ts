import { describe, it, expect } from 'vitest';
import { parseLeadsUrl, leadsUrlParams, LEADS_URL_DEFAULTS } from './leadsUrl';

describe('parseLeadsUrl', () => {
  it('geeft defaults bij een lege querystring', () => {
    expect(parseLeadsUrl(new URLSearchParams())).toEqual(LEADS_URL_DEFAULTS);
  });

  it('leest alle filters, sortering en pagina uit de URL', () => {
    const params = new URLSearchParams('tab=new&q=nadia&listing=Tesla+Model+3&period=7d&sort=name&page=3');
    expect(parseLeadsUrl(params)).toEqual({
      tab: 'new', query: 'nadia', listing: 'Tesla Model 3', period: '7d', sort: 'name', page: 3,
    });
  });

  it('valt terug op defaults bij ongeldige waarden', () => {
    const params = new URLSearchParams('tab=banana&period=year&sort=random&page=-4');
    expect(parseLeadsUrl(params)).toEqual(LEADS_URL_DEFAULTS);
  });

  it('clampt de pagina naar minstens 1', () => {
    expect(parseLeadsUrl(new URLSearchParams('page=0')).page).toBe(1);
    expect(parseLeadsUrl(new URLSearchParams('page=abc')).page).toBe(1);
    expect(parseLeadsUrl(new URLSearchParams('page=2.9')).page).toBe(2);
  });
});

describe('leadsUrlParams', () => {
  it('laat defaults weg voor een schone URL', () => {
    expect(leadsUrlParams(LEADS_URL_DEFAULTS).toString()).toBe('');
  });

  it('serialiseert enkel afwijkende waarden', () => {
    const p = leadsUrlParams({ ...LEADS_URL_DEFAULTS, tab: 'done', page: 2 });
    expect(p.get('tab')).toBe('done');
    expect(p.get('page')).toBe('2');
    expect(p.get('q')).toBeNull();
    expect(p.get('sort')).toBeNull();
  });

  it('is een verliesloze round-trip met parseLeadsUrl', () => {
    const state = { tab: 'in_progress' as const, query: 'peeters', listing: 'VW Golf', period: '30d' as const, sort: 'oldest' as const, page: 4 };
    expect(parseLeadsUrl(leadsUrlParams(state))).toEqual(state);
  });
});

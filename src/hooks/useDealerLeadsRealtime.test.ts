import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createLeadRefreshScheduler, invalidateLeadQueries, newLeadFromInsert } from './useDealerLeadsRealtime';

describe('createLeadRefreshScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('bundelt een burst events tot één run', () => {
    const run = vi.fn();
    const s = createLeadRefreshScheduler(run, 300);
    s.schedule();
    s.schedule();
    s.schedule();
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('draait opnieuw voor events na de debounce-venster', () => {
    const run = vi.fn();
    const s = createLeadRefreshScheduler(run, 300);
    s.schedule();
    vi.advanceTimersByTime(300);
    s.schedule();
    vi.advanceTimersByTime(300);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('cancel voorkomt een geplande run', () => {
    const run = vi.fn();
    const s = createLeadRefreshScheduler(run, 300);
    s.schedule();
    s.cancel();
    vi.advanceTimersByTime(1000);
    expect(run).not.toHaveBeenCalled();
  });
});

describe('invalidateLeadQueries', () => {
  it('invalideert de leadslijst en de badge-teller', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    invalidateLeadQueries(qc);
    expect(spy).toHaveBeenCalledWith({ queryKey: ['dealer-leads'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['new-leads-count'] });
  });
});

describe('newLeadFromInsert', () => {
  it('mapt een contactaanvraag met naam en id', () => {
    expect(newLeadFromInsert('dealer_leads', { id: 'abc', name: 'Nadia Bakker' })).toEqual({
      id: 'abc',
      name: 'Nadia Bakker',
      type: 'contactaanvraag',
    });
  });

  it('valt terug op een generieke naam bij een lege naam', () => {
    expect(newLeadFromInsert('dealer_leads', { id: 'abc', name: '  ' })?.name).toBe('Onbekende bezoeker');
    expect(newLeadFromInsert('dealer_leads', { id: 'abc' })?.name).toBe('Onbekende bezoeker');
  });

  it('geeft gesprekken het conv- prefix voor de detailroute', () => {
    expect(newLeadFromInsert('conversations', { id: 'xyz' })).toEqual({
      id: 'conv-xyz',
      name: 'Koper',
      type: 'bericht',
    });
  });

  it('geeft null terug zonder geldig id', () => {
    expect(newLeadFromInsert('dealer_leads', { name: 'Nadia' })).toBeNull();
    expect(newLeadFromInsert('conversations', {})).toBeNull();
  });
});

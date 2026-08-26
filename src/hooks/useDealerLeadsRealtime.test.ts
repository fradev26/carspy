import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createLeadRefreshScheduler, invalidateLeadQueries } from './useDealerLeadsRealtime';

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

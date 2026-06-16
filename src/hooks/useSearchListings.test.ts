import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Capture the chain calls made against the mocked supabase query builder.
type Call = { method: string; args: unknown[] };
const calls: Call[] = [];

// Builder that records every method call and returns itself for chaining.
function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const methods = [
    'select', 'eq', 'in', 'gte', 'lte', 'or', 'contains',
    'order', 'range', 'limit', 'neq', 'maybeSingle',
  ];
  for (const m of methods) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  // Make the builder thenable so `await` resolves with our mock data.
  (builder as unknown as PromiseLike<unknown>).then = (
    onFulfilled: (value: { data: unknown[]; error: null; count: number }) => unknown,
  ) => Promise.resolve({ data: [], error: null, count: 0 }).then(onFulfilled);
  return builder;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => makeBuilder()),
  },
}));

import { useSearchListings } from './useSearchListings';
import { supabase } from '@/integrations/supabase/client';

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
});

function findCall(method: string, predicate?: (args: unknown[]) => boolean) {
  return calls.find((c) => c.method === method && (!predicate || predicate(c.args)));
}

describe('useSearchListings query builder', () => {
  it('always filters status=active', async () => {
    renderHook(() => useSearchListings({ filters: {} }));
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(findCall('eq', ([col, val]) => col === 'status' && val === 'active')).toBeDefined();
  });

  it('orders by is_premium then is_boosted (premium-first sort)', async () => {
    renderHook(() => useSearchListings({ filters: {} }));
    await waitFor(() => calls.some((c) => c.method === 'range'));
    const orderCols = calls.filter((c) => c.method === 'order').map((c) => c.args[0]);
    expect(orderCols.slice(0, 2)).toEqual(['is_premium', 'is_boosted']);
  });

  it('applies range() for pagination (page 2 of 24)', async () => {
    renderHook(() => useSearchListings({ filters: {}, page: 2, perPage: 24 }));
    await waitFor(() => calls.some((c) => c.method === 'range'));
    const range = findCall('range');
    expect(range?.args).toEqual([24, 47]);
  });

  it('maps array filters to .in() calls on correct columns', async () => {
    renderHook(() =>
      useSearchListings({
        filters: {
          fuelTypes: ['diesel', 'petrol'],
          bodyTypes: ['suv'],
          transmissions: ['automatic'],
          colors: ['black'],
        },
      }),
    );
    await waitFor(() => calls.some((c) => c.method === 'range'));
    expect(findCall('in', ([col]) => col === 'fuel_type')).toBeDefined();
    expect(findCall('in', ([col]) => col === 'body_type')).toBeDefined();
    expect(findCall('in', ([col]) => col === 'transmission')).toBeDefined();
    expect(findCall('in', ([col]) => col === 'color')).toBeDefined();
  });

  it('maps numeric ranges to gte/lte on the right columns', async () => {
    renderHook(() =>
      useSearchListings({
        filters: { minPrice: 5000, maxPrice: 20000, minYear: 2018, maxMileage: 120000 },
      }),
    );
    await waitFor(() => calls.some((c) => c.method === 'range'));
    expect(findCall('gte', ([col, v]) => col === 'price' && v === 5000)).toBeDefined();
    expect(findCall('lte', ([col, v]) => col === 'price' && v === 20000)).toBeDefined();
    expect(findCall('gte', ([col, v]) => col === 'year' && v === 2018)).toBeDefined();
    expect(findCall('lte', ([col, v]) => col === 'mileage' && v === 120000)).toBeDefined();
  });

  it('uses .contains() on equipment array for features filter (AND semantics)', async () => {
    renderHook(() =>
      useSearchListings({ filters: { features: ['leather', 'navi'] } }),
    );
    await waitFor(() => calls.some((c) => c.method === 'range'));
    const contains = findCall('contains');
    expect(contains?.args[0]).toBe('equipment');
    expect(contains?.args[1]).toEqual(['leather', 'navi']);
  });

  it('sends free-text query as an .or() ilike across title/brand/model/description', async () => {
    renderHook(() => useSearchListings({ filters: {}, query: 'golf' }));
    await waitFor(() => calls.some((c) => c.method === 'range'));
    const or = findCall('or');
    expect(or?.args[0]).toMatch(/title\.ilike\.%golf%/);
    expect(or?.args[0]).toMatch(/brand\.ilike\.%golf%/);
    expect(or?.args[0]).toMatch(/description\.ilike\.%golf%/);
  });

  it('queries the listings table', async () => {
    renderHook(() => useSearchListings({ filters: {} }));
    await waitFor(() => calls.some((c) => c.method === 'range'));
    expect(supabase.from).toHaveBeenCalledWith('listings');
  });
});

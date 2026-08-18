import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the chain calls made against the mocked supabase query builder.
type Call = { method: string; args: unknown[] };
const calls: Call[] = [];

function makeBuilder(): any {
  const builder: any = {};
  const methods = [
    'select', 'eq', 'in', 'gte', 'lte', 'lt', 'or', 'contains',
    'order', 'range', 'limit', 'neq', 'maybeSingle',
  ];
  for (const m of methods) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  builder.then = (onFulfilled: any) =>
    Promise.resolve({ data: [], error: null, count: 0 }).then(onFulfilled);
  return builder;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => makeBuilder()),
  },
}));

import { fetchSearchListingsPage } from './useSearchListings';
import { supabase } from '@/integrations/supabase/client';
import { encodeCursor } from '@/lib/keyset';

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
});

function findCall(method: string, predicate?: (args: unknown[]) => boolean) {
  return calls.find((c) => c.method === method && (!predicate || predicate(c.args)));
}

describe('fetchSearchListingsPage (keyset query builder)', () => {
  it('always filters status=active and queries the listings table', async () => {
    await fetchSearchListingsPage({ filters: {} });
    expect(supabase.from).toHaveBeenCalledWith('listings');
    expect(findCall('eq', ([col, val]) => col === 'status' && val === 'active')).toBeDefined();
  });

  it('orders by the full keyset (premium, boosted, created_at, id) and never uses range()', async () => {
    await fetchSearchListingsPage({ filters: {} });
    const orderCols = calls.filter((c) => c.method === 'order').map((c) => c.args[0]);
    expect(orderCols).toEqual(['is_premium', 'is_boosted', 'created_at', 'id']);
    expect(findCall('range')).toBeUndefined();
  });

  it('includes the sort column in the ordering keys for price sorts', async () => {
    await fetchSearchListingsPage({ filters: {}, sort: 'price-asc' });
    const orders = calls.filter((c) => c.method === 'order');
    expect(orders.map((c) => c.args[0])).toEqual(['is_premium', 'is_boosted', 'price', 'created_at', 'id']);
    const priceOrder = orders.find((c) => c.args[0] === 'price');
    expect((priceOrder?.args[1] as any).ascending).toBe(true);
  });

  it('applies limit() with the requested batch size (default 20)', async () => {
    await fetchSearchListingsPage({ filters: {} });
    expect(findCall('limit')?.args).toEqual([20]);
    calls.length = 0;
    await fetchSearchListingsPage({ filters: {}, limit: 40 });
    expect(findCall('limit')?.args).toEqual([40]);
  });

  it('adds a keyset .or() predicate when a cursor is supplied', async () => {
    const cursor = encodeCursor([false, false, '2026-08-01T10:00:00Z', 'abc']);
    await fetchSearchListingsPage({ filters: {}, cursor });
    const or = findCall('or', ([expr]) => String(expr).includes('created_at'));
    expect(or).toBeDefined();
    expect(String(or?.args[0])).toContain('is_premium.lt.false');
    expect(String(or?.args[0])).toContain('id.lt."abc"');
  });

  it('maps array filters to .in() calls on correct columns', async () => {
    await fetchSearchListingsPage({
      filters: {
        fuelTypes: ['diesel', 'benzine'],
        bodyTypes: ['suv'],
        transmissions: ['automaat'],
        colors: ['black'],
      },
    });
    expect(findCall('in', ([col]) => col === 'fuel_type')).toBeDefined();
    expect(findCall('in', ([col]) => col === 'body_type')).toBeDefined();
    expect(findCall('in', ([col]) => col === 'transmission')).toBeDefined();
    expect(findCall('in', ([col]) => col === 'color')).toBeDefined();
  });

  it('maps numeric ranges to gte/lte on the right columns', async () => {
    await fetchSearchListingsPage({
      filters: { minPrice: 5000, maxPrice: 20000, minYear: 2018, maxMileage: 120000 },
    });
    expect(findCall('gte', ([col, v]) => col === 'price' && v === 5000)).toBeDefined();
    expect(findCall('lte', ([col, v]) => col === 'price' && v === 20000)).toBeDefined();
    expect(findCall('gte', ([col, v]) => col === 'year' && v === 2018)).toBeDefined();
    expect(findCall('lte', ([col, v]) => col === 'mileage' && v === 120000)).toBeDefined();
  });

  it('uses .contains() on equipment array for features filter (AND semantics)', async () => {
    await fetchSearchListingsPage({ filters: { features: ['leather', 'navi'] } });
    const contains = findCall('contains');
    expect(contains?.args[0]).toBe('equipment');
    expect(contains?.args[1]).toEqual(['leather', 'navi']);
  });

  it('sends free-text query as an .or() ilike across title/brand/model/description', async () => {
    await fetchSearchListingsPage({ filters: {}, query: 'golf' });
    const or = findCall('or', ([expr]) => String(expr).includes('ilike'));
    expect(String(or?.args[0])).toMatch(/title\.ilike\.%golf%/);
    expect(String(or?.args[0])).toMatch(/brand\.ilike\.%golf%/);
    expect(String(or?.args[0])).toMatch(/description\.ilike\.%golf%/);
  });
});

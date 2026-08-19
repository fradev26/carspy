import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Listing, SearchFilters } from '@/types/listing';
import {
  DEFAULT_PAGE_SIZE,
  buildKeysetFilter,
  cursorFromRow,
  decodeCursor,
  searchSortKeys,
} from '@/lib/keyset';

// Column whitelist. `is_boosted` / `is_premium` are part of the keyset ordering
// and therefore must be selected so we can build the next cursor.
const LISTING_COLUMNS = `
  id, user_id, title, brand, model, model_version, year, price, price_public,
  price_negotiable, vat_deductible, vat_rate, mileage, mileage_unit,
  fuel_type, additional_fuel_types, transmission, body_type, color,
  power, power_unit, engine_size, door_count, seat_count, doors, seats,
  drivetrain, first_registration_date, previous_owner_count,
  vin, licence_plate, vehicle_type, condition_type,
  source, images, features, equipment, highlights, description,
  city, province, status, views, is_premium, is_boosted, boost_until,
  created_at, updated_at
`;

interface ProfileRow {
  id: string;
  full_name: string | null;
  dealer_name: string | null;
  is_dealer: boolean | null;
  avatar_url: string | null;
  created_at: string;
}

interface Row {
  id: string;
  user_id: string;
  title: string;
  brand: string;
  model: string;
  model_version: string | null;
  year: number;
  price: number | null;
  price_public: number | null;
  price_negotiable: boolean | null;
  vat_deductible: boolean | null;
  vat_rate: number | null;
  mileage: number;
  mileage_unit: string | null;
  fuel_type: string;
  additional_fuel_types: string[] | null;
  transmission: string;
  body_type: string;
  color: string | null;
  power: number | null;
  power_unit: string | null;
  engine_size: number | null;
  door_count: number | null;
  seat_count: number | null;
  doors: number | null;
  seats: number | null;
  drivetrain: string | null;
  first_registration_date: string | null;
  previous_owner_count: number | null;
  vin: string | null;
  licence_plate: string | null;
  vehicle_type: string | null;
  condition_type: string | null;
  source: string | null;
  images: string[] | null;
  features: string[] | null;
  equipment: string[] | null;
  highlights: string[] | null;
  description: string | null;
  city: string | null;
  province: string | null;
  status: string;
  views: number;
  is_premium: boolean;
  is_boosted?: boolean | null;
  boost_until: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Single shared row → Listing mapper (see `src/hooks/useListings.ts`).
 * The search query selects a subset of columns; missing fields map to undefined.
 */
function mapRow(row: Row, profile: ProfileRow | null): Listing {
  return mapListingRow({ ...row, profiles: profile } as never);
}

export interface SearchListingsRequest {
  filters: SearchFilters;
  query?: string;
  sort?: string;
  /** Opaque keyset cursor from the previous batch. */
  cursor?: string | null;
  /** Batch size — default 20 for a fast first paint on mobile. */
  limit?: number;
}

export interface ListingsPage {
  items: Listing[];
  nextCursor: string | null;
  /** Only returned for the first batch (cursor === null). */
  total: number | null;
}

/**
 * Cursor-based (keyset) fetch of one batch of search results.
 * Shared contract with the dealer inventory feed, reusable by native clients.
 */
export async function fetchSearchListingsPage({
  filters,
  query,
  sort = 'newest',
  cursor = null,
  limit = DEFAULT_PAGE_SIZE,
}: SearchListingsRequest): Promise<ListingsPage> {
  const keys = searchSortKeys(sort);
  const isFirstBatch = !cursor;

  let q = supabase
    .from('listings')
    .select(LISTING_COLUMNS, isFirstBatch ? { count: 'exact' } : undefined)
    .eq('status', 'active');

  // Free-text query
  const term = query?.trim();
  if (term) {
    const safe = term.replace(/[,%()]/g, ' ').slice(0, 80);
    const pattern = `%${safe}%`;
    q = q.or(
      `title.ilike.${pattern},brand.ilike.${pattern},model.ilike.${pattern},description.ilike.${pattern}`,
    );
  }

  // Basic
  if (filters.brand && filters.brand !== 'all') q = q.eq('brand', filters.brand);
  if (filters.model) q = q.eq('model', filters.model);
  if (filters.minPrice != null) q = q.gte('price', filters.minPrice);
  if (filters.maxPrice != null) q = q.lte('price', filters.maxPrice);
  if (filters.minYear != null) q = q.gte('year', filters.minYear);
  if (filters.maxYear != null) q = q.lte('year', filters.maxYear);
  if (filters.minMileage != null && filters.minMileage > 0) q = q.gte('mileage', filters.minMileage);
  if (filters.maxMileage != null && filters.maxMileage > 0) q = q.lte('mileage', filters.maxMileage);
  if (filters.minPower != null) q = q.gte('power', filters.minPower);
  if (filters.maxPower != null) q = q.lte('power', filters.maxPower);

  // Arrays → IN
  if (filters.fuelTypes?.length) q = q.in('fuel_type', filters.fuelTypes);
  if (filters.bodyTypes?.length) q = q.in('body_type', filters.bodyTypes);
  if (filters.transmissions?.length) q = q.in('transmission', filters.transmissions);
  if (filters.driveTypes?.length) q = q.in('drivetrain', filters.driveTypes);
  if (filters.colors?.length) q = q.in('color', filters.colors);

  // Practical
  if (filters.minDoors != null) q = q.gte('door_count', filters.minDoors);
  if (filters.minSeats != null) q = q.gte('seat_count', filters.minSeats);

  // Location
  if (filters.province) q = q.eq('province', filters.province);

  // History
  if (filters.maxPreviousOwners != null) q = q.lte('previous_owner_count', filters.maxPreviousOwners);
  if (filters.vatDeductible) q = q.eq('vat_deductible', true);

  // Online since
  if (filters.onlineSince) {
    const daysMap: Record<string, number> = { today: 1, '3d': 3, '7d': 7, '14d': 14, '30d': 30 };
    if (filters.onlineSince === '30d+') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      q = q.lt('created_at', cutoff);
    } else if (daysMap[filters.onlineSince]) {
      const cutoff = new Date(
        Date.now() - daysMap[filters.onlineSince] * 24 * 60 * 60 * 1000,
      ).toISOString();
      q = q.gte('created_at', cutoff);
    }
  }

  // Features array (must contain all)
  if (filters.features?.length) q = q.contains('equipment', filters.features);

  // Keyset predicate: everything strictly after the cursor row.
  const cursorValues = decodeCursor(cursor);
  if (cursorValues) {
    const expr = buildKeysetFilter(keys, cursorValues);
    if (expr) q = q.or(expr);
  }

  // Ordering must exactly match the keyset keys.
  for (const key of keys) {
    q = q.order(key.column, { ascending: key.dir === 'asc', nullsFirst: false });
  }

  q = q.limit(limit);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Row[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  let profilesById = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from('public_profiles' as any)
      .select('id, full_name, dealer_name, is_dealer, avatar_url, created_at')
      .in('id', userIds);
    profilesById = new Map(((profs ?? []) as unknown as ProfileRow[]).map((p) => [p.id, p]));
  }

  const lastRow = rows[rows.length - 1];
  return {
    items: rows.map((r) => mapRow(r, profilesById.get(r.user_id) ?? null)),
    nextCursor:
      rows.length === limit && lastRow
        ? cursorFromRow(lastRow as unknown as Record<string, unknown>, keys)
        : null,
    total: isFirstBatch ? count ?? rows.length : null,
  };
}

export interface UseSearchListingsParams {
  filters: SearchFilters;
  query?: string;
  sort?: string;
  limit?: number;
}

/** Infinite (cursor-based) search feed. */
export function useSearchListingsInfinite({
  filters,
  query,
  sort = 'newest',
  limit = DEFAULT_PAGE_SIZE,
}: UseSearchListingsParams) {
  const result = useInfiniteQuery<ListingsPage>({
    queryKey: ['search-listings', { filters, query, sort, limit }],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchSearchListingsPage({ filters, query, sort, cursor: pageParam as string | null, limit }),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const listings = result.data?.pages.flatMap((p) => p.items) ?? [];
  const total = result.data?.pages[0]?.total ?? null;

  return { ...result, listings, total };
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Listing, SearchFilters } from '@/types/listing';

// Reuse the row mapper from useListings via a lightweight re-import to keep
// this file focused on query-building. We replicate only the column whitelist
// and lean on a local mapper that matches the shape useListings produces.
const LISTING_COLUMNS = `
  id, user_id, title, brand, model, model_version, year, price, price_public,
  price_negotiable, vat_deductible, vat_rate, mileage, mileage_unit,
  fuel_type, additional_fuel_types, transmission, body_type, color,
  power, power_unit, engine_size, door_count, seat_count, doors, seats,
  drivetrain, first_registration_date, previous_owner_count,
  vin, licence_plate, vehicle_type, condition_type,
  source, images, features, equipment, highlights, description,
  city, province, status, views, is_premium, boost_until,
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
  boost_until: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: Row, profile: ProfileRow | null): Listing {
  const isDealer = profile?.is_dealer ?? false;
  const sellerName =
    (isDealer ? profile?.dealer_name : profile?.full_name) ||
    profile?.full_name ||
    profile?.dealer_name ||
    'Verkoper';
  const equipment = row.equipment ?? row.features ?? [];
  const price = row.price ?? row.price_public ?? 0;
  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    model: row.model,
    modelVersion: row.model_version ?? undefined,
    year: row.year,
    price,
    pricePublic: row.price_public ?? undefined,
    priceNegotiable: row.price_negotiable ?? undefined,
    vatDeductible: row.vat_deductible ?? undefined,
    vatRate: row.vat_rate ?? undefined,
    mileage: row.mileage,
    mileageUnit: row.mileage_unit ?? 'km',
    fuelType: row.fuel_type as Listing['fuelType'],
    additionalFuelTypes: row.additional_fuel_types ?? undefined,
    transmission: row.transmission as Listing['transmission'],
    bodyType: row.body_type as Listing['bodyType'],
    color: row.color ?? '',
    power: row.power ?? 0,
    powerUnit: row.power_unit ?? 'kW',
    engineSize: Number(row.engine_size ?? 0),
    doors: row.door_count ?? row.doors ?? 5,
    seats: row.seat_count ?? row.seats ?? 5,
    drivetrain: row.drivetrain ?? undefined,
    firstRegistrationDate: row.first_registration_date ?? undefined,
    previousOwnerCount: row.previous_owner_count ?? undefined,
    vin: row.vin ?? undefined,
    licencePlate: row.licence_plate ?? undefined,
    vehicleType: row.vehicle_type ?? undefined,
    conditionType: row.condition_type ?? undefined,
    source: row.source ?? 'manual',
    images: row.images?.length ? row.images : ['/placeholder.svg'],
    description: row.description ?? '',
    features: equipment,
    equipment,
    highlights: row.highlights ?? undefined,
    location: { city: row.city ?? '', province: row.province ?? '' },
    seller: {
      id: row.user_id,
      name: sellerName,
      type: isDealer ? 'dealer' : 'private',
      avatar: profile?.avatar_url ?? undefined,
      memberSince: profile?.created_at ?? row.created_at,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views,
    status: row.status as Listing['status'],
    isPremium: row.is_premium,
    boostUntil: row.boost_until ?? undefined,
  } as Listing;
}

export interface UseSearchListingsParams {
  filters: SearchFilters;
  query?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

export interface UseSearchListingsResult {
  listings: Listing[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useSearchListings(params: UseSearchListingsParams): UseSearchListingsResult {
  const { filters, query, sort = 'newest', page = 1, perPage = 24 } = params;
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable dependency key for filters/query/sort/page
  const depKey = JSON.stringify({ filters, query, sort, page, perPage });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      let q = supabase
        .from('listings')
        .select(LISTING_COLUMNS, { count: 'exact' })
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
      if (filters.minMileage != null) q = q.gte('mileage', filters.minMileage);
      if (filters.maxMileage != null) q = q.lte('mileage', filters.maxMileage);
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

      // Features array (must contain all)
      if (filters.features?.length) q = q.contains('equipment', filters.features);

      // Sorting — premium first, then chosen sort
      q = q.order('is_premium', { ascending: false }).order('boost_until', {
        ascending: false,
        nullsFirst: false,
      });
      switch (sort) {
        case 'price-asc':
          q = q.order('price', { ascending: true, nullsFirst: false });
          break;
        case 'price-desc':
          q = q.order('price', { ascending: false, nullsFirst: false });
          break;
        case 'mileage-asc':
          q = q.order('mileage', { ascending: true });
          break;
        case 'year-desc':
          q = q.order('year', { ascending: false });
          break;
        default:
          q = q.order('created_at', { ascending: false });
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;
      if (cancelled) return;

      if (error) {
        setError(error.message);
        setListings([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as Row[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let profilesById = new Map<string, ProfileRow>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, dealer_name, is_dealer, avatar_url, created_at')
          .in('id', userIds);
        profilesById = new Map(((profs ?? []) as ProfileRow[]).map((p) => [p.id, p]));
      }

      if (cancelled) return;
      setListings(rows.map((r) => mapRow(r, profilesById.get(r.user_id) ?? null)));
      setTotal(count ?? rows.length);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  return { listings, total, loading, error };
}

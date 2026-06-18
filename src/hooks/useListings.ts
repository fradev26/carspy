import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  Listing,
  FuelType,
  TransmissionType,
  BodyType,
  ListingStatus,
} from '@/types/listing';

interface ProfileRow {
  id: string;
  full_name: string | null;
  dealer_name: string | null;
  is_dealer: boolean | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

// Whitelist of safe-to-expose columns. NOTE: `raw_autoscout` is intentionally
// excluded — it stays server-/admin-only.
const LISTING_COLUMNS = `
  id, user_id, title, brand, model, model_version, year, price, price_public,
  price_negotiable, vat_deductible, vat_rate, mileage, mileage_unit,
  fuel_type, additional_fuel_types, transmission, body_type, color,
  power, power_unit, engine_size, doors, seats, door_count, seat_count,
  drivetrain, gear_count, cylinder_capacity, cylinder_capacity_unit, cylinder_count,
  alloy_wheel_size, alloy_wheel_size_unit, empty_weight, empty_weight_unit,
  co2_emissions, co2_emissions_unit, consumption_combined, consumption_city,
  consumption_country, combined_unit, emission_class, emission_sticker,
  efficiency_class, particle_filter,
  first_registration_date, previous_owner_count, country_version,
  warranty_months, warranty_unit, warranty_type, warranty_details,
  inspection_date, next_inspection_date,
  vin, licence_plate, cross_reference_id, offer_reference_id,
  vehicle_type, condition_type,
  source, as24_listing_id, as24_publication_status,
  images, features, equipment, highlights, included_services, publication_channels,
  description, city, province, status, views, is_premium, boost_until,
  service_history, leasing_offers, marketing, publication, availability,
  condition, specs,
  created_at, updated_at
`;

interface ListingRow {
  id: string;
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
  doors: number | null;
  seats: number | null;
  door_count: number | null;
  seat_count: number | null;
  drivetrain: string | null;
  gear_count: number | null;
  cylinder_capacity: number | null;
  cylinder_capacity_unit: string | null;
  cylinder_count: number | null;
  alloy_wheel_size: number | null;
  alloy_wheel_size_unit: string | null;
  empty_weight: number | null;
  empty_weight_unit: string | null;
  co2_emissions: number | null;
  co2_emissions_unit: string | null;
  consumption_combined: number | null;
  consumption_city: number | null;
  consumption_country: number | null;
  combined_unit: string | null;
  emission_class: string | null;
  emission_sticker: string | null;
  efficiency_class: string | null;
  particle_filter: boolean | null;
  first_registration_date: string | null;
  previous_owner_count: number | null;
  country_version: string | null;
  warranty_months: number | null;
  warranty_unit: string | null;
  warranty_type: string | null;
  warranty_details: string | null;
  inspection_date: string | null;
  next_inspection_date: string | null;
  vin: string | null;
  licence_plate: string | null;
  cross_reference_id: string | null;
  offer_reference_id: string | null;
  vehicle_type: string | null;
  condition_type: string | null;
  source: string | null;
  as24_listing_id: string | null;
  as24_publication_status: string | null;
  images: string[] | null;
  features: string[] | null;
  equipment: string[] | null;
  highlights: string[] | null;
  included_services: string[] | null;
  publication_channels: string[] | null;
  description: string | null;
  city: string | null;
  province: string | null;
  status: string;
  views: number;
  is_premium: boolean;
  boost_until: string | null;
  service_history: unknown;
  leasing_offers: unknown;
  marketing: unknown;
  publication: unknown;
  availability: unknown;
  condition: unknown;
  specs: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles?: ProfileRow | null;
}

export { LISTING_COLUMNS };
export function mapRow(row: ListingRow): Listing {
  const profile = row.profiles ?? null;
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
    fuelType: row.fuel_type as FuelType,
    additionalFuelTypes: row.additional_fuel_types ?? undefined,
    transmission: row.transmission as TransmissionType,
    bodyType: row.body_type as BodyType,
    color: row.color ?? '',
    power: row.power ?? 0,
    powerUnit: row.power_unit ?? 'kW',
    engineSize: Number(row.engine_size ?? 0),
    doors: row.door_count ?? row.doors ?? 5,
    seats: row.seat_count ?? row.seats ?? 5,
    doorCount: row.door_count ?? undefined,
    seatCount: row.seat_count ?? undefined,
    drivetrain: row.drivetrain ?? undefined,
    gearCount: row.gear_count ?? undefined,
    cylinderCapacity: row.cylinder_capacity ?? undefined,
    cylinderCapacityUnit: row.cylinder_capacity_unit ?? undefined,
    cylinderCount: row.cylinder_count ?? undefined,
    alloyWheelSize: row.alloy_wheel_size ?? undefined,
    alloyWheelSizeUnit: row.alloy_wheel_size_unit ?? undefined,
    emptyWeight: row.empty_weight ?? undefined,
    emptyWeightUnit: row.empty_weight_unit ?? undefined,
    co2Emissions: row.co2_emissions ?? undefined,
    co2EmissionsUnit: row.co2_emissions_unit ?? undefined,
    consumptionCombined: row.consumption_combined ?? undefined,
    consumptionCity: row.consumption_city ?? undefined,
    consumptionCountry: row.consumption_country ?? undefined,
    combinedUnit: row.combined_unit ?? undefined,
    emissionClass: row.emission_class ?? undefined,
    emissionSticker: row.emission_sticker ?? undefined,
    efficiencyClass: row.efficiency_class ?? undefined,
    particleFilter: row.particle_filter ?? undefined,
    firstRegistrationDate: row.first_registration_date ?? undefined,
    previousOwnerCount: row.previous_owner_count ?? undefined,
    countryVersion: row.country_version ?? undefined,
    warrantyMonths: row.warranty_months ?? undefined,
    warrantyUnit: row.warranty_unit ?? undefined,
    warrantyType: row.warranty_type ?? undefined,
    warrantyDetails: row.warranty_details ?? undefined,
    inspectionDate: row.inspection_date ?? undefined,
    nextInspectionDate: row.next_inspection_date ?? undefined,
    vin: row.vin ?? undefined,
    licencePlate: row.licence_plate ?? undefined,
    crossReferenceId: row.cross_reference_id ?? undefined,
    offerReferenceId: row.offer_reference_id ?? undefined,
    vehicleType: row.vehicle_type ?? undefined,
    conditionType: row.condition_type ?? undefined,
    source: row.source ?? 'manual',
    as24ListingId: row.as24_listing_id ?? undefined,
    as24PublicationStatus: row.as24_publication_status ?? undefined,
    images: row.images?.length ? row.images : ['/placeholder.svg'],
    description: row.description ?? '',
    features: equipment,
    equipment,
    highlights: row.highlights ?? undefined,
    includedServices: row.included_services ?? undefined,
    location: {
      city: row.city ?? '',
      province: row.province ?? '',
    },
    seller: {
      id: row.user_id,
      name: sellerName,
      type: isDealer ? 'dealer' : 'private',
      phone: profile?.phone ?? undefined,
      email: profile?.email ?? undefined,
      avatar: profile?.avatar_url ?? undefined,
      memberSince: profile?.created_at ?? row.created_at,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views,
    status: row.status as ListingStatus,
    isPremium: row.is_premium,
    boostUntil: row.boost_until ?? undefined,
    serviceHistory: row.service_history ?? undefined,
    leasingOffers: row.leasing_offers ?? undefined,
    marketing: row.marketing ?? undefined,
    publication: row.publication ?? undefined,
    availability: row.availability ?? undefined,
    condition: row.condition ?? undefined,
    specs: row.specs ?? undefined,
  };
}

export async function fetchWithProfileFallback<T extends ListingRow>(rows: T[]): Promise<Listing[]> {
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  if (userIds.length === 0) return rows.map(mapRow);
  // Only public-safe columns — phone/email are PII and require the get_my_profile RPC
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, full_name, dealer_name, is_dealer, avatar_url, created_at')
    .in('id', userIds);
  const byId = new Map<string, ProfileRow>(
    ((profs ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );
  return rows.map((r) => mapRow({ ...r, profiles: byId.get(r.user_id) ?? null }));
}

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const joined = `${LISTING_COLUMNS}, profiles:profiles!listings_user_id_fkey (id, full_name, dealer_name, is_dealer, avatar_url, created_at)`;
      const { data, error } = await supabase
        .from('listings')
        .select(joined)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(24);

      if (cancelled) return;

      if (error) {
        const { data: d2, error: e2 } = await supabase
          .from('listings')
          .select(LISTING_COLUMNS)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(24);
        if (e2) {
          setError(e2.message);
          setLoading(false);
          return;
        }
        const mapped = await fetchWithProfileFallback((d2 ?? []) as unknown as ListingRow[]);
        setListings(mapped);
        setLoading(false);
        return;
      }

      setListings(((data ?? []) as unknown as ListingRow[]).map(mapRow));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { listings, loading, error };
}

export function useListing(id: string | undefined) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setListing(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const joined = `${LISTING_COLUMNS}, profiles:profiles!listings_user_id_fkey (id, full_name, dealer_name, is_dealer, avatar_url, created_at)`;
      const { data, error } = await supabase
        .from('listings')
        .select(joined)
        .eq('id', id)
        .eq('status', 'active')
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        const { data: d2, error: e2 } = await supabase
          .from('listings')
          .select(LISTING_COLUMNS)
          .eq('id', id)
          .eq('status', 'active')
          .maybeSingle();
        if (e2 || !d2) {
          setError(e2?.message ?? null);
          setListing(null);
          setLoading(false);
          return;
        }
        const mapped = await fetchWithProfileFallback([d2 as unknown as ListingRow]);
        setListing(mapped[0] ?? null);
        setLoading(false);
        return;
      }

      setListing(data ? mapRow(data as unknown as ListingRow) : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { listing, loading, error };
}

export function useRelatedListings(listing: Listing | null, count: number = 3) {
  const [related, setRelated] = useState<Listing[]>([]);

  useEffect(() => {
    if (!listing) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('listings')
        .select(LISTING_COLUMNS)
        .eq('status', 'active')
        .eq('brand', listing.brand)
        .neq('id', listing.id)
        .order('created_at', { ascending: false })
        .limit(count);
      if (cancelled) return;
      const mapped = await fetchWithProfileFallback((data ?? []) as unknown as ListingRow[]);
      setRelated(mapped);
    })();
    return () => {
      cancelled = true;
    };
  }, [listing, count]);

  return related;
}

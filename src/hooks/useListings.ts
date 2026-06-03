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

interface ListingRow {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string;
  color: string | null;
  power: number | null;
  engine_size: number | null;
  doors: number | null;
  seats: number | null;
  images: string[] | null;
  features: string[] | null;
  description: string | null;
  city: string | null;
  province: string | null;
  status: string;
  views: number;
  is_premium: boolean;
  boost_until: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles?: ProfileRow | null;
}

function mapRow(row: ListingRow): Listing {
  const profile = row.profiles ?? null;
  const isDealer = profile?.is_dealer ?? false;
  const sellerName =
    (isDealer ? profile?.dealer_name : profile?.full_name) ||
    profile?.full_name ||
    profile?.dealer_name ||
    'Verkoper';

  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    model: row.model,
    year: row.year,
    price: row.price,
    mileage: row.mileage,
    fuelType: row.fuel_type as FuelType,
    transmission: row.transmission as TransmissionType,
    bodyType: row.body_type as BodyType,
    color: row.color ?? '',
    power: row.power ?? 0,
    engineSize: Number(row.engine_size ?? 0),
    doors: row.doors ?? 5,
    seats: row.seats ?? 5,
    images: row.images?.length ? row.images : ['/placeholder.svg'],
    description: row.description ?? '',
    features: row.features ?? [],
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
  };
}

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select(
          `*, profiles:profiles!listings_user_id_fkey (id, full_name, dealer_name, is_dealer, phone, email, avatar_url, created_at)`,
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (cancelled) return;

      if (error) {
        // Fallback: fetch without join (no FK declared)
        const { data: d2, error: e2 } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1000);
        if (e2) {
          setError(e2.message);
          setLoading(false);
          return;
        }
        const rows = (d2 ?? []) as ListingRow[];
        const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, dealer_name, is_dealer, phone, email, avatar_url, created_at')
          .in('id', userIds);
        const byId = new Map<string, ProfileRow>(
          ((profs ?? []) as ProfileRow[]).map((p) => [p.id, p]),
        );
        setListings(rows.map((r) => mapRow({ ...r, profiles: byId.get(r.user_id) ?? null })));
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

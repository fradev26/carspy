import { mockListings } from '@/data/mockListings';
import { Listing, Seller } from '@/types/listing';
import { supabase } from '@/integrations/supabase/client';
import { LISTING_COLUMNS, fetchWithProfileFallback } from '@/hooks/useListings';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export interface DealerSummary {
  slug: string;
  seller: Seller;
  city?: string;
  province?: string;
  listingCount: number;
}

function dealerListings(): Listing[] {
  return mockListings.filter((l) => l.seller.type === 'dealer' && l.status === 'active');
}

export function getAllDealers(): DealerSummary[] {
  const map = new Map<string, DealerSummary>();
  for (const l of dealerListings()) {
    const slug = slugify(l.seller.name);
    const existing = map.get(slug);
    if (existing) {
      existing.listingCount += 1;
    } else {
      map.set(slug, {
        slug,
        seller: l.seller,
        city: l.location.city,
        province: l.location.province,
        listingCount: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.listingCount - a.listingCount);
}

export function findDealerBySlug(slug: string): DealerSummary | undefined {
  return getAllDealers().find((d) => d.slug === slug);
}

export function getDealerListings(slug: string): Listing[] {
  return mockListings.filter(
    (l) => l.seller.type === 'dealer' && slugify(l.seller.name) === slug,
  );
}

export function dealerSlugFor(seller: Pick<Seller, 'name' | 'type'>): string | null {
  if (seller.type !== 'dealer') return null;
  return slugify(seller.name);
}

export async function findDealerBySlugAsync(slug: string): Promise<DealerSummary | undefined> {
  const mock = findDealerBySlug(slug);
  if (mock) return mock;

  const { data } = await supabase
    .from('public_profiles' as any)
    .select('id, dealer_name, full_name, avatar_url, created_at, is_dealer')
    .eq('is_dealer', true);

  const match = ((data ?? []) as unknown as Array<{ id: string; dealer_name: string | null; full_name: string | null; avatar_url: string | null; created_at: string; is_dealer: boolean }>).find(
    (p) => p.dealer_name && slugify(p.dealer_name) === slug,
  );
  if (!match) return undefined;

  // Count active listings for this dealer
  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', match.id)
    .eq('status', 'active');

  return {
    slug,
    seller: {
      id: match.id,
      name: match.dealer_name || match.full_name || 'Dealer',
      type: 'dealer',
      avatar: match.avatar_url ?? undefined,
      memberSince: match.created_at,
    },
    listingCount: count ?? 0,
  };
}

export async function getDealerListingsAsync(slug: string, sellerId?: string): Promise<Listing[]> {
  const mock = getDealerListings(slug);
  if (mock.length > 0) return mock;
  if (!sellerId) return [];

  const { data } = await supabase
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('user_id', sellerId)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) return [];
  return fetchWithProfileFallback(data as any);
}

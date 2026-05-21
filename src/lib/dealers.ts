import { mockListings } from '@/data/mockListings';
import { Listing, Seller } from '@/types/listing';

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

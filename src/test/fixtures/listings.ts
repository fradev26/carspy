import type { Listing, Seller } from '@/types/listing';

/** Deterministische verkopers voor demo-data (particulier + dealer). */
export const privateSeller: Seller = {
  id: 'seller-private',
  name: 'Jan Peeters',
  type: 'private',
  phone: '+32 470 00 00 01',
  email: 'jan@example.com',
  memberSince: '2024-01-15',
  responseTime: '< 1 uur',
};

export const dealerSeller: Seller = {
  id: 'seller-dealer',
  name: 'Snabba Cars',
  type: 'dealer',
  phone: '+32 3 000 00 02',
  email: 'info@snabbacars.be',
  rating: 4.6,
  reviewCount: 128,
  memberSince: '2022-03-01',
  responseTime: '< 30 min',
};

const baseListing: Listing = {
  id: 'listing-0',
  title: 'Volkswagen Golf 1.5 TSI Life',
  brand: 'Volkswagen',
  model: 'Golf',
  year: 2021,
  price: 22900,
  mileage: 48000,
  fuelType: 'benzine',
  transmission: 'handgeschakeld',
  bodyType: 'hatchback',
  color: 'grijs',
  power: 130,
  engineSize: 1.5,
  doors: 5,
  seats: 5,
  images: ['https://cdn.example.com/demo/golf-1.jpg'],
  description: 'Demo-advertentie voor tests.',
  features: ['Airco', 'Navigatie', 'Parkeersensoren'],
  location: { city: 'Antwerpen', province: 'Antwerpen' },
  seller: privateSeller,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
  views: 120,
  status: 'active',
};

/** Bouwt een listing met vaste defaults; geef enkel af wat de test nodig heeft. */
export function makeListing(overrides: Partial<Listing> = {}): Listing {
  return { ...baseListing, ...overrides };
}

/** Bouwt n consistente listings met voorspelbare ids, prijzen en datums. */
export function makeListings(count: number, overrides: Partial<Listing> = {}): Listing[] {
  return Array.from({ length: count }, (_, i) =>
    makeListing({
      id: `listing-${i + 1}`,
      title: `${baseListing.brand} ${baseListing.model} demo ${i + 1}`,
      price: baseListing.price + i * 1000,
      mileage: baseListing.mileage + i * 5000,
      views: baseListing.views + i * 10,
      createdAt: `2026-01-${String(10 + i).padStart(2, '0')}T10:00:00.000Z`,
      updatedAt: `2026-01-${String(10 + i).padStart(2, '0')}T10:00:00.000Z`,
      ...overrides,
    })
  );
}

/** Vaste demo-voorraad van een particuliere verkoper. */
export const demoPrivateListings: Listing[] = makeListings(3, { seller: privateSeller });

/** Vaste demo-voorraad van een dealer (incl. één premium en één verkochte wagen). */
export const demoDealerListings: Listing[] = [
  ...makeListings(4, { seller: dealerSeller }).map((l, i) =>
    i === 0 ? { ...l, isPremium: true } : l
  ),
  makeListing({
    id: 'listing-sold',
    seller: dealerSeller,
    status: 'sold',
    title: 'Volkswagen Golf demo verkocht',
  }),
];

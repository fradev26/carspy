import { describe, it, expect } from 'vitest';
import { mapRow } from './useListings';

// Minimal listing row fixture
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'l1',
    user_id: 'u1',
    title: 'Test',
    brand: 'BMW',
    model: 'X5',
    year: 2020,
    price: 30000,
    mileage: 10000,
    fuel_type: 'diesel',
    transmission: 'automatic',
    body_type: 'suv',
    images: [],
    status: 'active',
    views: 0,
    is_premium: false,
    boost_until: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  } as any;
}

const dealerProfile = {
  id: 'u1',
  full_name: 'Jan Janssen',
  dealer_name: 'Janssen Auto BV',
  is_dealer: true,
  avatar_url: null,
  created_at: '2023-01-01',
};

const privateProfile = {
  id: 'u2',
  full_name: 'Piet Peeters',
  dealer_name: null,
  is_dealer: false,
  avatar_url: null,
  created_at: '2023-01-01',
};

describe('mapRow — eigenaar bepaalt seller.type (regressie)', () => {
  it('dealer-eigenaar → seller.type=dealer, naam = dealer_name', () => {
    const listing = mapRow(row({ profiles: dealerProfile }));
    expect(listing.seller.type).toBe('dealer');
    expect(listing.seller.name).toBe('Janssen Auto BV');
  });

  it('particuliere eigenaar → seller.type=private, naam = full_name', () => {
    const listing = mapRow(row({ user_id: 'u2', profiles: privateProfile }));
    expect(listing.seller.type).toBe('private');
    expect(listing.seller.name).toBe('Piet Peeters');
  });

  it('zelfde dealer-listing geeft identiek resultaat ongeacht hoe vaak gemapt (bezoekersrol-onafhankelijk)', () => {
    const r = row({ profiles: dealerProfile });
    const a = mapRow(r);
    const b = mapRow(r);
    expect(a.seller).toEqual(b.seller);
    expect(a.seller.type).toBe('dealer');
  });

  it('zonder profielgegevens valt mapping terug op private (defensieve default)', () => {
    // Dit pad mag in productie niet meer voorkomen sinds we public_profiles
    // gebruiken — maar mapper moet niet crashen.
    const listing = mapRow(row({ profiles: null }));
    expect(listing.seller.type).toBe('private');
  });
});

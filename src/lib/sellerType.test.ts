import { describe, it, expect } from 'vitest';
import { getListingSellerType, isDealerListing, getSellerLabel } from './sellerType';
import type { Listing } from '@/types/listing';

function makeListing(type: 'dealer' | 'private'): Listing {
  return {
    id: 'l1',
    seller: { id: 'u1', name: 'X', type, memberSince: '2024-01-01' },
  } as unknown as Listing;
}

describe('sellerType helpers — eigenaar is bron van waarheid', () => {
  it('dealeradvertentie blijft dealer', () => {
    const l = makeListing('dealer');
    expect(getListingSellerType(l)).toBe('dealer');
    expect(isDealerListing(l)).toBe(true);
    expect(getSellerLabel(l)).toBe('Dealer');
  });

  it('particuliere advertentie blijft particulier', () => {
    const l = makeListing('private');
    expect(getListingSellerType(l)).toBe('private');
    expect(isDealerListing(l)).toBe(false);
    expect(getSellerLabel(l)).toBe('Particulier');
  });

  it('valt veilig terug op private bij ontbrekende seller', () => {
    expect(getListingSellerType(null)).toBe('private');
    expect(getSellerLabel({ seller: undefined })).toBe('Particulier');
    expect(getSellerLabel({ seller: { type: undefined } })).toBe('Particulier');
  });

  it('label hangt niet af van wie er kijkt — zelfde listing, zelfde label', () => {
    const dealerL = makeListing('dealer');
    // Simuleer "andere bezoekersrol" door dezelfde listing meermaals door de
    // helper te halen; helper kent geen bezoekerscontext, dus output moet
    // identiek zijn ongeacht hypothetische rol van caller.
    const asViewedByPrivate = getSellerLabel(dealerL);
    const asViewedByDealer = getSellerLabel(dealerL);
    const asViewedByAnon = getSellerLabel(dealerL);
    expect(asViewedByPrivate).toBe('Dealer');
    expect(asViewedByDealer).toBe('Dealer');
    expect(asViewedByAnon).toBe('Dealer');
  });
});

/**
 * Centrale helpers om het type verkoper van een advertentie te bepalen.
 *
 * Belangrijk: de eigenaar van de advertentie is altijd de bron van waarheid.
 * Gebruik NOOIT de rol van de ingelogde bezoeker (`useProfile().isDealer`)
 * om te beslissen hoe een advertentie wordt weergegeven.
 */
import type { Listing, Seller } from '@/types/listing';

export type SellerType = 'dealer' | 'private';

type ListingLike = Pick<Listing, 'seller'> | { seller?: Partial<Seller> | null };

export function getListingSellerType(listing: ListingLike | null | undefined): SellerType {
  return listing?.seller?.type === 'dealer' ? 'dealer' : 'private';
}

export function isDealerListing(listing: ListingLike | null | undefined): boolean {
  return getListingSellerType(listing) === 'dealer';
}

export function getSellerLabel(listing: ListingLike | null | undefined): string {
  return isDealerListing(listing) ? 'Dealer' : 'Particulier';
}

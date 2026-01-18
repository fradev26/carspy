import { Listing } from '@/types/listing';
import { ListingCard } from './ListingCard';
import { cn } from '@/lib/utils';

interface ListingGridProps {
  listings: Listing[];
  variant?: 'grid' | 'list';
  columns?: 2 | 3 | 4;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  favorites?: string[];
  className?: string;
}

export function ListingGrid({ 
  listings, 
  variant = 'grid', 
  columns = 3, 
  onFavoriteToggle, 
  favorites = [],
  className 
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🚗</div>
        <h3 className="text-lg font-semibold">Geen resultaten gevonden</h3>
        <p className="mt-2 text-muted-foreground">
          Probeer je zoekcriteria aan te passen om meer auto's te vinden.
        </p>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            variant="horizontal"
            onFavoriteToggle={onFavoriteToggle}
            isFavorite={favorites.includes(listing.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          onFavoriteToggle={onFavoriteToggle}
          isFavorite={favorites.includes(listing.id)}
        />
      ))}
    </div>
  );
}

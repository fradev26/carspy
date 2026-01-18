import { useState } from 'react';
import { Heart } from 'lucide-react';
import { ListingGrid } from '@/modules/listings';
import { mockListings } from '@/data/mockListings';

export default function Favorites() {
  const [favorites] = useState(() => mockListings.slice(0, 4).map(l => l.id));
  const favoriteListings = mockListings.filter(l => favorites.includes(l.id));

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold">Mijn favorieten</h1>
      <p className="mt-1 text-muted-foreground">{favoriteListings.length} opgeslagen auto's</p>

      {favoriteListings.length === 0 ? (
        <div className="mt-12 text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">Nog geen favorieten</h2>
          <p className="mt-2 text-muted-foreground">Klik op het hartje bij een auto om deze op te slaan</p>
        </div>
      ) : (
        <div className="mt-8">
          <ListingGrid listings={favoriteListings} columns={3} favorites={favorites} />
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { ListingGrid } from '@/modules/listings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { Listing } from '@/types/listing';
import { SEOHead } from '@/components/SEOHead';

export default function Favorites() {
  const { user } = useAuth();
  const { favorites, toggle } = useFavorites();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }
    const ids = Array.from(favorites);
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('listings')
      .select('*')
      .in('id', ids)
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          const transformed = data.map((l) => ({
            id: l.id,
            title: l.title,
            brand: l.brand,
            model: l.model,
            year: l.year,
            price: l.price,
            mileage: l.mileage,
            fuelType: l.fuel_type as Listing['fuelType'],
            transmission: l.transmission as Listing['transmission'],
            bodyType: l.body_type as Listing['bodyType'],
            color: l.color || '',
            power: l.power || 0,
            engineSize: l.engine_size || 0,
            doors: l.doors || 5,
            seats: l.seats || 5,
            images: l.images || [],
            description: l.description || '',
            features: l.features || [],
            location: { city: l.city || '', province: l.province || '' },
            seller: { id: l.user_id, name: 'Verkoper', type: 'private' as const, memberSince: '' },
            createdAt: l.created_at,
            updatedAt: l.updated_at,
            views: l.views,
            status: l.status as Listing['status'],
          }));
          setListings(transformed);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, favorites]);

  const handleFavoriteToggle = async (listingId: string) => {
    await toggle(listingId);
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <SEOHead title="Mijn favorieten - VATUUR." description="Bekijk je opgeslagen favoriete auto's." noindex />
      <h1 className="text-2xl font-bold">Mijn favorieten</h1>
      <p className="mt-1 text-muted-foreground">{listings.length} opgeslagen auto's</p>

      {listings.length === 0 ? (
        <div className="mt-12 text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">Nog geen favorieten</h2>
          <p className="mt-2 text-muted-foreground">Klik op het hartje bij een auto om deze op te slaan</p>
        </div>
      ) : (
        <div className="mt-8">
          <ListingGrid
            listings={listings}
            columns={3}
            favorites={Array.from(favorites)}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </div>
      )}
    </div>
  );
}

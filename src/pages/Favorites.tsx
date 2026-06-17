import { useState, useEffect } from 'react';
import { Heart, LogIn, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ListingGrid } from '@/modules/listings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { Listing } from '@/types/listing';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';

export default function Favorites() {
  const { user } = useAuth();
  const { favorites, toggle } = useFavorites();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

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


  // Logged-out gate
  if (!user) {
    return (
      <div className="container py-12">
        <SEOHead title="Mijn favorieten - VATUUR." description="Log in om je favoriete auto's te bekijken." noindex />
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 text-xl font-bold">Bewaar je favoriete wagens</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Meld je aan om wagens op te slaan en ze terug te vinden op al je toestellen.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild className="w-full gap-2">
              <Link to="/auth" state={{ from: location }}>
                <LogIn className="h-4 w-4" />
                Inloggen of registreren
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full gap-2">
              <Link to="/zoeken">
                <Search className="h-4 w-4" />
                Eerst wagens bekijken
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
      <p className="mt-1 text-muted-foreground">{listings.length} opgeslagen {listings.length === 1 ? 'wagen' : "wagens"}</p>

      {listings.length === 0 ? (
        <div className="mt-12 text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">Nog geen favorieten</h2>
          <p className="mt-2 text-muted-foreground">Klik op het hartje bij een wagen om deze op te slaan.</p>
          <Button asChild className="mt-6 gap-2">
            <Link to="/zoeken">
              <Search className="h-4 w-4" />
              Wagens zoeken
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <ListingGrid listings={listings} columns={3} />
        </div>
      )}
    </div>
  );
}

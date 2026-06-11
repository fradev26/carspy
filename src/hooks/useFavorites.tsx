import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface FavoritesContextValue {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setFavorites(new Set(data.map((r) => r.listing_id)));
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const toggle = useCallback(
    async (id: string) => {
      if (!user) {
        toast({
          title: 'Log in om favorieten op te slaan',
          description: 'Maak een gratis account aan of meld je aan.',
        });
        navigate('/auth');
        return;
      }
      const wasFav = favorites.has(id);
      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(id);
        else next.add(id);
        return next;
      });

      if (wasFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);
        if (error) {
          // rollback
          setFavorites((prev) => new Set(prev).add(id));
          toast({ title: 'Kon favoriet niet verwijderen', variant: 'destructive' });
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: id });
        if (error) {
          setFavorites((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast({ title: 'Kon favoriet niet opslaan', variant: 'destructive' });
        }
      }
    },
    [user, favorites, navigate]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggle, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ListingAnalytics {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  price: number;
  status: string;
  views: number;
  image: string | null;
  createdAt: string;
  favorites: number;
  conversations: number;
  messages: number;
  isPremium: boolean;
  boostUntil: string | null;
  features: string[];
  transmission: string;
  power: number | null;
}

export interface DealerOverview {
  totalViews: number;
  totalFavorites: number;
  totalMessages: number;
  totalListings: number;
  activeListings: number;
}

export function useDealerAnalytics() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DealerOverview | null>(null);
  const [listings, setListings] = useState<ListingAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('dealer-analytics');
      if (fnError) throw fnError;
      setOverview(data.overview);
      setListings(data.listings);
    } catch {
      setError('Kon analytics niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  return { overview, listings, loading, error, refresh };
}

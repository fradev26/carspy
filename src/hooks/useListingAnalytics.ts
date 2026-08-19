import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsPoint {
  date: string;
  views: number;
  favorites: number;
  conversations: number;
  messages: number;
  leads: number;
}

export interface ListingDrilldown {
  listing: {
    id: string;
    title: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    mileage: number | null;
    fuelType: string | null;
    price: number;
    status: string;
    image: string | null;
    createdAt: string;
    isPremium: boolean;
    boostUntil: string | null;
    daysLive: number;
  };
  totals: { views: number; favorites: number; conversations: number; messages: number };
  period: { days: number; views: number; favorites: number; conversations: number; messages: number };
  series: AnalyticsPoint[];
  benchmark: { peerCount: number; ownViewsPerDay: number; peerAvgViewsPerDay: number | null };
}

export type AnalyticsPeriod = 7 | 30 | 90;

export function useListingAnalytics(listingId: string | undefined, days: AnalyticsPeriod) {
  const [data, setData] = useState<ListingDrilldown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke('dealer-analytics', {
        body: { listingId, days },
      });
      if (fnError) throw fnError;
      if ((res as { error?: string })?.error) throw new Error((res as { error: string }).error);
      setData(res as ListingDrilldown);
    } catch {
      setError('Kon statistieken voor dit voertuig niet laden');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [listingId, days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

/** Percentageverschil t.o.v. vergelijkbare wagens; null wanneer er geen referentie is. */
export function benchmarkDelta(own: number, peer: number | null): number | null {
  if (peer === null || peer <= 0) return null;
  return Math.round(((own - peer) / peer) * 100);
}

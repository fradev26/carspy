import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchFilters } from '@/types/listing';
import { toast } from '@/hooks/use-toast';

interface SmartSearchResult {
  filters: SearchFilters & { minSeats?: number };
  intent: string;
  confidence: number;
}

export function useSmartSearch() {
  const [loading, setLoading] = useState(false);

  const search = async (query: string): Promise<SmartSearchResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-search', {
        body: { query },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Slim zoeken werkt even niet', description: data.error, variant: 'destructive' });
        return null;
      }
      return data as SmartSearchResult;
    } catch (e: any) {
      const msg = e?.message || 'Onbekende fout';
      const friendly = msg.includes('429')
        ? 'Te veel verzoeken — probeer zo opnieuw.'
        : msg.includes('402')
          ? 'AI-tegoed opgebruikt. Voeg credits toe in Workspace > Usage.'
          : 'Slim zoeken werkt even niet — probeer klassiek zoeken.';
      toast({ title: 'Oeps', description: friendly, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { search, loading };
}

export function filtersToParams(filters: SearchFilters & { minSeats?: number }): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.model) params.set('model', filters.model);
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minYear) params.set('minYear', String(filters.minYear));
  if (filters.maxYear) params.set('maxYear', String(filters.maxYear));
  if (filters.minMileage) params.set('minMileage', String(filters.minMileage));
  if (filters.maxMileage) params.set('maxMileage', String(filters.maxMileage));
  if (filters.fuelTypes?.length) params.set('fuelTypes', filters.fuelTypes.join(','));
  if (filters.transmissions?.length) params.set('transmissions', filters.transmissions.join(','));
  if (filters.bodyTypes?.length) params.set('bodyTypes', filters.bodyTypes.join(','));
  if (filters.colors?.length) params.set('colors', filters.colors.join(','));
  if (filters.features?.length) params.set('features', filters.features.join(','));
  if (filters.minPower) params.set('minPower', String(filters.minPower));
  if (filters.maxPower) params.set('maxPower', String(filters.maxPower));
  if (filters.minSeats) params.set('minSeats', String(filters.minSeats));
  return params;
}

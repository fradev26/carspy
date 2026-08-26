import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { supabase } from '@/integrations/supabase/client';
import type { SearchFilters } from '@/types/listing';
import { toKw } from '@/lib/searchQuery';

export type FacetCounts = Record<string, number>;

export interface SearchFacets {
  total: number;
  brands: FacetCounts;
  fuelTypes: FacetCounts;
  bodyTypes: FacetCounts;
  transmissions: FacetCounts;
  driveTypes: FacetCounts;
  colors: FacetCounts;
  conditionTypes: FacetCounts;
  emissionClasses: FacetCounts;
  features: FacetCounts;
}

export const EMPTY_FACETS: SearchFacets = {
  total: 0,
  brands: {},
  fuelTypes: {},
  bodyTypes: {},
  transmissions: {},
  driveTypes: {},
  colors: {},
  conditionTypes: {},
  emissionClasses: {},
  features: {},
};

/** Vertaalt de UI-filters naar de payload die de `search_facets`-functie verwacht. */
export function buildFacetPayload(filters: SearchFilters, query?: string): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  const setArr = (k: string, v?: string[]) => {
    if (v && v.length) p[k] = v;
  };
  const setNum = (k: string, v?: number | null) => {
    if (v != null && Number.isFinite(v)) p[k] = v;
  };

  if (query?.trim()) p.q = query.trim();
  const brands = filters.brands ?? (filters.brand ? [filters.brand] : undefined);
  setArr('brands', brands);
  setArr('models', filters.models);
  if (filters.trim) p.trim = filters.trim;
  setArr('conditionTypes', filters.conditionTypes);
  setNum('minPrice', filters.minPrice);
  setNum('maxPrice', filters.maxPrice);
  setNum('minYear', filters.minYear);
  setNum('maxYear', filters.maxYear);
  if (filters.minMileage) setNum('minMileage', filters.minMileage);
  if (filters.maxMileage) setNum('maxMileage', filters.maxMileage);
  if (filters.minPower != null) p.minPower = toKw(filters.minPower, filters.powerUnit);
  if (filters.maxPower != null) p.maxPower = toKw(filters.maxPower, filters.powerUnit);
  setArr('fuelTypes', filters.fuelTypes);
  setArr('bodyTypes', filters.bodyTypes);
  setArr('transmissions', filters.transmissions);
  setArr('driveTypes', filters.driveTypes);
  setArr('colors', filters.colors);
  setArr('emissionClasses', filters.emissionClasses);
  setNum('maxCo2', filters.maxCo2);
  setNum('minDoors', filters.minDoors);
  setNum('minSeats', filters.minSeats);
  if (filters.province) p.province = filters.province;
  setNum('maxPreviousOwners', filters.maxPreviousOwners);
  if (filters.vatDeductible) p.vatDeductible = true;
  if (filters.factoryWarranty) p.factoryWarranty = true;
  if (filters.carPass) p.carPass = true;
  if (filters.noDamageHistory) p.noDamageHistory = true;
  if (filters.onlineSince) p.onlineSince = filters.onlineSince;
  setArr('features', filters.features);

  return p;
}

/**
 * Live aantallen per filteroptie, rekening houdend met de overige actieve
 * filters. De berekening wordt gedebounced zodat snel klikken niet hapert.
 */
export function useSearchFacets(filters: SearchFilters, query?: string) {
  const { value: payload } = useDebouncedValue(buildFacetPayload(filters, query), 250);

  const { data, isFetching } = useQuery<SearchFacets>({
    queryKey: ['search-facets', payload],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .rpc('search_facets' as never, { _filters: payload } as never)
        .abortSignal(signal);
      if (error) throw new Error(error.message);
      return { ...EMPTY_FACETS, ...(data as unknown as SearchFacets) };
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  return { facets: data ?? null, isFetching };
}

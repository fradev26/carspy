import { useState, useEffect, useCallback } from 'react';
import { SearchFilters } from '@/types/listing';

export interface RecentSearch {
  id: string;
  filters: SearchFilters;
  label: string;
  timestamp: number;
  resultCount?: number;
}

const STORAGE_KEY = 'autospy_recent_searches';
const MAX_RECENT_SEARCHES = 5;

// Generate a human-readable label from filters
function generateLabel(filters: SearchFilters): string {
  const parts: string[] = [];

  const brands = filters.brands ?? (filters.brand ? [filters.brand] : []);
  if (brands.length) {
    parts.push(brands.slice(0, 2).join(' / '));
    const models = (filters.models ?? []).map((m) => m.slice(m.indexOf(':') + 1));
    if (models.length) parts.push(models.slice(0, 2).join(' / '));
    else if (filters.model) parts.push(filters.model);
  }

  if (filters.bodyTypes?.length) {
    const bodyLabels: Record<string, string> = {
      sedan: 'Sedan',
      hatchback: 'Hatchback',
      stationwagon: 'Stationwagon',
      suv: 'SUV',
      cabrio: 'Cabrio',
      coupe: 'Coupé',
      mpv: 'MPV',
      bestelwagen: 'Bestelwagen',
    };
    if (filters.bodyTypes.length === 1) {
      parts.push(bodyLabels[filters.bodyTypes[0]] || filters.bodyTypes[0]);
    } else {
      parts.push(`${filters.bodyTypes.length} carrosserieën`);
    }
  }

  if (filters.fuelTypes?.length) {
    const fuelLabels: Record<string, string> = {
      benzine: 'Benzine',
      diesel: 'Diesel',
      elektrisch: 'Elektrisch',
      hybride: 'Hybride',
      'plug-in hybride': 'Plug-in Hybride',
      lpg: 'LPG',
    };
    if (filters.fuelTypes.length === 1) {
      parts.push(fuelLabels[filters.fuelTypes[0]] || filters.fuelTypes[0]);
    }
  }

  if (filters.maxPrice) {
    parts.push(`tot €${filters.maxPrice.toLocaleString()}`);
  }

  if (filters.minYear) {
    parts.push(`vanaf ${filters.minYear}`);
  }

  if (filters.maxMileage) {
    parts.push(`max ${(filters.maxMileage / 1000).toFixed(0)}k km`);
  }

  if (filters.province) {
    parts.push(filters.province);
  }

  if (filters.sellerType) {
    parts.push(filters.sellerType === 'dealer' ? 'Dealer' : 'Particulier');
  }

  // If no specific filters, show generic label
  if (parts.length === 0) {
    return 'Alle auto\'s';
  }

  return parts.slice(0, 4).join(' • ');
}

// Generate unique ID for a search based on filters
function generateSearchId(filters: SearchFilters): string {
  return JSON.stringify(filters);
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        // Filter out old searches (older than 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const validSearches = parsed.filter(s => s.timestamp > thirtyDaysAgo);
        setRecentSearches(validSearches);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Save a new search
  const saveSearch = useCallback((filters: SearchFilters, resultCount?: number) => {
    // Don't save empty searches
    const hasFilters = Object.keys(filters).some(key => {
      const value = filters[key as keyof SearchFilters];
      return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
    });

    if (!hasFilters) return;

    const searchId = generateSearchId(filters);
    const newSearch: RecentSearch = {
      id: searchId,
      filters,
      label: generateLabel(filters),
      timestamp: Date.now(),
      resultCount,
    };

    setRecentSearches(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(s => s.id !== searchId);
      // Add new search at the beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }
      
      return updated;
    });
  }, []);

  // Remove a search
  const removeSearch = useCallback((searchId: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.id !== searchId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update recent searches:', error);
      }
      return updated;
    });
  }, []);

  // Clear all searches
  const clearAllSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    recentSearches,
    saveSearch,
    removeSearch,
    clearAllSearches,
  };
}

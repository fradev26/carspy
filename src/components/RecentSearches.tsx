import { useNavigate } from 'react-router-dom';
import { Clock, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecentSearch } from '@/hooks/useRecentSearches';
import { SearchFilters } from '@/types/listing';
import { cn } from '@/lib/utils';

interface RecentSearchesProps {
  searches: RecentSearch[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

// Convert filters to URL params
function filtersToURLParams(filters: SearchFilters): string {
  const params = new URLSearchParams();
  
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.model) params.set('model', filters.model);
  if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
  if (filters.minYear) params.set('minYear', filters.minYear.toString());
  if (filters.maxYear) params.set('maxYear', filters.maxYear.toString());
  if (filters.minMileage) params.set('minMileage', filters.minMileage.toString());
  if (filters.maxMileage) params.set('maxMileage', filters.maxMileage.toString());
  if (filters.fuelTypes?.length) params.set('fuelTypes', filters.fuelTypes.join(','));
  if (filters.bodyTypes?.length) params.set('bodyTypes', filters.bodyTypes.join(','));
  if (filters.transmissions?.length) params.set('transmissions', filters.transmissions.join(','));
  if (filters.driveTypes?.length) params.set('driveTypes', filters.driveTypes.join(','));
  if (filters.minPower) params.set('minPower', filters.minPower.toString());
  if (filters.maxPower) params.set('maxPower', filters.maxPower.toString());
  if (filters.province) params.set('province', filters.province);
  if (filters.sellerType) params.set('sellerType', filters.sellerType);
  if (filters.noDamageHistory) params.set('noDamageHistory', 'true');
  if (filters.vatDeductible) params.set('vatDeductible', 'true');
  if (filters.features?.length) params.set('features', filters.features.join(','));
  
  return params.toString();
}

// Format relative time
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Zojuist';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min geleden`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} uur geleden`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} dagen geleden`;
  return `${Math.floor(seconds / 604800)} weken geleden`;
}

export function RecentSearches({ searches, onRemove, onClearAll, className }: RecentSearchesProps) {
  const navigate = useNavigate();

  if (searches.length === 0) {
    return null;
  }

  const handleSearchClick = (search: RecentSearch) => {
    const params = filtersToURLParams(search.filters);
    navigate(`/zoeken?${params}`);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Recente zoekopdrachten</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Wis alles
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {searches.map((search) => (
          <div
            key={search.id}
            className="group relative flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-sm transition-all duration-200 hover:border-primary/50 hover:bg-card hover:shadow-sm cursor-pointer"
            onClick={() => handleSearchClick(search)}
          >
            <span className="text-foreground/90">{search.label}</span>
            {search.resultCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                ({search.resultCount})
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(search.id);
              }}
              className="ml-1 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-all"
              aria-label="Verwijder zoekopdracht"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Users, Building2, Zap, Gauge, Briefcase, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchFilters, BodyType, FuelType } from '@/types/listing';
import { cn } from '@/lib/utils';

interface FilterPreset {
  id: string;
  label: string;
  icon: React.ElementType;
  filters: Partial<SearchFilters>;
  description: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'family',
    label: 'Gezinswagen',
    icon: Users,
    description: 'Ruim, veilig & praktisch',
    filters: {
      bodyTypes: ['stationwagon', 'suv', 'mpv'] as BodyType[],
      minDoors: 5,
      minSeats: 5,
    },
  },
  {
    id: 'city',
    label: 'Stadsauto',
    icon: Building2,
    description: 'Compact & zuinig',
    filters: {
      bodyTypes: ['hatchback'] as BodyType[],
      maxPrice: 20000,
    },
  },
  {
    id: 'electric',
    label: 'Elektrisch',
    icon: Zap,
    description: 'Emissievrij rijden',
    filters: {
      fuelTypes: ['elektrisch', 'plug-in hybride'] as FuelType[],
    },
  },
  {
    id: 'sporty',
    label: 'Sportief',
    icon: Gauge,
    description: 'Krachtig & dynamisch',
    filters: {
      bodyTypes: ['coupe', 'cabrio', 'sedan'] as BodyType[],
      minPower: 200,
    },
  },
  {
    id: 'business',
    label: 'Zakelijk',
    icon: Briefcase,
    description: 'Comfort & representatief',
    filters: {
      bodyTypes: ['sedan', 'stationwagon'] as BodyType[],
      sellerType: 'dealer',
      vatDeductible: true,
    },
  },
  {
    id: 'first-car',
    label: 'Eerste auto',
    icon: Heart,
    description: 'Betrouwbaar & betaalbaar',
    filters: {
      maxPrice: 15000,
      maxMileage: 100000,
      minYear: 2018,
    },
  },
];

interface FilterPresetsProps {
  onApplyPreset: (filters: Partial<SearchFilters>) => void;
  activeFilters: SearchFilters;
  className?: string;
}

export function FilterPresets({ onApplyPreset, activeFilters, className }: FilterPresetsProps) {
  const isPresetActive = (preset: FilterPreset): boolean => {
    // Check if all preset filters match current filters
    const presetFilters = preset.filters;
    
    if (presetFilters.bodyTypes && 
        JSON.stringify(activeFilters.bodyTypes?.sort()) !== JSON.stringify(presetFilters.bodyTypes.sort())) {
      return false;
    }
    if (presetFilters.fuelTypes && 
        JSON.stringify(activeFilters.fuelTypes?.sort()) !== JSON.stringify(presetFilters.fuelTypes.sort())) {
      return false;
    }
    if (presetFilters.maxPrice && activeFilters.maxPrice !== presetFilters.maxPrice) return false;
    if (presetFilters.minPower && activeFilters.minPower !== presetFilters.minPower) return false;
    if (presetFilters.minSeats && activeFilters.minSeats !== presetFilters.minSeats) return false;
    if (presetFilters.minDoors && activeFilters.minDoors !== presetFilters.minDoors) return false;
    
    return true;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">Snelle selectie</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTER_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = isPresetActive(preset);
          
          return (
            <Button
              key={preset.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'gap-1.5 h-9 px-3 transition-all',
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'border-border/60 hover:bg-accent hover:border-accent'
              )}
              onClick={() => onApplyPreset(preset.filters)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{preset.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

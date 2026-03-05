import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  SearchFilters, 
  FUEL_TYPES, 
  TRANSMISSION_TYPES, 
  BODY_TYPES,
  DRIVE_TYPES,
  PAINT_TYPES,
  INTERIOR_MATERIALS,
  ONLINE_SINCE_OPTIONS,
  WARRANTY_OPTIONS,
  FEATURE_OPTIONS,
  COUNTRY_OPTIONS,
} from '@/types/listing';
import { cn } from '@/lib/utils';

interface FilterChipsProps {
  filters: SearchFilters;
  onRemoveFilter: (key: keyof SearchFilters, value?: string) => void;
  onClearAll: () => void;
  className?: string;
}

interface FilterChip {
  key: keyof SearchFilters;
  label: string;
  value?: string;
  category: 'basic' | 'performance' | 'appearance' | 'practical' | 'location' | 'history' | 'options';
}

export function FilterChips({ filters, onRemoveFilter, onClearAll, className }: FilterChipsProps) {
  const chips: FilterChip[] = [];

  // Basic filters
  if (filters.brand) {
    chips.push({ key: 'brand', label: filters.brand, category: 'basic' });
  }

  if (filters.model) {
    chips.push({ key: 'model', label: filters.model, category: 'basic' });
  }

  if (filters.minPrice || filters.maxPrice) {
    const minLabel = filters.minPrice ? `€${filters.minPrice.toLocaleString()}` : '€0';
    const maxLabel = filters.maxPrice ? `€${filters.maxPrice.toLocaleString()}` : '∞';
    chips.push({ key: 'minPrice', label: `${minLabel} - ${maxLabel}`, category: 'basic' });
  }

  if (filters.minYear || filters.maxYear) {
    const minLabel = filters.minYear || '1990';
    const maxLabel = filters.maxYear || 'nu';
    chips.push({ key: 'minYear', label: `${minLabel} - ${maxLabel}`, category: 'basic' });
  }

  if (filters.minMileage || filters.maxMileage) {
    const minLabel = filters.minMileage ? `${(filters.minMileage / 1000)}k` : '0';
    const maxLabel = filters.maxMileage ? `${(filters.maxMileage / 1000)}k km` : '∞';
    chips.push({ key: 'minMileage', label: `${minLabel} - ${maxLabel}`, category: 'basic' });
  }

  filters.fuelTypes?.forEach((fuel) => {
    const fuelLabel = FUEL_TYPES.find(f => f.value === fuel)?.label || fuel;
    chips.push({ key: 'fuelTypes', label: fuelLabel, value: fuel, category: 'basic' });
  });

  filters.bodyTypes?.forEach((body) => {
    const bodyLabel = BODY_TYPES.find(b => b.value === body)?.label || body;
    chips.push({ key: 'bodyTypes', label: bodyLabel, value: body, category: 'basic' });
  });

  // Performance filters
  filters.transmissions?.forEach((trans) => {
    const transLabel = TRANSMISSION_TYPES.find(t => t.value === trans)?.label || trans;
    chips.push({ key: 'transmissions', label: transLabel, value: trans, category: 'performance' });
  });

  filters.driveTypes?.forEach((drive) => {
    const driveLabel = DRIVE_TYPES.find(d => d.value === drive)?.label || drive;
    chips.push({ key: 'driveTypes', label: driveLabel, value: drive, category: 'performance' });
  });

  if (filters.minPower || filters.maxPower) {
    const minLabel = filters.minPower ? `${filters.minPower}` : '0';
    const maxLabel = filters.maxPower ? `${filters.maxPower} pk` : '∞ pk';
    chips.push({ key: 'minPower', label: `${minLabel} - ${maxLabel}`, category: 'performance' });
  }

  // Appearance filters
  filters.paintTypes?.forEach((paint) => {
    const paintLabel = PAINT_TYPES.find(p => p.value === paint)?.label || paint;
    chips.push({ key: 'paintTypes', label: paintLabel, value: paint, category: 'appearance' });
  });

  filters.colors?.forEach((color) => {
    chips.push({ key: 'colors', label: color, value: color, category: 'appearance' });
  });

  filters.interiorMaterials?.forEach((material) => {
    const materialLabel = INTERIOR_MATERIALS.find(m => m.value === material)?.label || material;
    chips.push({ key: 'interiorMaterials', label: materialLabel, value: material, category: 'appearance' });
  });

  // Practical filters
  if (filters.minDoors) {
    chips.push({ key: 'minDoors', label: `${filters.minDoors}+ deuren`, category: 'practical' });
  }

  if (filters.minSeats) {
    chips.push({ key: 'minSeats', label: `${filters.minSeats}+ zitplaatsen`, category: 'practical' });
  }

  // Location filters
  if (filters.country) {
    const countryLabel = COUNTRY_OPTIONS.find(c => c.value === filters.country)?.label || filters.country;
    chips.push({ key: 'country', label: countryLabel, category: 'location' });
  }

  if (filters.postalCode) {
    chips.push({ key: 'postalCode', label: filters.postalCode, category: 'location' });
  }

  if (filters.province) {
    chips.push({ key: 'province', label: filters.province, category: 'location' });
  }

  if (filters.radius) {
    chips.push({ key: 'radius', label: `${filters.radius} km`, category: 'location' });
  }

  if (filters.onlineSince) {
    const sinceLabel = ONLINE_SINCE_OPTIONS.find(o => o.value === filters.onlineSince)?.label || filters.onlineSince;
    chips.push({ key: 'onlineSince', label: sinceLabel, category: 'location' });
  }

  // History filters
  if (filters.sellerType) {
    chips.push({ key: 'sellerType', label: filters.sellerType === 'dealer' ? 'Dealer' : 'Particulier', category: 'history' });
  }

  if (filters.maxPreviousOwners) {
    chips.push({ key: 'maxPreviousOwners', label: `Max. ${filters.maxPreviousOwners} eigenaar(s)`, category: 'history' });
  }

  if (filters.minWarranty) {
    const warrantyLabel = WARRANTY_OPTIONS.find(w => w.value === filters.minWarranty)?.label || filters.minWarranty;
    chips.push({ key: 'minWarranty', label: `Min. ${warrantyLabel} garantie`, category: 'history' });
  }

  if (filters.noDamageHistory) {
    chips.push({ key: 'noDamageHistory', label: 'Geen schadehistorie', category: 'history' });
  }

  if (filters.vatDeductible) {
    chips.push({ key: 'vatDeductible', label: 'BTW aftrekbaar', category: 'history' });
  }

  if (filters.hasMaintenanceHistory) {
    chips.push({ key: 'hasMaintenanceHistory', label: 'Met onderhoudshistorie', category: 'history' });
  }

  if (filters.isNonSmoker) {
    chips.push({ key: 'isNonSmoker', label: 'Niet-roker', category: 'history' });
  }

  // Feature filters
  filters.features?.forEach((feature) => {
    const featureLabel = FEATURE_OPTIONS.find(f => f.value === feature)?.label || feature;
    chips.push({ key: 'features', label: featureLabel, value: feature, category: 'options' });
  });

  if (chips.length === 0) return null;

  // Group chips by category for visual separation
  const categories = ['basic', 'performance', 'appearance', 'practical', 'location', 'history', 'options'] as const;
  const groupedChips = categories.map(cat => chips.filter(c => c.category === cat)).filter(group => group.length > 0);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {groupedChips.map((group, groupIndex) => (
        <div key={groupIndex} className="contents">
          {group.map((chip, index) => (
            <Badge
              key={`${chip.key}-${chip.value || index}`}
              variant="secondary"
              className="gap-1 pr-1 animate-fade-in bg-secondary/80 hover:bg-secondary transition-colors"
              style={{ animationDelay: `${(groupIndex * group.length + index) * 30}ms` } as React.CSSProperties}
            >
              {chip.label}
              <button
                onClick={() => onRemoveFilter(chip.key, chip.value)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                aria-label={`Verwijder filter: ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {groupIndex < groupedChips.length - 1 && (
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
          )}
        </div>
      ))}
      {chips.length > 1 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll} 
          className="h-6 text-xs text-muted-foreground hover:text-foreground"
        >
          Wis alles
        </Button>
      )}
    </div>
  );
}

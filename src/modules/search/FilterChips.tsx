import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchFilters, FUEL_TYPES, TRANSMISSION_TYPES, BODY_TYPES } from '@/types/listing';

interface FilterChipsProps {
  filters: SearchFilters;
  onRemoveFilter: (key: keyof SearchFilters, value?: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  const chips: { key: keyof SearchFilters; label: string; value?: string }[] = [];

  if (filters.brand) {
    chips.push({ key: 'brand', label: filters.brand });
  }

  if (filters.model) {
    chips.push({ key: 'model', label: `Model: ${filters.model}` });
  }

  if (filters.minPrice || filters.maxPrice) {
    const minLabel = filters.minPrice ? `€${filters.minPrice.toLocaleString()}` : '€0';
    const maxLabel = filters.maxPrice ? `€${filters.maxPrice.toLocaleString()}` : '∞';
    chips.push({ key: 'minPrice', label: `${minLabel} - ${maxLabel}` });
  }

  if (filters.minYear || filters.maxYear) {
    const minLabel = filters.minYear || '1990';
    const maxLabel = filters.maxYear || 'nu';
    chips.push({ key: 'minYear', label: `${minLabel} - ${maxLabel}` });
  }

  if (filters.maxMileage) {
    chips.push({ key: 'maxMileage', label: `Max ${filters.maxMileage.toLocaleString()} km` });
  }

  filters.fuelTypes?.forEach((fuel) => {
    const fuelLabel = FUEL_TYPES.find(f => f.value === fuel)?.label || fuel;
    chips.push({ key: 'fuelTypes', label: fuelLabel, value: fuel });
  });

  filters.transmissions?.forEach((trans) => {
    const transLabel = TRANSMISSION_TYPES.find(t => t.value === trans)?.label || trans;
    chips.push({ key: 'transmissions', label: transLabel, value: trans });
  });

  filters.bodyTypes?.forEach((body) => {
    const bodyLabel = BODY_TYPES.find(b => b.value === body)?.label || body;
    chips.push({ key: 'bodyTypes', label: bodyLabel, value: body });
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, index) => (
        <Badge
          key={`${chip.key}-${chip.value || index}`}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {chip.label}
          <button
            onClick={() => onRemoveFilter(chip.key, chip.value)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 text-xs">
          Wis alles
        </Button>
      )}
    </div>
  );
}

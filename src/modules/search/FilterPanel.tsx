import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  SearchFilters, 
  CAR_BRANDS, 
  FUEL_TYPES, 
  TRANSMISSION_TYPES, 
  BODY_TYPES,
  FuelType,
  TransmissionType,
  BodyType
} from '@/types/listing';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

export function FilterPanel({ filters, onFiltersChange, className }: FilterPanelProps) {
  const [openSections, setOpenSections] = useState({
    brand: true,
    price: true,
    year: false,
    mileage: false,
    fuel: true,
    transmission: false,
    bodyType: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'fuelTypes' | 'transmissions' | 'bodyTypes', value: string) => {
    const currentValues = (filters[key] as string[] | undefined) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFiltersChange({ ...filters, [key]: newValues.length > 0 ? newValues : undefined });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
            <X className="mr-1 h-4 w-4" />
            Wis alles
          </Button>
        )}
      </div>

      {/* Brand Filter */}
      <FilterSection
        title="Merk"
        isOpen={openSections.brand}
        onToggle={() => toggleSection('brand')}
      >
        <Select value={filters.brand || ''} onValueChange={(v) => updateFilter('brand', v || undefined)}>
          <SelectTrigger>
            <SelectValue placeholder="Alle merken" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle merken</SelectItem>
            {CAR_BRANDS.map((brand) => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Price Filter */}
      <FilterSection
        title="Prijs"
        isOpen={openSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={filters.minPrice?.toString() || ''} onValueChange={(v) => updateFilter('minPrice', v ? parseInt(v) : undefined)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen min</SelectItem>
                <SelectItem value="5000">€ 5.000</SelectItem>
                <SelectItem value="10000">€ 10.000</SelectItem>
                <SelectItem value="15000">€ 15.000</SelectItem>
                <SelectItem value="20000">€ 20.000</SelectItem>
                <SelectItem value="30000">€ 30.000</SelectItem>
                <SelectItem value="40000">€ 40.000</SelectItem>
                <SelectItem value="50000">€ 50.000</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">-</span>
            <Select value={filters.maxPrice?.toString() || ''} onValueChange={(v) => updateFilter('maxPrice', v ? parseInt(v) : undefined)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Max" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen max</SelectItem>
                <SelectItem value="10000">€ 10.000</SelectItem>
                <SelectItem value="20000">€ 20.000</SelectItem>
                <SelectItem value="30000">€ 30.000</SelectItem>
                <SelectItem value="40000">€ 40.000</SelectItem>
                <SelectItem value="50000">€ 50.000</SelectItem>
                <SelectItem value="75000">€ 75.000</SelectItem>
                <SelectItem value="100000">€ 100.000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      {/* Year Filter */}
      <FilterSection
        title="Bouwjaar"
        isOpen={openSections.year}
        onToggle={() => toggleSection('year')}
      >
        <div className="flex items-center gap-2">
          <Select value={filters.minYear?.toString() || ''} onValueChange={(v) => updateFilter('minYear', v ? parseInt(v) : undefined)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Van" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Geen min</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">-</span>
          <Select value={filters.maxYear?.toString() || ''} onValueChange={(v) => updateFilter('maxYear', v ? parseInt(v) : undefined)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Tot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Geen max</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FilterSection>

      {/* Mileage Filter */}
      <FilterSection
        title="Kilometerstand"
        isOpen={openSections.mileage}
        onToggle={() => toggleSection('mileage')}
      >
        <Select value={filters.maxMileage?.toString() || ''} onValueChange={(v) => updateFilter('maxMileage', v ? parseInt(v) : undefined)}>
          <SelectTrigger>
            <SelectValue placeholder="Max km-stand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Geen maximum</SelectItem>
            <SelectItem value="25000">Tot 25.000 km</SelectItem>
            <SelectItem value="50000">Tot 50.000 km</SelectItem>
            <SelectItem value="75000">Tot 75.000 km</SelectItem>
            <SelectItem value="100000">Tot 100.000 km</SelectItem>
            <SelectItem value="150000">Tot 150.000 km</SelectItem>
            <SelectItem value="200000">Tot 200.000 km</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Fuel Type Filter */}
      <FilterSection
        title="Brandstof"
        isOpen={openSections.fuel}
        onToggle={() => toggleSection('fuel')}
      >
        <div className="space-y-2">
          {FUEL_TYPES.map((fuel) => (
            <div key={fuel.value} className="flex items-center space-x-2">
              <Checkbox
                id={`fuel-${fuel.value}`}
                checked={filters.fuelTypes?.includes(fuel.value) || false}
                onCheckedChange={() => toggleArrayFilter('fuelTypes', fuel.value)}
              />
              <Label htmlFor={`fuel-${fuel.value}`} className="text-sm font-normal cursor-pointer">
                {fuel.label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Transmission Filter */}
      <FilterSection
        title="Transmissie"
        isOpen={openSections.transmission}
        onToggle={() => toggleSection('transmission')}
      >
        <div className="space-y-2">
          {TRANSMISSION_TYPES.map((trans) => (
            <div key={trans.value} className="flex items-center space-x-2">
              <Checkbox
                id={`trans-${trans.value}`}
                checked={filters.transmissions?.includes(trans.value) || false}
                onCheckedChange={() => toggleArrayFilter('transmissions', trans.value)}
              />
              <Label htmlFor={`trans-${trans.value}`} className="text-sm font-normal cursor-pointer">
                {trans.label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Body Type Filter */}
      <FilterSection
        title="Carrosserie"
        isOpen={openSections.bodyType}
        onToggle={() => toggleSection('bodyType')}
      >
        <div className="space-y-2">
          {BODY_TYPES.map((body) => (
            <div key={body.value} className="flex items-center space-x-2">
              <Checkbox
                id={`body-${body.value}`}
                checked={filters.bodyTypes?.includes(body.value) || false}
                onCheckedChange={() => toggleArrayFilter('bodyTypes', body.value)}
              />
              <Label htmlFor={`body-${body.value}`} className="text-sm font-normal cursor-pointer">
                {body.label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, isOpen, onToggle, children }: FilterSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="border-b pb-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
        <span className="text-sm font-medium">{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

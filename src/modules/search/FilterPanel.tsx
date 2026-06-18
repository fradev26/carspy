import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  SearchFilters,
  CAR_BRANDS,
  CAR_MODELS,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  BODY_TYPES,
  DRIVE_TYPES,
  INTERIOR_MATERIALS,
  PROVINCES,
  COLOR_OPTIONS,
  ColorOption,
  ONLINE_SINCE_OPTIONS,
  FEATURE_OPTIONS,
  COUNTRY_OPTIONS,
  RADIUS_OPTIONS,
  OnlineSince,
} from '@/types/listing';
import { cn } from '@/lib/utils';
import { FilterPresets } from './FilterPresets';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
  showPresets?: boolean;
}

type FilterSection =
  | 'quick'
  | 'performance'
  | 'appearance'
  | 'practical'
  | 'location'
  | 'history'
  | 'options';

const OWNERS_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4+' },
];

function ColorSwatch({ color, selected }: { color: ColorOption; selected: boolean }) {
  const style: React.CSSProperties = {};
  if (color.swatch === 'two-tone') {
    style.background = 'conic-gradient(from 180deg at 50% 50%, #111 0deg 180deg, #fff 180deg 360deg)';
  } else if (color.swatch === 'other') {
    style.background =
      'repeating-linear-gradient(45deg, hsl(var(--muted)) 0 6px, hsl(var(--muted-foreground)/0.25) 6px 12px)';
  } else if (color.hex) {
    style.backgroundColor = color.hex;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-7 w-7 rounded-full border border-border/80 shadow-sm transition-transform',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105',
      )}
      style={style}
    />
  );
}

export function FilterPanel({ filters, onFiltersChange, className, showPresets = true }: FilterPanelProps) {
  const [openSections, setOpenSections] = useState<Record<FilterSection, boolean>>({
    quick: true,
    performance: false,
    appearance: false,
    practical: false,
    location: false,
    history: false,
    options: false,
  });

  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

  const toggleSection = (section: FilterSection) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <T extends string>(key: keyof SearchFilters, value: T) => {
    const currentValues = (filters[key] as T[] | undefined) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFiltersChange({ ...filters, [key]: newValues.length > 0 ? newValues : undefined });
  };

  const clearAllFilters = () => onFiltersChange({});

  const applyPreset = (presetFilters: Partial<SearchFilters>) => {
    const newFilters = { ...filters };
    Object.entries(presetFilters).forEach(([key, value]) => {
      if (value === undefined) {
        delete (newFilters as Record<string, unknown>)[key];
      } else {
        (newFilters as Record<string, unknown>)[key] = value;
      }
    });
    onFiltersChange(newFilters);
  };

  const sectionCounts = useMemo(() => {
    return {
      quick: [
        filters.brand,
        filters.model,
        filters.minPrice || filters.maxPrice,
        filters.minYear || filters.maxYear,
        filters.minMileage || filters.maxMileage,
        filters.fuelTypes?.length,
        filters.bodyTypes?.length,
      ].filter(Boolean).length,
      performance: [
        filters.transmissions?.length,
        filters.driveTypes?.length,
        filters.minPower || filters.maxPower,
      ].filter(Boolean).length,
      appearance: [
        filters.colors?.length,
        filters.interiorColors?.length,
      ].filter(Boolean).length,
      practical: [
        filters.minDoors,
        filters.minSeats,
      ].filter(Boolean).length,
      location: [
        filters.country,
        filters.postalCode,
        filters.province,
        filters.radius,
        filters.onlineSince,
      ].filter(Boolean).length,
      history: [
        filters.sellerType,
        filters.maxPreviousOwners != null ? 1 : 0,
        filters.vatDeductible,
      ].filter(Boolean).length,
      options: [filters.features?.length].filter(Boolean).length,
    };
  }, [filters]);

  const totalActiveFilters = Object.values(sectionCounts).reduce((a, b) => a + b, 0);
  const currentYear = new Date().getFullYear();
  const availableModels = filters.brand ? CAR_MODELS[filters.brand] || [] : [];

  const groupedFeatures = useMemo(() => {
    return FEATURE_OPTIONS.reduce((acc, feature) => {
      if (!acc[feature.category]) acc[feature.category] = [];
      acc[feature.category].push(feature);
      return acc;
    }, {} as Record<string, typeof FEATURE_OPTIONS>);
  }, []);

  const popularFeatures = FEATURE_OPTIONS.slice(0, 8);

  return (
    <div className={cn('space-y-1', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Filters</h2>
          {totalActiveFilters > 0 && (
            <Badge variant="secondary" className="font-medium bg-accent text-accent-foreground">
              {totalActiveFilters}
            </Badge>
          )}
        </div>
        {totalActiveFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground h-9 px-2 gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {showPresets && (
        <div className="py-4 border-b border-border/40">
          <FilterPresets onApplyPreset={applyPreset} activeFilters={filters} />
        </div>
      )}

      {/* 1. Basis */}
      <FilterSection title="Basis" section="quick" count={sectionCounts.quick} isOpen={openSections.quick} onToggle={() => toggleSection('quick')}>
        <div className="space-y-5">
          {/* Brand */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Merk</Label>
            <Select
              value={filters.brand || ''}
              onValueChange={(v) => {
                const nextBrand = v === 'all' ? undefined : v;
                const resetModel = nextBrand !== filters.brand;
                onFiltersChange({
                  ...filters,
                  brand: nextBrand,
                  model: resetModel ? undefined : filters.model,
                });
              }}
            >
              <SelectTrigger className="h-12 border-border/60 text-base">
                <SelectValue placeholder="Alle merken" />
              </SelectTrigger>
              <SelectContent className="bg-card max-h-72">
                <SelectItem value="all">Alle merken</SelectItem>
                {CAR_BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          {filters.brand && availableModels.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-sm font-medium text-foreground">Model</Label>
              <Select value={filters.model || ''} onValueChange={(v) => updateFilter('model', v === 'all' ? undefined : v)}>
                <SelectTrigger className="h-12 border-border/60 text-base">
                  <SelectValue placeholder="Alle modellen" />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-72">
                  <SelectItem value="all">Alle modellen</SelectItem>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Prijs</Label>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                aria-label="Minimumprijs"
                prefix="€"
                placeholder="Min"
                min={0}
                value={filters.minPrice}
                onValueChange={(n) => updateFilter('minPrice', n)}
              />
              <NumberInput
                aria-label="Maximumprijs"
                prefix="€"
                placeholder="Max"
                min={0}
                value={filters.maxPrice}
                onValueChange={(n) => updateFilter('maxPrice', n)}
              />
            </div>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Bouwjaar</Label>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                aria-label="Bouwjaar van"
                placeholder="Van"
                groupThousands={false}
                min={1950}
                max={currentYear + 1}
                value={filters.minYear}
                onValueChange={(n) => updateFilter('minYear', n)}
              />
              <NumberInput
                aria-label="Bouwjaar tot"
                placeholder="Tot"
                groupThousands={false}
                min={1950}
                max={currentYear + 1}
                value={filters.maxYear}
                onValueChange={(n) => updateFilter('maxYear', n)}
              />
            </div>
          </div>

          {/* Mileage */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Kilometerstand</Label>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                aria-label="Minimum kilometerstand"
                suffix="km"
                placeholder="Min"
                min={0}
                value={filters.minMileage}
                onValueChange={(n) => updateFilter('minMileage', n)}
              />
              <NumberInput
                aria-label="Maximum kilometerstand"
                suffix="km"
                placeholder="Max"
                min={0}
                value={filters.maxMileage}
                onValueChange={(n) => updateFilter('maxMileage', n)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Laat leeg of gebruik 0 voor geen bovengrens.</p>
          </div>

          {/* Fuel */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Brandstof</Label>
            <div className="grid grid-cols-2 gap-2">
              {FUEL_TYPES.map((fuel) => (
                <CheckboxRow
                  key={fuel.value}
                  id={`fuel-${fuel.value}`}
                  label={fuel.label}
                  checked={filters.fuelTypes?.includes(fuel.value) || false}
                  onChange={() => toggleArrayFilter('fuelTypes', fuel.value)}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Carrosserie</Label>
            <div className="grid grid-cols-2 gap-2">
              {BODY_TYPES.map((body) => (
                <CheckboxRow
                  key={body.value}
                  id={`body-${body.value}`}
                  label={body.label}
                  checked={filters.bodyTypes?.includes(body.value) || false}
                  onChange={() => toggleArrayFilter('bodyTypes', body.value)}
                />
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 2. Performance */}
      <FilterSection title="Aandrijving & Prestaties" section="performance" count={sectionCounts.performance} isOpen={openSections.performance} onToggle={() => toggleSection('performance')}>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Transmissie</Label>
            <div className="space-y-1">
              {TRANSMISSION_TYPES.map((trans) => (
                <CheckboxRow
                  key={trans.value}
                  id={`trans-${trans.value}`}
                  label={trans.label}
                  checked={filters.transmissions?.includes(trans.value) || false}
                  onChange={() => toggleArrayFilter('transmissions', trans.value)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Aandrijving</Label>
            <div className="space-y-1">
              {DRIVE_TYPES.map((drive) => (
                <CheckboxRow
                  key={drive.value}
                  id={`drive-${drive.value}`}
                  label={drive.label}
                  checked={filters.driveTypes?.includes(drive.value) || false}
                  onChange={() => toggleArrayFilter('driveTypes', drive.value)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Vermogen</Label>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                aria-label="Minimaal vermogen in pk"
                suffix="pk"
                placeholder="Min"
                min={0}
                value={filters.minPower}
                onValueChange={(n) => updateFilter('minPower', n)}
              />
              <NumberInput
                aria-label="Maximaal vermogen in pk"
                suffix="pk"
                placeholder="Max"
                min={0}
                value={filters.maxPower}
                onValueChange={(n) => updateFilter('maxPower', n)}
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 3. Appearance */}
      <FilterSection title="Uiterlijk & Interieur" section="appearance" count={sectionCounts.appearance} isOpen={openSections.appearance} onToggle={() => toggleSection('appearance')}>
        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Exterieurkleur</Label>
            <ColorGrid
              options={COLOR_OPTIONS}
              selected={filters.colors || []}
              onToggle={(v) => toggleArrayFilter('colors', v)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Interieurkleur</Label>
            <ColorGrid
              options={COLOR_OPTIONS}
              selected={filters.interiorColors || []}
              onToggle={(v) => toggleArrayFilter('interiorColors', v)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Interieurmateriaal</Label>
            <div className="grid grid-cols-2 gap-2">
              {INTERIOR_MATERIALS.map((m) => (
                <CheckboxRow
                  key={m.value}
                  id={`mat-${m.value}`}
                  label={m.label}
                  checked={filters.interiorMaterials?.includes(m.value) || false}
                  onChange={() => toggleArrayFilter('interiorMaterials', m.value)}
                />
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 4. Practical */}
      <FilterSection title="Praktisch" section="practical" count={sectionCounts.practical} isOpen={openSections.practical} onToggle={() => toggleSection('practical')}>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Min. aantal deuren</Label>
            <Select value={filters.minDoors?.toString() || ''} onValueChange={(v) => updateFilter('minDoors', v && v !== 'none' ? parseInt(v) : undefined)}>
              <SelectTrigger className="h-12 border-border/60 text-base"><SelectValue placeholder="Alle" /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="none">Alle</SelectItem>
                <SelectItem value="2">2+ deuren</SelectItem>
                <SelectItem value="3">3+ deuren</SelectItem>
                <SelectItem value="4">4+ deuren</SelectItem>
                <SelectItem value="5">5 deuren</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Min. aantal zitplaatsen</Label>
            <Select value={filters.minSeats?.toString() || ''} onValueChange={(v) => updateFilter('minSeats', v && v !== 'none' ? parseInt(v) : undefined)}>
              <SelectTrigger className="h-12 border-border/60 text-base"><SelectValue placeholder="Alle" /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="none">Alle</SelectItem>
                <SelectItem value="2">2+ zitplaatsen</SelectItem>
                <SelectItem value="4">4+ zitplaatsen</SelectItem>
                <SelectItem value="5">5+ zitplaatsen</SelectItem>
                <SelectItem value="7">7+ zitplaatsen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      {/* 5. Location & Timing */}
      <FilterSection title="Locatie & Timing" section="location" count={sectionCounts.location} isOpen={openSections.location} onToggle={() => toggleSection('location')}>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Land</Label>
            <Select value={filters.country || ''} onValueChange={(v) => updateFilter('country', v === 'all' ? undefined : v)}>
              <SelectTrigger className="h-12 border-border/60 text-base"><SelectValue placeholder="Alle landen" /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Alle landen</SelectItem>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Stad of postcode</Label>
            <Input
              placeholder="Bijv. Amsterdam, 1012"
              value={filters.postalCode || ''}
              onChange={(e) => updateFilter('postalCode', e.target.value || undefined)}
              className="h-12 border-border/60 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Provincie</Label>
            <Select value={filters.province || ''} onValueChange={(v) => updateFilter('province', v === 'all' ? undefined : v)}>
              <SelectTrigger className="h-12 border-border/60 text-base"><SelectValue placeholder="Alle provincies" /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Alle provincies</SelectItem>
                {PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Zoekstraal</Label>
            <Select value={filters.radius?.toString() || ''} onValueChange={(v) => updateFilter('radius', v && v !== 'none' ? parseInt(v) : undefined)}>
              <SelectTrigger className="h-12 border-border/60 text-base"><SelectValue placeholder="Heel land" /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="none">Heel land</SelectItem>
                {RADIUS_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value.toString()}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Online sinds</Label>
            <div role="radiogroup" aria-label="Online sinds" className="flex flex-wrap gap-2">
              {ONLINE_SINCE_OPTIONS.map((opt) => {
                const active = filters.onlineSince === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => updateFilter('onlineSince', active ? undefined : (opt.value as OnlineSince))}
                    className={cn(
                      'min-h-11 rounded-full border px-4 text-sm font-medium transition-all focus-ring',
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border/60 bg-background text-foreground/80 hover:border-primary/50 hover:text-foreground',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 6. History & Trust */}
      <FilterSection title="Historiek & Zekerheid" section="history" count={sectionCounts.history} isOpen={openSections.history} onToggle={() => toggleSection('history')}>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Verkoper</Label>
            <Select value={filters.sellerType || ''} onValueChange={(v) => updateFilter('sellerType', v === 'all' ? undefined : v as 'private' | 'dealer')}>
              <SelectTrigger className="h-12 border-border/60 text-base"><SelectValue placeholder="Iedereen" /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Iedereen</SelectItem>
                <SelectItem value="dealer">Alleen dealers</SelectItem>
                <SelectItem value="private">Alleen particulieren</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Max. vorige eigenaren</Label>
            <div role="radiogroup" aria-label="Max. vorige eigenaren" className="flex flex-wrap gap-2">
              {OWNERS_OPTIONS.map((opt) => {
                const active = filters.maxPreviousOwners === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => updateFilter('maxPreviousOwners', active ? undefined : opt.value)}
                    className={cn(
                      'min-h-11 min-w-12 rounded-full border px-4 text-sm font-semibold transition-all focus-ring',
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border/60 bg-background text-foreground/80 hover:border-primary/50 hover:text-foreground',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">0 = jij wordt de eerste eigenaar na de fabrikant.</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <Label htmlFor="vat" className="text-sm font-medium cursor-pointer">BTW aftrekbaar</Label>
            <Switch
              id="vat"
              checked={filters.vatDeductible || false}
              onCheckedChange={(v) => updateFilter('vatDeductible', v || undefined)}
            />
          </div>
        </div>
      </FilterSection>

      {/* 7. Options & Features */}
      <FilterSection title="Opties & Extra's" section="options" count={sectionCounts.options} isOpen={openSections.options} onToggle={() => toggleSection('options')}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Populaire opties</Label>
            <div className="grid grid-cols-1 gap-1">
              {popularFeatures.map((feature) => (
                <CheckboxRow
                  key={feature.value}
                  id={`feature-${feature.value}`}
                  label={feature.label}
                  checked={filters.features?.includes(feature.value) || false}
                  onChange={() => toggleArrayFilter('features', feature.value)}
                />
              ))}
            </div>
          </div>

          <Collapsible open={showMoreFeatures} onOpenChange={setShowMoreFeatures}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between min-h-11 px-2">
                <span className="text-sm">Meer opties tonen</span>
                {showMoreFeatures ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {Object.entries(groupedFeatures).map(([category, features]) => (
                <div key={category} className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {category === 'comfort' ? 'Comfort' :
                     category === 'multimedia' ? 'Multimedia' :
                     category === 'safety' ? 'Veiligheid' :
                     category === 'exterior' ? 'Exterieur' : category}
                  </Label>
                  <div className="grid grid-cols-1 gap-1">
                    {features.filter(f => !popularFeatures.includes(f)).map((feature) => (
                      <CheckboxRow
                        key={feature.value}
                        id={`feature-${feature.value}`}
                        label={feature.label}
                        checked={filters.features?.includes(feature.value) || false}
                        onChange={() => toggleArrayFilter('features', feature.value)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </FilterSection>
    </div>
  );
}

interface CheckboxRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

function CheckboxRow({ id, label, checked, onChange }: CheckboxRowProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-3 rounded-md px-2 py-2 min-h-11 cursor-pointer transition-colors',
        'hover:bg-muted/60',
        checked && 'bg-primary/5',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="h-5 w-5 border-border"
      />
      <span className="text-sm text-foreground/90 select-none flex-1">{label}</span>
    </label>
  );
}

function ColorGrid({
  options,
  selected,
  onToggle,
}: {
  options: ColorOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {options.map((color) => {
        const isSelected = selected.includes(color.value);
        return (
          <button
            key={color.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(color.value)}
            className={cn(
              'group flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 min-h-[72px] transition-all focus-ring',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border/60 bg-background hover:border-primary/40 hover:bg-muted/40',
            )}
          >
            <ColorSwatch color={color} selected={isSelected} />
            <span className={cn('text-xs leading-tight', isSelected ? 'font-semibold text-foreground' : 'text-foreground/80')}>
              {color.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  section: FilterSection;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, count, isOpen, onToggle, children }: FilterSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="border-b border-border/40 py-3">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 group min-h-11">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </span>
          {count > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs bg-accent text-accent-foreground">
              {count}
            </Badge>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

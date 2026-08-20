import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, RotateCcw, Search as SearchIcon } from 'lucide-react';
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
  CONDITION_TYPES,
  CONDITION_TYPE_LABELS,
  CO2_OPTIONS,
  OnlineSince,
  PowerUnit,
} from '@/types/listing';
import { cn } from '@/lib/utils';
import { FilterPresets } from './FilterPresets';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { useSearchFacets, type FacetCounts } from '@/hooks/useSearchFacets';
import { fromKw, toKw } from '@/lib/searchQuery';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
  showPresets?: boolean;
  /** Vrije zoekterm, zodat de facettellingen ook daarmee rekening houden. */
  query?: string;
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

const FEATURE_CATEGORY_LABELS: Record<string, string> = {
  comfort: 'Comfort',
  multimedia: 'Multimedia',
  safety: 'Veiligheid',
  exterior: 'Exterieur',
  overig: 'Overige',
};

const MIN_YEAR = 1990;

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

export function FilterPanel({
  filters,
  onFiltersChange,
  className,
  showPresets = true,
  query,
}: FilterPanelProps) {
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
  const [featureQuery, setFeatureQuery] = useState('');
  const [brandQuery, setBrandQuery] = useState('');

  const { facets } = useSearchFacets(filters, query);

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

  const selectedBrands = filters.brands ?? [];
  const selectedModels = filters.models ?? [];

  const toggleBrand = (brand: string) => {
    const active = selectedBrands.includes(brand);
    const nextBrands = active
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    const nextModels = active
      ? selectedModels.filter((m) => !m.startsWith(`${brand}:`))
      : selectedModels;
    onFiltersChange({
      ...filters,
      brands: nextBrands.length ? nextBrands : undefined,
      models: nextModels.length ? nextModels : undefined,
      brand: undefined,
      model: undefined,
    });
  };

  const toggleModel = (brand: string, model: string) => {
    const key = `${brand}:${model}`;
    const nextModels = selectedModels.includes(key)
      ? selectedModels.filter((m) => m !== key)
      : [...selectedModels, key];
    const nextBrands = selectedBrands.includes(brand)
      ? selectedBrands
      : [...selectedBrands, brand];
    onFiltersChange({
      ...filters,
      brands: nextBrands.length ? nextBrands : undefined,
      models: nextModels.length ? nextModels : undefined,
      brand: undefined,
      model: undefined,
    });
  };

  const clearModelsForBrand = (brand: string) => {
    const nextModels = selectedModels.filter((m) => !m.startsWith(`${brand}:`));
    onFiltersChange({ ...filters, models: nextModels.length ? nextModels : undefined });
  };

  const sectionCounts = useMemo(() => {
    return {
      quick: [
        selectedBrands.length,
        selectedModels.length,
        filters.trim,
        filters.conditionTypes?.length,
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
        filters.emissionClasses?.length,
        filters.maxCo2 != null ? 1 : 0,
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
        filters.factoryWarranty,
        filters.carPass,
        filters.noDamageHistory,
      ].filter(Boolean).length,
      options: [filters.features?.length].filter(Boolean).length,
    };
  }, [filters, selectedBrands, selectedModels]);

  const totalActiveFilters = Object.values(sectionCounts).reduce((a, b) => a + b, 0);
  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear + 1; y >= MIN_YEAR; y--) years.push(y);
    return years;
  }, [currentYear]);

  /** Merken: catalogus + merken die effectief in de data voorkomen. */
  const brandOptions = useMemo(() => {
    const fromFacets = Object.keys(facets?.brands ?? {});
    const all = Array.from(new Set([...CAR_BRANDS, ...fromFacets, ...selectedBrands]));
    return all.sort((a, b) => a.localeCompare(b, 'nl'));
  }, [facets, selectedBrands]);

  const visibleBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    const list = q ? brandOptions.filter((b) => b.toLowerCase().includes(q)) : brandOptions;
    // Aangevinkte merken altijd bovenaan tonen.
    return [
      ...list.filter((b) => selectedBrands.includes(b)),
      ...list.filter((b) => !selectedBrands.includes(b)),
    ];
  }, [brandOptions, brandQuery, selectedBrands]);

  /** Opties: gebruik de werkelijke uitrusting uit de data wanneer beschikbaar. */
  const featureOptions = useMemo(() => {
    const facetKeys = Object.keys(facets?.features ?? {});
    if (facetKeys.length === 0) {
      return FEATURE_OPTIONS.map((f) => ({ value: f.value, label: f.label, category: f.category }));
    }
    const knownByLabel = new Map(FEATURE_OPTIONS.map((f) => [f.label.toLowerCase(), f]));
    const opts = facetKeys.map((k) => ({
      value: k,
      label: k,
      category: knownByLabel.get(k.toLowerCase())?.category ?? 'overig',
    }));
    (filters.features ?? []).forEach((v) => {
      if (!opts.some((o) => o.value === v)) opts.push({ value: v, label: v, category: 'overig' });
    });
    return opts.sort((a, b) => a.label.localeCompare(b.label, 'nl'));
  }, [facets, filters.features]);

  const matchingFeatures = useMemo(() => {
    const q = featureQuery.trim().toLowerCase();
    if (!q) return featureOptions;
    return featureOptions.filter((f) => f.label.toLowerCase().includes(q));
  }, [featureOptions, featureQuery]);

  const groupedFeatures = useMemo(() => {
    return matchingFeatures.reduce((acc, feature) => {
      const cat = feature.category || 'overig';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(feature);
      return acc;
    }, {} as Record<string, typeof matchingFeatures>);
  }, [matchingFeatures]);

  const featureSearchActive = featureQuery.trim().length > 0;
  const popularFeatures = matchingFeatures.slice(0, 8);
  const showAllFeatures = showMoreFeatures || featureSearchActive;

  const emissionOptions = useMemo(
    () =>
      Array.from(
        new Set([...Object.keys(facets?.emissionClasses ?? {}), ...(filters.emissionClasses ?? [])]),
      ).sort((a, b) => a.localeCompare(b, 'nl')),
    [facets, filters.emissionClasses],
  );

  const conditionOptions = useMemo(() => {
    const values = Array.from(
      new Set([
        ...CONDITION_TYPES.map((c) => c.value),
        ...Object.keys(facets?.conditionTypes ?? {}),
        ...(filters.conditionTypes ?? []),
      ]),
    );
    return values.map((v) => ({ value: v, label: CONDITION_TYPE_LABELS[v] ?? v }));
  }, [facets, filters.conditionTypes]);

  const powerUnit: PowerUnit = filters.powerUnit ?? 'pk';
  const switchPowerUnit = (unit: PowerUnit) => {
    if (unit === powerUnit) return;
    const convert = (v?: number) =>
      v == null ? undefined : unit === 'kW' ? toKw(v, 'pk') : fromKw(v, 'pk');
    onFiltersChange({
      ...filters,
      powerUnit: unit,
      minPower: convert(filters.minPower),
      maxPower: convert(filters.maxPower),
    });
  };

  const count = (map: FacetCounts | undefined, key: string) => map?.[key];

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
          {/* Merk & model (multi-select) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Merk &amp; model</Label>
            <OptionSearchInput
              value={brandQuery}
              onChange={setBrandQuery}
              placeholder="Zoek merk..."
              label="Zoek merk"
            />
            <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
              {visibleBrands.map((brand) => {
                const checked = selectedBrands.includes(brand);
                const models = CAR_MODELS[brand] ?? [];
                const brandModels = selectedModels
                  .filter((m) => m.startsWith(`${brand}:`))
                  .map((m) => m.slice(brand.length + 1));
                return (
                  <div key={brand}>
                    <CheckboxRow
                      id={`brand-${brand}`}
                      label={brand}
                      count={count(facets?.brands, brand)}
                      checked={checked}
                      onChange={() => toggleBrand(brand)}
                    />
                    {checked && models.length > 0 && (
                      <div className="ml-8 mb-2 space-y-0.5 animate-fade-in">
                        <CheckboxRow
                          id={`brand-${brand}-all`}
                          label={`Alle modellen van ${brand}`}
                          checked={brandModels.length === 0}
                          onChange={() => clearModelsForBrand(brand)}
                        />
                        {models.map((model) => (
                          <CheckboxRow
                            key={model}
                            id={`model-${brand}-${model}`}
                            label={model}
                            checked={brandModels.includes(model)}
                            onChange={() => toggleModel(brand, model)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleBrands.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground">Geen merk gevonden.</p>
              )}
            </div>
          </div>

          {/* Uitvoering */}
          <div className="space-y-2">
            <Label htmlFor="trim" className="text-sm font-medium text-foreground">Uitvoering</Label>
            <Input
              id="trim"
              placeholder="Bijv. GT Line, M Sport"
              value={filters.trim || ''}
              onChange={(e) => updateFilter('trim', e.target.value || undefined)}
              className="h-12 border-border/60 text-base"
            />
          </div>

          {/* Staat */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Staat</Label>
            <div className="grid grid-cols-2 gap-2">
              {conditionOptions.map((opt) => (
                <CheckboxRow
                  key={opt.value}
                  id={`condition-${opt.value}`}
                  label={opt.label}
                  count={count(facets?.conditionTypes, opt.value)}
                  checked={filters.conditionTypes?.includes(opt.value) || false}
                  onChange={() => toggleArrayFilter('conditionTypes', opt.value)}
                />
              ))}
            </div>
          </div>

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
              <Select
                value={filters.minYear?.toString() ?? 'all'}
                onValueChange={(v) => {
                  const next = v === 'all' ? undefined : parseInt(v, 10);
                  onFiltersChange({
                    ...filters,
                    minYear: next,
                    maxYear:
                      next != null && filters.maxYear != null && filters.maxYear < next
                        ? next
                        : filters.maxYear,
                  });
                }}
              >
                <SelectTrigger aria-label="Bouwjaar van" className="h-12 border-border/60 text-base">
                  <SelectValue placeholder="Van" />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-72">
                  <SelectItem value="all">Van</SelectItem>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.maxYear?.toString() ?? 'all'}
                onValueChange={(v) => updateFilter('maxYear', v === 'all' ? undefined : parseInt(v, 10))}
              >
                <SelectTrigger aria-label="Bouwjaar tot" className="h-12 border-border/60 text-base">
                  <SelectValue placeholder="Tot" />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-72">
                  <SelectItem value="all">Tot</SelectItem>
                  {yearOptions
                    .filter((y) => filters.minYear == null || y >= filters.minYear)
                    .map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                  count={count(facets?.fuelTypes, fuel.value)}
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
                  count={count(facets?.bodyTypes, body.value)}
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
                  count={count(facets?.transmissions, trans.value)}
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
                  count={count(facets?.driveTypes, drive.value)}
                  checked={filters.driveTypes?.includes(drive.value) || false}
                  onChange={() => toggleArrayFilter('driveTypes', drive.value)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Vermogen</Label>
              <div role="radiogroup" aria-label="Eenheid vermogen" className="inline-flex rounded-md border border-border/60 p-0.5">
                {(['pk', 'kW'] as PowerUnit[]).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    role="radio"
                    aria-checked={powerUnit === unit}
                    onClick={() => switchPowerUnit(unit)}
                    className={cn(
                      'rounded-sm px-3 py-1 text-xs font-medium transition-colors focus-ring',
                      powerUnit === unit
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                aria-label={`Minimaal vermogen in ${powerUnit}`}
                suffix={powerUnit}
                placeholder="Min"
                min={0}
                value={filters.minPower}
                onValueChange={(n) => updateFilter('minPower', n)}
              />
              <NumberInput
                aria-label={`Maximaal vermogen in ${powerUnit}`}
                suffix={powerUnit}
                placeholder="Max"
                min={0}
                value={filters.maxPower}
                onValueChange={(n) => updateFilter('maxPower', n)}
              />
            </div>
          </div>

          {/* Milieu & emissie */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Milieu &amp; emissie</Label>
            {emissionOptions.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {emissionOptions.map((value) => (
                  <CheckboxRow
                    key={value}
                    id={`emission-${value}`}
                    label={value}
                    count={count(facets?.emissionClasses, value)}
                    checked={filters.emissionClasses?.includes(value) || false}
                    onChange={() => toggleArrayFilter('emissionClasses', value)}
                  />
                ))}
              </div>
            )}
            <Select
              value={filters.maxCo2?.toString() ?? 'all'}
              onValueChange={(v) => updateFilter('maxCo2', v === 'all' ? undefined : parseInt(v, 10))}
            >
              <SelectTrigger aria-label="Maximale CO2-uitstoot" className="h-12 border-border/60 text-base">
                <SelectValue placeholder="CO2-uitstoot" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Alle CO2-waarden</SelectItem>
                {CO2_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value.toString()}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              counts={facets?.colors}
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
              <SelectTrigger aria-label="Alle" className="h-12 border-border/60 text-base">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
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
              <SelectTrigger aria-label="Alle" className="h-12 border-border/60 text-base">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
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
              <SelectTrigger aria-label="Alle landen" className="h-12 border-border/60 text-base">
                <SelectValue placeholder="Alle landen" />
              </SelectTrigger>
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
              <SelectTrigger aria-label="Alle provincies" className="h-12 border-border/60 text-base">
                <SelectValue placeholder="Alle provincies" />
              </SelectTrigger>
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
              <SelectTrigger aria-label="Heel land" className="h-12 border-border/60 text-base">
                <SelectValue placeholder="Heel land" />
              </SelectTrigger>
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
              <SelectTrigger aria-label="Iedereen" className="h-12 border-border/60 text-base">
                <SelectValue placeholder="Iedereen" />
              </SelectTrigger>
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

          {/* Garantie en historiek */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Garantie &amp; historiek</Label>
            <div className="space-y-1">
              <CheckboxRow
                id="carpass"
                label="Car-Pass / onderhoudshistoriek aanwezig"
                checked={filters.carPass || false}
                onChange={() => updateFilter('carPass', filters.carPass ? undefined : true)}
              />
              <CheckboxRow
                id="factory-warranty"
                label="Fabrieks- of dealergarantie"
                checked={filters.factoryWarranty || false}
                onChange={() => updateFilter('factoryWarranty', filters.factoryWarranty ? undefined : true)}
              />
              <CheckboxRow
                id="no-damage"
                label="Ongevalsvrij"
                checked={filters.noDamageHistory || false}
                onChange={() => updateFilter('noDamageHistory', filters.noDamageHistory ? undefined : true)}
              />
            </div>
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
          <OptionSearchInput
            value={featureQuery}
            onChange={setFeatureQuery}
            placeholder="Zoek een optie..."
            label="Zoek een optie"
          />

          {!showAllFeatures && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Populaire opties</Label>
              <div className="grid grid-cols-1 gap-1">
                {popularFeatures.map((feature) => (
                  <CheckboxRow
                    key={feature.value}
                    id={`feature-${feature.value}`}
                    label={feature.label}
                    count={count(facets?.features, feature.value)}
                    checked={filters.features?.includes(feature.value) || false}
                    onChange={() => toggleArrayFilter('features', feature.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {showAllFeatures && (
            <div className="space-y-4">
              {Object.entries(groupedFeatures).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    {FEATURE_CATEGORY_LABELS[category] ?? category}
                  </Label>
                  <div className="grid grid-cols-1 gap-1">
                    {items.map((feature) => (
                      <CheckboxRow
                        key={feature.value}
                        id={`feature-${feature.value}`}
                        label={feature.label}
                        count={count(facets?.features, feature.value)}
                        checked={filters.features?.includes(feature.value) || false}
                        onChange={() => toggleArrayFilter('features', feature.value)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {matchingFeatures.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground">Geen optie gevonden.</p>
              )}
            </div>
          )}

          {!featureSearchActive && featureOptions.length > popularFeatures.length && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMoreFeatures((v) => !v)}
              className="w-full justify-center gap-1 text-sm"
            >
              {showMoreFeatures ? 'Minder opties tonen' : 'Meer opties tonen'}
              {showMoreFeatures ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </FilterSection>
    </div>
  );
}

function OptionSearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 pl-9 border-border/60"
      />
    </div>
  );
}

function CheckboxRow({
  id,
  label,
  checked,
  onChange,
  count,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  /** Aantal advertenties dat aan deze optie voldoet, gegeven de andere filters. */
  count?: number;
}) {
  const unavailable = count === 0 && !checked;
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-3 rounded-md px-2 py-2 min-h-11 cursor-pointer transition-colors',
        'hover:bg-muted/60',
        checked && 'bg-primary/5',
        unavailable && 'cursor-not-allowed opacity-45 hover:bg-transparent',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={unavailable}
        onCheckedChange={onChange}
        className="h-5 w-5 border-border"
      />
      <span className="text-sm text-foreground/90 select-none flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
      )}
    </label>
  );
}

function ColorGrid({
  options,
  selected,
  onToggle,
  counts,
}: {
  options: ColorOption[];
  selected: string[];
  onToggle: (value: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {options.map((color) => {
        const isSelected = selected.includes(color.value);
        const c = counts?.[color.value];
        const unavailable = counts !== undefined && !isSelected && !c;
        return (
          <button
            key={color.value}
            type="button"
            aria-pressed={isSelected}
            disabled={unavailable}
            onClick={() => onToggle(color.value)}
            className={cn(
              'group flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 min-h-[72px] transition-all focus-ring',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border/60 bg-background hover:border-primary/40 hover:bg-muted/40',
              unavailable && 'opacity-45 cursor-not-allowed hover:border-border/60 hover:bg-background',
            )}
          >
            <ColorSwatch color={color} selected={isSelected} />
            <span className={cn('text-xs leading-tight', isSelected ? 'font-semibold text-foreground' : 'text-foreground/80')}>
              {color.label}
              {c !== undefined && <span className="text-muted-foreground"> ({c})</span>}
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
          <span className="text-base font-semibold text-foreground group-hover:text-primary-strong transition-colors">
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

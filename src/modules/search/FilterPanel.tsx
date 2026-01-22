import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  SearchFilters, 
  CAR_BRANDS,
  CAR_MODELS,
  FUEL_TYPES, 
  TRANSMISSION_TYPES, 
  BODY_TYPES,
  DRIVE_TYPES,
  PAINT_TYPES,
  INTERIOR_MATERIALS,
  PROVINCES,
  COLOR_OPTIONS,
  ONLINE_SINCE_OPTIONS,
  WARRANTY_OPTIONS,
  FEATURE_OPTIONS,
} from '@/types/listing';
import { cn } from '@/lib/utils';
import { FilterPresets } from './FilterPresets';

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

  const toggleArrayFilter = <T extends string>(
    key: keyof SearchFilters,
    value: T
  ) => {
    const currentValues = (filters[key] as T[] | undefined) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFiltersChange({ ...filters, [key]: newValues.length > 0 ? newValues : undefined });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const applyPreset = (presetFilters: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...presetFilters });
  };

  // Calculate active filter count per section
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
        filters.paintTypes?.length,
        filters.colors?.length,
        filters.interiorColors?.length,
        filters.interiorMaterials?.length,
      ].filter(Boolean).length,
      practical: [
        filters.minDoors,
        filters.minSeats,
      ].filter(Boolean).length,
      location: [
        filters.province,
        filters.radius,
        filters.onlineSince,
      ].filter(Boolean).length,
      history: [
        filters.sellerType,
        filters.maxPreviousOwners,
        filters.minWarranty,
        filters.noDamageHistory,
        filters.vatDeductible,
        filters.hasMaintenanceHistory,
        filters.isNonSmoker,
      ].filter(Boolean).length,
      options: [
        filters.features?.length,
      ].filter(Boolean).length,
    };
  }, [filters]);

  const totalActiveFilters = Object.values(sectionCounts).reduce((a, b) => a + b, 0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  // Get available models based on selected brand
  const availableModels = filters.brand ? CAR_MODELS[filters.brand] || [] : [];

  // Group features by category
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
            className="text-muted-foreground hover:text-foreground h-8 px-2 gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Smart Presets */}
      {showPresets && (
        <div className="py-4 border-b border-border/40">
          <FilterPresets 
            onApplyPreset={applyPreset} 
            activeFilters={filters}
          />
        </div>
      )}

      {/* 1. Quick Selection */}
      <FilterSection
        title="Basis"
        section="quick"
        count={sectionCounts.quick}
        isOpen={openSections.quick}
        onToggle={() => toggleSection('quick')}
      >
        <div className="space-y-4">
          {/* Brand */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Merk</Label>
            <Select 
              value={filters.brand || ''} 
              onValueChange={(v) => {
                updateFilter('brand', v === 'all' ? undefined : v);
                if (v === 'all' || v !== filters.brand) updateFilter('model', undefined);
              }}
            >
              <SelectTrigger className="border-border/60">
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

          {/* Model (dynamic) */}
          {filters.brand && availableModels.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</Label>
              <Select 
                value={filters.model || ''} 
                onValueChange={(v) => updateFilter('model', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="border-border/60">
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
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prijs</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.minPrice?.toString() || ''} onValueChange={(v) => updateFilter('minPrice', v && v !== 'none' ? parseInt(v) : undefined)}>
                <SelectTrigger className="flex-1 border-border/60">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="none">Geen min</SelectItem>
                  {[2500, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000].map(p => (
                    <SelectItem key={p} value={p.toString()}>€ {p.toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">—</span>
              <Select value={filters.maxPrice?.toString() || ''} onValueChange={(v) => updateFilter('maxPrice', v && v !== 'none' ? parseInt(v) : undefined)}>
                <SelectTrigger className="flex-1 border-border/60">
                  <SelectValue placeholder="Max" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="none">Geen max</SelectItem>
                  {[10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000].map(p => (
                    <SelectItem key={p} value={p.toString()}>€ {p.toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bouwjaar</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.minYear?.toString() || ''} onValueChange={(v) => updateFilter('minYear', v && v !== 'none' ? parseInt(v) : undefined)}>
                <SelectTrigger className="flex-1 border-border/60">
                  <SelectValue placeholder="Van" />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-64">
                  <SelectItem value="none">Geen min</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">—</span>
              <Select value={filters.maxYear?.toString() || ''} onValueChange={(v) => updateFilter('maxYear', v && v !== 'none' ? parseInt(v) : undefined)}>
                <SelectTrigger className="flex-1 border-border/60">
                  <SelectValue placeholder="Tot" />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-64">
                  <SelectItem value="none">Geen max</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mileage */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kilometerstand</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.minMileage?.toString() || ''} onValueChange={(v) => updateFilter('minMileage', v && v !== 'none' ? parseInt(v) : undefined)}>
                <SelectTrigger className="flex-1 border-border/60">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="none">Geen min</SelectItem>
                  {[0, 10000, 25000, 50000, 75000, 100000].map(km => (
                    <SelectItem key={km} value={km.toString()}>{km === 0 ? '0 km' : `${(km/1000)}k km`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">—</span>
              <Select value={filters.maxMileage?.toString() || ''} onValueChange={(v) => updateFilter('maxMileage', v && v !== 'none' ? parseInt(v) : undefined)}>
                <SelectTrigger className="flex-1 border-border/60">
                  <SelectValue placeholder="Max" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="none">Geen max</SelectItem>
                  {[25000, 50000, 75000, 100000, 150000, 200000, 250000].map(km => (
                    <SelectItem key={km} value={km.toString()}>Tot {(km/1000)}k km</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brandstof</Label>
            <div className="grid grid-cols-2 gap-2">
              {FUEL_TYPES.map((fuel) => (
                <div key={fuel.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`fuel-${fuel.value}`}
                    checked={filters.fuelTypes?.includes(fuel.value) || false}
                    onCheckedChange={() => toggleArrayFilter('fuelTypes', fuel.value)}
                    className="border-border"
                  />
                  <Label 
                    htmlFor={`fuel-${fuel.value}`} 
                    className="text-sm font-normal cursor-pointer text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {fuel.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Body Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Carrosserie</Label>
            <div className="grid grid-cols-2 gap-2">
              {BODY_TYPES.map((body) => (
                <div key={body.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`body-${body.value}`}
                    checked={filters.bodyTypes?.includes(body.value) || false}
                    onCheckedChange={() => toggleArrayFilter('bodyTypes', body.value)}
                    className="border-border"
                  />
                  <Label 
                    htmlFor={`body-${body.value}`} 
                    className="text-sm font-normal cursor-pointer text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {body.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 2. Performance */}
      <FilterSection
        title="Aandrijving & Prestaties"
        section="performance"
        count={sectionCounts.performance}
        isOpen={openSections.performance}
        onToggle={() => toggleSection('performance')}
      >
        <div className="space-y-4">
          {/* Transmission */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transmissie</Label>
            <div className="space-y-2">
              {TRANSMISSION_TYPES.map((trans) => (
                <div key={trans.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`trans-${trans.value}`}
                    checked={filters.transmissions?.includes(trans.value) || false}
                    onCheckedChange={() => toggleArrayFilter('transmissions', trans.value)}
                    className="border-border"
                  />
                  <Label 
                    htmlFor={`trans-${trans.value}`} 
                    className="text-sm font-normal cursor-pointer text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {trans.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Drive Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aandrijving</Label>
            <div className="space-y-2">
              {DRIVE_TYPES.map((drive) => (
                <div key={drive.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`drive-${drive.value}`}
                    checked={filters.driveTypes?.includes(drive.value) || false}
                    onCheckedChange={() => toggleArrayFilter('driveTypes', drive.value)}
                    className="border-border"
                  />
                  <Label 
                    htmlFor={`drive-${drive.value}`} 
                    className="text-sm font-normal cursor-pointer text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {drive.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Power */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vermogen (pk)</Label>
            <div className="flex items-center gap-2">
              <Select value={filters.minPower?.toString() || ''} onValueChange={(v) => updateFilter('minPower', v && v !== 'none' ? parseInt(v) : undefined)}>
                <SelectTrigger className="flex-1 border-border/60">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="none">Geen min</SelectItem>
                  {[50, 75, 100, 125, 150, 175, 200, 250, 300, 400].map(p => (
                    <SelectItem key={p} value={p.toString()}>{p} pk</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">—</span>
              <Select value={filters.maxPower?.toString() || ''} onValueChange={(v) => updateFilter('maxPower', v && v !== 'none' ? parseInt(v) : undefined)}>
                <SelectTrigger className="flex-1 border-border/60">
                  <SelectValue placeholder="Max" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="none">Geen max</SelectItem>
                  {[100, 150, 200, 250, 300, 400, 500, 600].map(p => (
                    <SelectItem key={p} value={p.toString()}>{p} pk</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 3. Appearance */}
      <FilterSection
        title="Uiterlijk & Interieur"
        section="appearance"
        count={sectionCounts.appearance}
        isOpen={openSections.appearance}
        onToggle={() => toggleSection('appearance')}
      >
        <div className="space-y-4">
          {/* Paint Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Laksoort</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAINT_TYPES.map((paint) => (
                <div key={paint.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`paint-${paint.value}`}
                    checked={filters.paintTypes?.includes(paint.value) || false}
                    onCheckedChange={() => toggleArrayFilter('paintTypes', paint.value)}
                    className="border-border"
                  />
                  <Label 
                    htmlFor={`paint-${paint.value}`} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {paint.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Exterior Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kleur</Label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_OPTIONS.slice(0, 6).map((color) => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={`color-${color}`}
                    checked={filters.colors?.includes(color) || false}
                    onCheckedChange={() => toggleArrayFilter('colors', color)}
                    className="border-border"
                  />
                  <Label 
                    htmlFor={`color-${color}`} 
                    className="text-xs font-normal cursor-pointer"
                  >
                    {color}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Interior Material */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Interieur</Label>
            <div className="grid grid-cols-2 gap-2">
              {INTERIOR_MATERIALS.map((material) => (
                <div key={material.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`interior-${material.value}`}
                    checked={filters.interiorMaterials?.includes(material.value) || false}
                    onCheckedChange={() => toggleArrayFilter('interiorMaterials', material.value)}
                    className="border-border"
                  />
                  <Label 
                    htmlFor={`interior-${material.value}`} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {material.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 4. Practical */}
      <FilterSection
        title="Praktisch"
        section="practical"
        count={sectionCounts.practical}
        isOpen={openSections.practical}
        onToggle={() => toggleSection('practical')}
      >
        <div className="space-y-4">
          {/* Doors */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min. aantal deuren</Label>
            <Select value={filters.minDoors?.toString() || ''} onValueChange={(v) => updateFilter('minDoors', v && v !== 'none' ? parseInt(v) : undefined)}>
              <SelectTrigger className="border-border/60">
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

          {/* Seats */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min. aantal zitplaatsen</Label>
            <Select value={filters.minSeats?.toString() || ''} onValueChange={(v) => updateFilter('minSeats', v && v !== 'none' ? parseInt(v) : undefined)}>
              <SelectTrigger className="border-border/60">
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
      <FilterSection
        title="Locatie & Timing"
        section="location"
        count={sectionCounts.location}
        isOpen={openSections.location}
        onToggle={() => toggleSection('location')}
      >
        <div className="space-y-4">
          {/* Province */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provincie</Label>
            <Select value={filters.province || ''} onValueChange={(v) => updateFilter('province', v === 'all' ? undefined : v)}>
              <SelectTrigger className="border-border/60">
                <SelectValue placeholder="Alle provincies" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Alle provincies</SelectItem>
                {PROVINCES.map((province) => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zoekstraal</Label>
              <span className="text-sm text-foreground font-medium">
                {filters.radius ? `${filters.radius} km` : 'Heel NL'}
              </span>
            </div>
            <Slider
              value={[filters.radius || 200]}
              onValueChange={([v]) => updateFilter('radius', v === 200 ? undefined : v)}
              min={10}
              max={200}
              step={10}
              className="w-full"
            />
          </div>

          {/* Online Since */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Online sinds</Label>
            <Select value={filters.onlineSince || ''} onValueChange={(v) => updateFilter('onlineSince', v === 'all' ? undefined : v as any)}>
              <SelectTrigger className="border-border/60">
                <SelectValue placeholder="Alle advertenties" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Alle advertenties</SelectItem>
                {ONLINE_SINCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      {/* 6. History & Trust */}
      <FilterSection
        title="Historiek & Zekerheid"
        section="history"
        count={sectionCounts.history}
        isOpen={openSections.history}
        onToggle={() => toggleSection('history')}
      >
        <div className="space-y-4">
          {/* Seller Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Verkoper</Label>
            <Select value={filters.sellerType || ''} onValueChange={(v) => updateFilter('sellerType', v === 'all' ? undefined : v as any)}>
              <SelectTrigger className="border-border/60">
                <SelectValue placeholder="Iedereen" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Iedereen</SelectItem>
                <SelectItem value="dealer">Alleen dealers</SelectItem>
                <SelectItem value="private">Alleen particulieren</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Previous Owners */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max. vorige eigenaren</Label>
            <Select value={filters.maxPreviousOwners?.toString() || ''} onValueChange={(v) => updateFilter('maxPreviousOwners', v && v !== 'none' ? parseInt(v) : undefined)}>
              <SelectTrigger className="border-border/60">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="none">Alle</SelectItem>
                <SelectItem value="1">1e eigenaar</SelectItem>
                <SelectItem value="2">Max. 2 eigenaren</SelectItem>
                <SelectItem value="3">Max. 3 eigenaren</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warranty */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minimale garantie</Label>
            <Select value={filters.minWarranty || ''} onValueChange={(v) => updateFilter('minWarranty', v === 'none' ? undefined : v as any)}>
              <SelectTrigger className="border-border/60">
                <SelectValue placeholder="Geen voorkeur" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="none">Geen voorkeur</SelectItem>
                {WARRANTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle filters */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="no-damage" className="text-sm font-normal cursor-pointer">
                Schadeauto's verbergen
              </Label>
              <Switch
                id="no-damage"
                checked={filters.noDamageHistory || false}
                onCheckedChange={(v) => updateFilter('noDamageHistory', v || undefined)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vat" className="text-sm font-normal cursor-pointer">
                BTW aftrekbaar
              </Label>
              <Switch
                id="vat"
                checked={filters.vatDeductible || false}
                onCheckedChange={(v) => updateFilter('vatDeductible', v || undefined)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance" className="text-sm font-normal cursor-pointer">
                Met onderhoudshistorie
              </Label>
              <Switch
                id="maintenance"
                checked={filters.hasMaintenanceHistory || false}
                onCheckedChange={(v) => updateFilter('hasMaintenanceHistory', v || undefined)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="non-smoker" className="text-sm font-normal cursor-pointer">
                Niet-rokersvoertuig
              </Label>
              <Switch
                id="non-smoker"
                checked={filters.isNonSmoker || false}
                onCheckedChange={(v) => updateFilter('isNonSmoker', v || undefined)}
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 7. Options & Features */}
      <FilterSection
        title="Opties & Extra's"
        section="options"
        count={sectionCounts.options}
        isOpen={openSections.options}
        onToggle={() => toggleSection('options')}
      >
        <div className="space-y-4">
          {/* Popular Features */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Populaire opties</Label>
            <div className="grid grid-cols-1 gap-2">
              {popularFeatures.map((feature) => (
                <div key={feature.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`feature-${feature.value}`}
                    checked={filters.features?.includes(feature.value) || false}
                    onCheckedChange={() => toggleArrayFilter('features', feature.value)}
                    className="border-border"
                  />
                  <Label 
                    htmlFor={`feature-${feature.value}`} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {feature.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Show More Features */}
          <Collapsible open={showMoreFeatures} onOpenChange={setShowMoreFeatures}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-8 px-2">
                <span className="text-sm">Meer opties tonen</span>
                {showMoreFeatures ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {Object.entries(groupedFeatures).map(([category, features]) => (
                <div key={category} className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide capitalize">
                    {category === 'comfort' ? 'Comfort' : 
                     category === 'multimedia' ? 'Multimedia' : 
                     category === 'safety' ? 'Veiligheid' : 
                     category === 'exterior' ? 'Exterieur' : category}
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {features.filter(f => !popularFeatures.includes(f)).map((feature) => (
                      <div key={feature.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature.value}`}
                          checked={filters.features?.includes(feature.value) || false}
                          onCheckedChange={() => toggleArrayFilter('features', feature.value)}
                          className="border-border"
                        />
                        <Label 
                          htmlFor={`feature-${feature.value}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {feature.label}
                        </Label>
                      </div>
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
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1 group">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {title}
          </span>
          {count > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs bg-accent text-accent-foreground">
              {count}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

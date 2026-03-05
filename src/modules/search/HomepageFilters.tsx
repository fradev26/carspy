import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Zap, Car, MapPin, Shield, Settings, Truck, CarFront, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  SearchFilters, 
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
  COUNTRY_OPTIONS,
  RADIUS_OPTIONS,
} from '@/types/listing';
import { cn } from '@/lib/utils';
import { FilterPresets } from './FilterPresets';
import { Input } from '@/components/ui/input';

interface HomepageFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

const POPULAR_FEATURES = FEATURE_OPTIONS.slice(0, 12);

// Body type icon component
function BodyTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'sedan':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14M3 12l2-5h14l2 5M7 17v2H5v-2m14 0v2h-2v-2" />
          <circle cx="7" cy="14" r="2" />
          <circle cx="17" cy="14" r="2" />
        </svg>
      );
    case 'hatchback':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14M3 12l2-5h10l4 5M7 17v2H5v-2m14 0v2h-2v-2" />
          <circle cx="7" cy="14" r="2" />
          <circle cx="17" cy="14" r="2" />
        </svg>
      );
    case 'stationwagon':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14M3 12l2-5h14v5M7 17v2H5v-2m14 0v2h-2v-2" />
          <circle cx="7" cy="14" r="2" />
          <circle cx="17" cy="14" r="2" />
        </svg>
      );
    case 'suv':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16h14M3 11l2-4h14l2 4M7 16v2.5H5V16m14 0v2.5h-2V16" />
          <circle cx="7" cy="13" r="2.5" />
          <circle cx="17" cy="13" r="2.5" />
        </svg>
      );
    case 'cabrio':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14M3 12l2-4h10M7 17v2H5v-2m14 0v2h-2v-2" />
          <circle cx="7" cy="14" r="2" />
          <circle cx="17" cy="14" r="2" />
        </svg>
      );
    case 'coupe':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14M3 12l2-5h11l3 5M7 17v2H5v-2m14 0v2h-2v-2" />
          <circle cx="7" cy="14" r="2" />
          <circle cx="17" cy="14" r="2" />
        </svg>
      );
    case 'mpv':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16h14M3 11l1-4h16v5M7 16v2.5H5V16m14 0v2.5h-2V16" />
          <circle cx="7" cy="13" r="2" />
          <circle cx="17" cy="13" r="2" />
        </svg>
      );
    case 'bestelwagen':
      return <Truck className={className} />;
    default:
      return <Car className={className} />;
  }
}

export function HomepageFilters({ filters, onFiltersChange, className }: HomepageFiltersProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

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

  const applyPreset = (presetFilters: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...presetFilters });
  };

  // Calculate counts per tab
  const tabCounts = useMemo(() => ({
    basis: [
      filters.minMileage || filters.maxMileage,
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
      filters.interiorMaterials?.length,
    ].filter(Boolean).length,
    practical: [
      filters.minDoors,
      filters.minSeats,
      filters.features?.length,
    ].filter(Boolean).length,
    location: [
      filters.country,
      filters.postalCode,
      filters.province,
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
  }), [filters]);


  return (
    <div className={cn('space-y-4', className)}>
      {/* Smart Presets */}
      <div className="pb-4 border-b border-border/40">
        <FilterPresets onApplyPreset={applyPreset} activeFilters={filters} />
      </div>

      {/* Tabbed Filters */}
      <Tabs defaultValue="basis" className="w-full">
        <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="basis" className="flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
            <Car className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Basis</span>
            {tabCounts.basis > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-accent/20 text-accent">
                {tabCounts.basis}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prestaties</span>
            {tabCounts.performance > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-accent/20 text-accent">
                {tabCounts.performance}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Uiterlijk</span>
            {tabCounts.appearance > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-accent/20 text-accent">
                {tabCounts.appearance}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="practical" className="flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Opties</span>
            {tabCounts.practical > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-accent/20 text-accent">
                {tabCounts.practical}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="location" className="flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
            <MapPin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Locatie</span>
            {tabCounts.location > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-accent/20 text-accent">
                {tabCounts.location}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zekerheid</span>
            {tabCounts.history > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-accent/20 text-accent">
                {tabCounts.history}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Basis Tab */}
        <TabsContent value="basis" className="mt-4 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Mileage */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kilometerstand</Label>
                <div className="flex items-center gap-2">
                  <Select value={filters.minMileage?.toString() || ''} onValueChange={(v) => updateFilter('minMileage', v && v !== 'none' ? parseInt(v) : undefined)}>
                    <SelectTrigger className="flex-1 h-9 border-border/60 text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="none">Geen min</SelectItem>
                      {[0, 10000, 25000, 50000, 75000, 100000].map(km => (
                        <SelectItem key={km} value={km.toString()}>{km === 0 ? '0 km' : `${(km/1000)}k km`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-xs">—</span>
                  <Select value={filters.maxMileage?.toString() || ''} onValueChange={(v) => updateFilter('maxMileage', v && v !== 'none' ? parseInt(v) : undefined)}>
                    <SelectTrigger className="flex-1 h-9 border-border/60 text-sm">
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
                <div className="flex flex-wrap gap-2">
                  {FUEL_TYPES.map((fuel) => (
                    <button
                      key={fuel.value}
                      type="button"
                      onClick={() => toggleArrayFilter('fuelTypes', fuel.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                        filters.fuelTypes?.includes(fuel.value)
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {fuel.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Body Type - Visual Cards */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Carrosserie</Label>
                <div className="grid grid-cols-4 gap-2">
                  {BODY_TYPES.map((body) => {
                    const isSelected = filters.bodyTypes?.includes(body.value) || false;
                    return (
                      <button
                        key={body.value}
                        type="button"
                        onClick={() => toggleArrayFilter('bodyTypes', body.value)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
                          isSelected
                            ? "bg-primary/10 border-primary text-primary shadow-sm"
                            : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/60"
                        )}
                      >
                        <BodyTypeIcon type={body.value} className={cn("h-6 w-6", isSelected && "text-primary")} />
                        <span className={cn("text-xs font-medium truncate w-full text-center", isSelected && "text-primary")}>
                          {body.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {/* Transmission */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transmissie</Label>
                <div className="flex flex-wrap gap-2">
                  {TRANSMISSION_TYPES.map((trans) => (
                    <button
                      key={trans.value}
                      type="button"
                      onClick={() => toggleArrayFilter('transmissions', trans.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                        filters.transmissions?.includes(trans.value)
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {trans.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drive Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aandrijving</Label>
                <div className="flex flex-wrap gap-2">
                  {DRIVE_TYPES.map((drive) => (
                    <button
                      key={drive.value}
                      type="button"
                      onClick={() => toggleArrayFilter('driveTypes', drive.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                        filters.driveTypes?.includes(drive.value)
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {drive.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Power */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vermogen (pk)</Label>
                <div className="flex items-center gap-2">
                  <Select value={filters.minPower?.toString() || ''} onValueChange={(v) => updateFilter('minPower', v && v !== 'none' ? parseInt(v) : undefined)}>
                    <SelectTrigger className="flex-1 h-9 border-border/60 text-sm">
                      <SelectValue placeholder="Min pk" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="none">Geen min</SelectItem>
                      {[50, 75, 100, 125, 150, 200, 250, 300].map(pk => (
                        <SelectItem key={pk} value={pk.toString()}>{pk} pk</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-xs">—</span>
                  <Select value={filters.maxPower?.toString() || ''} onValueChange={(v) => updateFilter('maxPower', v && v !== 'none' ? parseInt(v) : undefined)}>
                    <SelectTrigger className="flex-1 h-9 border-border/60 text-sm">
                      <SelectValue placeholder="Max pk" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="none">Geen max</SelectItem>
                      {[100, 150, 200, 250, 300, 400, 500].map(pk => (
                        <SelectItem key={pk} value={pk.toString()}>{pk} pk</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-4 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {/* Paint Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Laksoort</Label>
                <div className="flex flex-wrap gap-2">
                  {PAINT_TYPES.map((paint) => (
                    <button
                      key={paint.value}
                      type="button"
                      onClick={() => toggleArrayFilter('paintTypes', paint.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                        filters.paintTypes?.includes(paint.value)
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {paint.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exterior Color */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kleur</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleArrayFilter('colors', color)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                        filters.colors?.includes(color)
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Interior */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Interieur</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERIOR_MATERIALS.map((mat) => (
                    <button
                      key={mat.value}
                      type="button"
                      onClick={() => toggleArrayFilter('interiorMaterials', mat.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                        filters.interiorMaterials?.includes(mat.value)
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {mat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Practical/Options Tab */}
        <TabsContent value="practical" className="mt-4 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {/* Doors & Seats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min. deuren</Label>
                  <Select value={filters.minDoors?.toString() || ''} onValueChange={(v) => updateFilter('minDoors', v && v !== 'none' ? parseInt(v) : undefined)}>
                    <SelectTrigger className="h-9 border-border/60 text-sm">
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="none">Alle</SelectItem>
                      {[2, 3, 4, 5].map(d => (
                        <SelectItem key={d} value={d.toString()}>{d}+ deuren</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min. zitplaatsen</Label>
                  <Select value={filters.minSeats?.toString() || ''} onValueChange={(v) => updateFilter('minSeats', v && v !== 'none' ? parseInt(v) : undefined)}>
                    <SelectTrigger className="h-9 border-border/60 text-sm">
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="none">Alle</SelectItem>
                      {[2, 4, 5, 7].map(s => (
                        <SelectItem key={s} value={s.toString()}>{s}+ zitplaatsen</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opties & Extra's</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                {(showAllFeatures ? FEATURE_OPTIONS : POPULAR_FEATURES).map((feature) => (
                  <div key={feature.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`hp-feat-${feature.value}`}
                      checked={filters.features?.includes(feature.value) || false}
                      onCheckedChange={() => toggleArrayFilter('features', feature.value)}
                      className="border-border h-4 w-4"
                    />
                    <Label 
                      htmlFor={`hp-feat-${feature.value}`} 
                      className="text-sm font-normal cursor-pointer text-foreground/80 hover:text-foreground transition-colors truncate"
                    >
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
              {FEATURE_OPTIONS.length > POPULAR_FEATURES.length && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="mt-2 text-muted-foreground hover:text-foreground gap-1 h-7"
                >
                  {showAllFeatures ? 'Minder opties' : `Meer opties (+${FEATURE_OPTIONS.length - POPULAR_FEATURES.length})`}
                  {showAllFeatures ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="mt-4 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {/* Country */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Land</Label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRY_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateFilter('country', filters.country === c.value ? undefined : c.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                        filters.country === c.value
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* City / Postal Code */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stad of postcode</Label>
                <Input
                  placeholder="Bijv. Amsterdam, 1012"
                  value={filters.postalCode || ''}
                  onChange={(e) => updateFilter('postalCode', e.target.value || undefined)}
                  className="h-9 border-border/60 text-sm"
                />
              </div>

              {/* Province */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provincie</Label>
                <Select value={filters.province || ''} onValueChange={(v) => updateFilter('province', v === 'all' ? undefined : v)}>
                  <SelectTrigger className="h-9 border-border/60 text-sm">
                    <SelectValue placeholder="Alle provincies" />
                  </SelectTrigger>
                  <SelectContent className="bg-card max-h-64">
                    <SelectItem value="all">Alle provincies</SelectItem>
                    {PROVINCES.map((prov) => (
                      <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {/* Radius */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zoekstraal</Label>
                <Select value={filters.radius?.toString() || ''} onValueChange={(v) => updateFilter('radius', v && v !== 'none' ? parseInt(v) : undefined)}>
                  <SelectTrigger className="h-9 border-border/60 text-sm">
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

              {/* Online Since */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Online sinds</Label>
                <Select value={filters.onlineSince || ''} onValueChange={(v) => updateFilter('onlineSince', v === 'all' ? undefined : v as any)}>
                  <SelectTrigger className="h-9 border-border/60 text-sm">
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
          </div>
        </TabsContent>

        {/* History/Trust Tab */}
        <TabsContent value="history" className="mt-4 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {/* Seller Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type verkoper</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'dealer' as const, label: 'Dealer' },
                    { value: 'private' as const, label: 'Particulier' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateFilter('sellerType', filters.sellerType === type.value ? undefined : type.value)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                        filters.sellerType === type.value
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Previous Owners */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max. eigenaren</Label>
                <Select value={filters.maxPreviousOwners?.toString() || ''} onValueChange={(v) => updateFilter('maxPreviousOwners', v && v !== 'none' ? parseInt(v) : undefined)}>
                  <SelectTrigger className="h-9 border-border/60 text-sm">
                    <SelectValue placeholder="Maakt niet uit" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="none">Maakt niet uit</SelectItem>
                    {[1, 2, 3].map(n => (
                      <SelectItem key={n} value={n.toString()}>Max. {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Warranty */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Garantie</Label>
                <Select value={filters.minWarranty || ''} onValueChange={(v) => updateFilter('minWarranty', v === 'none' ? undefined : v as any)}>
                  <SelectTrigger className="h-9 border-border/60 text-sm">
                    <SelectValue placeholder="Maakt niet uit" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="none">Maakt niet uit</SelectItem>
                    {WARRANTY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {/* Trust toggles */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hp-no-damage" className="text-sm font-normal cursor-pointer">Geen schadehistorie</Label>
                  <Switch
                    id="hp-no-damage"
                    checked={filters.noDamageHistory || false}
                    onCheckedChange={(checked) => updateFilter('noDamageHistory', checked || undefined)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hp-maintenance" className="text-sm font-normal cursor-pointer">Onderhoudsboekje</Label>
                  <Switch
                    id="hp-maintenance"
                    checked={filters.hasMaintenanceHistory || false}
                    onCheckedChange={(checked) => updateFilter('hasMaintenanceHistory', checked || undefined)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hp-nonsmoker" className="text-sm font-normal cursor-pointer">Niet-roker auto</Label>
                  <Switch
                    id="hp-nonsmoker"
                    checked={filters.isNonSmoker || false}
                    onCheckedChange={(checked) => updateFilter('isNonSmoker', checked || undefined)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hp-vat" className="text-sm font-normal cursor-pointer">BTW aftrekbaar</Label>
                  <Switch
                    id="hp-vat"
                    checked={filters.vatDeductible || false}
                    onCheckedChange={(checked) => updateFilter('vatDeductible', checked || undefined)}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

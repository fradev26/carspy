import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, RotateCcw, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CAR_BRANDS, CAR_MODELS, FUEL_TYPES, SearchFilters } from '@/types/listing';
import { cn } from '@/lib/utils';
import { HomepageFilters } from './HomepageFilters';
import { FilterChips } from './FilterChips';
import { RecentSearches } from '@/components/RecentSearches';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

export function SearchBar({ variant = 'compact', className }: SearchBarProps) {
  const navigate = useNavigate();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [fuelType, setFuelType] = useState('');
  
  // Advanced filters state
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Recent searches
  const { recentSearches, saveSearch, removeSearch, clearAllSearches } = useRecentSearches();

  // Saved searches (zoekalerts)
  const { user } = useAuth();
  const { save } = useSavedSearches();
  const [saveOpen, setSaveOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync basic form fields to filters
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      brand: brand && brand !== 'all' ? brand : undefined,
      model: model || undefined,
      maxPrice: maxPrice && maxPrice !== 'none' ? parseInt(maxPrice) : undefined,
      minYear: minYear && minYear !== 'none' ? parseInt(minYear) : undefined,
      fuelTypes: fuelType && fuelType !== 'all' ? [fuelType as any] : undefined,
    }));
  }, [brand, model, maxPrice, minYear, fuelType]);

  // Sync filters back to form fields
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    // Update form fields from filters
    if (newFilters.brand !== filters.brand) {
      setBrand(newFilters.brand || '');
    }
    if (newFilters.model !== filters.model) {
      setModel(newFilters.model || '');
    }
    if (newFilters.maxPrice !== filters.maxPrice) {
      setMaxPrice(newFilters.maxPrice?.toString() || '');
    }
    if (newFilters.minYear !== filters.minYear) {
      setMinYear(newFilters.minYear?.toString() || '');
    }
    if (JSON.stringify(newFilters.fuelTypes) !== JSON.stringify(filters.fuelTypes)) {
      setFuelType(newFilters.fuelTypes?.[0] || '');
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    
    // Add all active filters to URL params
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
    if (filters.paintTypes?.length) params.set('paintTypes', filters.paintTypes.join(','));
    if (filters.colors?.length) params.set('colors', filters.colors.join(','));
    if (filters.interiorMaterials?.length) params.set('interiorMaterials', filters.interiorMaterials.join(','));
    if (filters.minDoors) params.set('minDoors', filters.minDoors.toString());
    if (filters.minSeats) params.set('minSeats', filters.minSeats.toString());
    if (filters.province) params.set('province', filters.province);
    if (filters.radius) params.set('radius', filters.radius.toString());
    if (filters.onlineSince) params.set('onlineSince', filters.onlineSince);
    if (filters.country) params.set('country', filters.country);
    if (filters.postalCode) params.set('postalCode', filters.postalCode);
    if (filters.sellerType) params.set('sellerType', filters.sellerType);
    if (filters.maxPreviousOwners) params.set('maxPreviousOwners', filters.maxPreviousOwners.toString());
    if (filters.minWarranty) params.set('minWarranty', filters.minWarranty);
    if (filters.noDamageHistory) params.set('noDamageHistory', 'true');
    if (filters.vatDeductible) params.set('vatDeductible', 'true');
    if (filters.hasMaintenanceHistory) params.set('hasMaintenanceHistory', 'true');
    if (filters.isNonSmoker) params.set('isNonSmoker', 'true');
    if (filters.features?.length) params.set('features', filters.features.join(','));
    
    // Save to recent searches
    saveSearch(filters);
    
    navigate(`/zoeken?${params.toString()}`);
  };

  const handleRemoveFilter = (key: keyof SearchFilters, value?: string) => {
    const arrayKeys = ['fuelTypes', 'transmissions', 'bodyTypes', 'driveTypes', 'paintTypes', 'colors', 'interiorMaterials', 'features'];
    
    if (value && arrayKeys.includes(key)) {
      const currentValues = filters[key] as string[] | undefined;
      handleFiltersChange({
        ...filters,
        [key]: currentValues?.filter(v => v !== value),
      });
    } else {
      const newFilters = { ...filters };
      delete newFilters[key];
      if (key === 'minPrice') delete newFilters.maxPrice;
      if (key === 'minYear') delete newFilters.maxYear;
      if (key === 'minMileage') delete newFilters.maxMileage;
      if (key === 'minPower') delete newFilters.maxPower;
      handleFiltersChange(newFilters);
    }
  };

  const clearAllFilters = () => {
    setBrand('');
    setModel('');
    setMaxPrice('');
    setMinYear('');
    setFuelType('');
    handleFiltersChange({});
  };

  // Count active advanced filters (beyond basic form fields)
  const advancedFilterCount = [
    filters.minMileage || filters.maxMileage,
    filters.bodyTypes?.length,
    filters.transmissions?.length,
    filters.driveTypes?.length,
    filters.minPower || filters.maxPower,
    filters.paintTypes?.length,
    filters.colors?.length,
    filters.interiorMaterials?.length,
    filters.minDoors,
    filters.minSeats,
    filters.country,
    filters.postalCode,
    filters.province,
    filters.onlineSince,
    filters.sellerType,
    filters.maxPreviousOwners,
    filters.minWarranty,
    filters.noDamageHistory,
    filters.vatDeductible,
    filters.hasMaintenanceHistory,
    filters.isNonSmoker,
    filters.features?.length,
  ].filter(Boolean).length;

  // Total filter count
  const totalFilterCount = [
    filters.brand,
    filters.model,
    filters.minPrice || filters.maxPrice,
    filters.minYear || filters.maxYear,
    filters.fuelTypes?.length,
  ].filter(Boolean).length + advancedFilterCount;

  // Get available models based on selected brand
  const availableModels = brand && brand !== 'all' ? CAR_MODELS[brand] || [] : [];

  // Suggested alert name from filters
  const suggestName = (): string => {
    const parts: string[] = [];
    if (filters.brand) parts.push(filters.brand);
    if (filters.model) parts.push(filters.model);
    if (filters.fuelTypes?.length) parts.push(filters.fuelTypes[0]);
    if (filters.maxPrice) parts.push(`onder €${filters.maxPrice.toLocaleString('nl-NL')}`);
    else if (filters.minPrice) parts.push(`vanaf €${filters.minPrice.toLocaleString('nl-NL')}`);
    if (!parts.length) return 'Mijn zoekopdracht';
    return parts.join(' ');
  };

  const openSaveDialog = () => {
    if (!user) {
      toast({
        title: 'Log in om zoekopdrachten te bewaren',
        description: 'Maak een gratis account aan of meld je aan.',
      });
      navigate('/auth');
      return;
    }
    if (totalFilterCount === 0) {
      toast({ title: 'Voeg eerst filters toe voordat je opslaat', variant: 'destructive' });
      return;
    }
    setSearchName(suggestName());
    setSaveOpen(true);
  };

  const handleSave = async () => {
    const name = searchName.trim();
    if (!name) return;
    setSaving(true);
    await save(name, filters);
    setSaving(false);
    setSaveOpen(false);
    setSearchName('');
  };

  // Combined 80/20 control: "Toon resultaten" + "Zoekopdracht opslaan"
  const SearchActions = ({ size = 'lg' }: { size?: 'lg' | 'md' }) => {
    const h = size === 'lg' ? 'h-12' : 'h-10';
    return (
      <div className={cn('flex w-full items-stretch', h)}>
        <Button
          type="button"
          onClick={() => handleSearch()}
          className={cn(
            'flex-[4] gap-2 rounded-r-none border-r-0 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:z-10',
            h,
          )}
        >
          <Search className="h-5 w-5" />
          <span className="truncate">Toon resultaten</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={openSaveDialog}
          aria-label="Zoekopdracht opslaan"
          title="Zoekopdracht opslaan"
          className={cn(
            '-ml-px flex-[1] gap-1.5 rounded-l-none border-border/60 px-2 text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:z-10',
            h,
          )}
        >
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">Opslaan</span>
        </Button>
      </div>
    );
  };


  if (variant === 'hero') {
    return (
      <div className={cn('w-full', className)}>
        <form onSubmit={handleSearch}>
          <div className="rounded-lg border border-border/60 bg-card p-6 shadow-card">
            <div className="grid gap-4 md:grid-cols-5 md:gap-3">
              {/* Brand */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Merk</label>
                <Select value={brand} onValueChange={(v) => { setBrand(v); setModel(''); }}>
                  <SelectTrigger className="h-12 bg-background border-border/60">
                    <SelectValue placeholder="Alle merken" />
                  </SelectTrigger>
                  <SelectContent className="bg-card max-h-72">
                    <SelectItem value="all">Alle merken</SelectItem>
                    {CAR_BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model - Dynamic based on brand */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Model</label>
                {brand && brand !== 'all' && availableModels.length > 0 ? (
                  <Select value={model || 'all'} onValueChange={(v) => setModel(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-12 bg-background border-border/60">
                      <SelectValue placeholder="Alle modellen" />
                    </SelectTrigger>
                    <SelectContent className="bg-card max-h-72">
                      <SelectItem value="all">Alle modellen</SelectItem>
                      {availableModels.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    placeholder="Bijv. Golf, 3-serie..."
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-12 bg-background border-border/60"
                  />
                )}
              </div>

              {/* Year */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Bouwjaar vanaf</label>
                <Select value={minYear} onValueChange={setMinYear}>
                  <SelectTrigger className="h-12 bg-background border-border/60">
                    <SelectValue placeholder="Alle jaren" />
                  </SelectTrigger>
                  <SelectContent className="bg-card max-h-64">
                    <SelectItem value="none">Alle jaren</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Max. prijs</label>
                <Select value={maxPrice} onValueChange={setMaxPrice}>
                  <SelectTrigger className="h-12 bg-background border-border/60">
                    <SelectValue placeholder="Geen maximum" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="none">Geen maximum</SelectItem>
                    <SelectItem value="10000">€ 10.000</SelectItem>
                    <SelectItem value="15000">€ 15.000</SelectItem>
                    <SelectItem value="20000">€ 20.000</SelectItem>
                    <SelectItem value="25000">€ 25.000</SelectItem>
                    <SelectItem value="30000">€ 30.000</SelectItem>
                    <SelectItem value="40000">€ 40.000</SelectItem>
                    <SelectItem value="50000">€ 50.000</SelectItem>
                    <SelectItem value="75000">€ 75.000</SelectItem>
                    <SelectItem value="100000">€ 100.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search + Save combined control (80/20) */}
              <div className="flex items-end">
                <SearchActions size="lg" />
              </div>
            </div>
            
            {/* Bottom row: Fuel type filters + More filters toggle */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {/* Quick fuel type filters */}
              <div className="flex flex-wrap gap-2">
                {FUEL_TYPES.slice(0, 4).map((fuel) => (
                  <button
                    key={fuel.value}
                    type="button"
                    onClick={() => setFuelType(fuelType === fuel.value ? '' : fuel.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md border transition-all duration-200 focus-ring",
                      fuelType === fuel.value 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-background/50 text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {fuel.label}
                  </button>
                ))}
              </div>

              {/* More Filters Toggle */}
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="gap-2 bg-background/50 border-border/60 hover:bg-background hover:border-primary/50"
              >
                Meer filters
                {advancedFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 bg-accent text-accent-foreground">
                    {advancedFilterCount}
                  </Badge>
                )}
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {/* Active filter chips (when filters are collapsed) */}
            {!showAdvancedFilters && advancedFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <FilterChips
                  filters={filters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={clearAllFilters}
                />
              </div>
            )}

            {/* Recent Searches */}
            {!showAdvancedFilters && recentSearches.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <RecentSearches
                  searches={recentSearches}
                  onRemove={removeSearch}
                  onClearAll={clearAllSearches}
                />
              </div>
            )}
          </div>
        </form>

        {/* Expanded Advanced Filters - Using optimized HomepageFilters */}
        <Collapsible open={showAdvancedFilters}>
          <CollapsibleContent>
            <div className="mt-4 rounded-lg border border-border/60 bg-card p-6 shadow-card animate-fade-in">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/40">
                <h3 className="text-lg font-semibold text-foreground">Geavanceerde filters</h3>
                <div className="flex items-center gap-2">
                  {totalFilterCount > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-muted-foreground hover:text-foreground gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset alles
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Optimized tabbed filter layout */}
              <HomepageFilters 
                filters={filters} 
                onFiltersChange={handleFiltersChange}
              />

              {/* Search button at bottom of expanded filters */}
              <div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                <div className="text-sm text-muted-foreground">
                  {totalFilterCount > 0 && (
                    <span>{totalFilterCount} filter{totalFilterCount !== 1 ? 's' : ''} actief</span>
                  )}
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(false)}
                    className="sm:w-32"
                  >
                    Sluiten
                  </Button>
                  <div className="flex-1">
                    <SearchActions size="md" />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Save search dialog */}
        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zoekopdracht opslaan</DialogTitle>
              <DialogDescription>
                Geef je zoekopdracht een naam. Je ontvangt een melding zodra er nieuwe auto's
                bijkomen die hieraan voldoen. Je vindt opgeslagen zoekopdrachten terug onder
                "Mijn activiteiten".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="alert-name">Naam</Label>
                <Input
                  id="alert-name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Bijv. Zwarte BMW automaat"
                  className="mt-1.5"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                />
              </div>
              <Button
                className="w-full"
                disabled={!searchName.trim() || saving}
                onClick={handleSave}
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <form onSubmit={handleSearch} className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek op merk, model..."
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="pl-10 border-border/60"
        />
      </div>
      <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm">
        Zoeken
      </Button>
    </form>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CAR_BRANDS, CAR_MODELS, FUEL_TYPES, SearchFilters } from '@/types/listing';
import { cn } from '@/lib/utils';
import { FilterPanel } from './FilterPanel';
import { FilterChips } from './FilterChips';

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
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

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
    if (filters.province) params.set('province', filters.province);
    if (filters.sellerType) params.set('sellerType', filters.sellerType);
    if (filters.noDamageHistory) params.set('noDamageHistory', 'true');
    if (filters.vatDeductible) params.set('vatDeductible', 'true');
    if (filters.features?.length) params.set('features', filters.features.join(','));
    
    setIsFilterDialogOpen(false);
    setIsFilterSheetOpen(false);
    navigate(`/zoeken?${params.toString()}`);
  };

  const handleRemoveFilter = (key: keyof SearchFilters, value?: string) => {
    if (value && (key === 'fuelTypes' || key === 'transmissions' || key === 'bodyTypes' || key === 'driveTypes' || key === 'features')) {
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

  // Get available models based on selected brand
  const availableModels = brand && brand !== 'all' ? CAR_MODELS[brand] || [] : [];

  // Filter content component
  const FilterContent = () => (
    <ScrollArea className="h-[70vh] pr-4">
      <FilterPanel 
        filters={filters} 
        onFiltersChange={handleFiltersChange}
        showPresets={true}
      />
    </ScrollArea>
  );

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSearch} className={cn('w-full', className)}>
        <div className="glass rounded-2xl p-6 shadow-floating">
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
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-12 bg-background border-border/60">
                    <SelectValue placeholder="Alle modellen" />
                  </SelectTrigger>
                  <SelectContent className="bg-card max-h-72">
                    <SelectItem value="">Alle modellen</SelectItem>
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

            {/* Search Button */}
            <div className="flex items-end">
              <Button 
                type="submit" 
                size="lg" 
                className="h-12 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow-accent font-semibold"
              >
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">Zoeken</span>
              </Button>
            </div>
          </div>
          
          {/* Bottom row: Fuel type filters + More filters button */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {/* Quick fuel type filters */}
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.slice(0, 4).map((fuel) => (
                <button
                  key={fuel.value}
                  type="button"
                  onClick={() => setFuelType(fuelType === fuel.value ? '' : fuel.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                    fuelType === fuel.value 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-background/50 text-foreground/70 border-border/60 hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {fuel.label}
                </button>
              ))}
            </div>

            {/* More Filters Button - Desktop (Dialog) */}
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button"
                  variant="outline" 
                  className="hidden md:flex gap-2 bg-background/50 border-border/60 hover:bg-background hover:border-primary/50"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Meer filters
                  {advancedFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 bg-accent text-accent-foreground">
                      {advancedFilterCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
                  <DialogTitle className="text-xl">Geavanceerde filters</DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4">
                  <FilterContent />
                </div>
                <div className="px-6 py-4 border-t border-border/60 flex justify-between items-center bg-muted/30">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => handleFiltersChange({})}
                    className="text-muted-foreground"
                  >
                    Wis alle filters
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => handleSearch()}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Toon resultaten
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* More Filters Button - Mobile (Sheet) */}
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  type="button"
                  variant="outline" 
                  className="md:hidden gap-2 bg-background/50 border-border/60"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {advancedFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 bg-accent text-accent-foreground">
                      {advancedFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                <SheetHeader className="pb-4 border-b border-border/60">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4 overflow-y-auto h-[calc(85vh-140px)]">
                  <FilterPanel 
                    filters={filters} 
                    onFiltersChange={handleFiltersChange}
                    showPresets={true}
                  />
                </div>
                <div className="py-4 border-t border-border/60 flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleFiltersChange({})}
                    className="flex-1"
                  >
                    Wis alles
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => handleSearch()}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Zoeken
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active filter chips */}
          {advancedFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <FilterChips
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={() => handleFiltersChange({})}
              />
            </div>
          )}
        </div>
      </form>
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

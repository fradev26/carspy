import { useState, useMemo, useEffect, useTransition } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { Grid, List, SlidersHorizontal, Car, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { FilterPanel, FilterChips, SmartSearchBar } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { useListings } from '@/hooks/useListings';
import {
  SearchFilters,
  SORT_OPTIONS,
  BodyType,
  FuelType,
  TransmissionType,
  DriveType,
  PaintType,
  InteriorMaterial,
  OnlineSince,
  WarrantyOption,
  CAR_BRANDS,
  CAR_MODELS,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from '@/types/listing';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Helper to parse URL params into SearchFilters
function parseFiltersFromURL(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};

  // Basic filters
  const brand = searchParams.get('brand');
  if (brand) filters.brand = brand;

  const model = searchParams.get('model');
  if (model) filters.model = model;

  const minPrice = searchParams.get('minPrice');
  if (minPrice) filters.minPrice = parseInt(minPrice);

  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) filters.maxPrice = parseInt(maxPrice);

  const minYear = searchParams.get('minYear');
  if (minYear) filters.minYear = parseInt(minYear);

  const maxYear = searchParams.get('maxYear');
  if (maxYear) filters.maxYear = parseInt(maxYear);

  const minMileage = searchParams.get('minMileage');
  if (minMileage) filters.minMileage = parseInt(minMileage);

  const maxMileage = searchParams.get('maxMileage');
  if (maxMileage) filters.maxMileage = parseInt(maxMileage);

  // Array filters
  const fuelTypes = searchParams.get('fuelTypes');
  if (fuelTypes) filters.fuelTypes = fuelTypes.split(',') as FuelType[];
  
  // Legacy single fuelType support
  const fuelType = searchParams.get('fuelType');
  if (fuelType && !fuelTypes) filters.fuelTypes = [fuelType as FuelType];

  const bodyTypes = searchParams.get('bodyTypes');
  if (bodyTypes) filters.bodyTypes = bodyTypes.split(',') as BodyType[];
  
  // Legacy single bodyType support
  const bodyType = searchParams.get('bodyType');
  if (bodyType && !bodyTypes) filters.bodyTypes = [bodyType as BodyType];

  const transmissions = searchParams.get('transmissions');
  if (transmissions) filters.transmissions = transmissions.split(',') as TransmissionType[];

  const driveTypes = searchParams.get('driveTypes');
  if (driveTypes) filters.driveTypes = driveTypes.split(',') as DriveType[];

  // Performance filters
  const minPower = searchParams.get('minPower');
  if (minPower) filters.minPower = parseInt(minPower);

  const maxPower = searchParams.get('maxPower');
  if (maxPower) filters.maxPower = parseInt(maxPower);

  // Appearance filters
  const paintTypes = searchParams.get('paintTypes');
  if (paintTypes) filters.paintTypes = paintTypes.split(',') as PaintType[];

  const colors = searchParams.get('colors');
  if (colors) filters.colors = colors.split(',');

  const interiorMaterials = searchParams.get('interiorMaterials');
  if (interiorMaterials) filters.interiorMaterials = interiorMaterials.split(',') as InteriorMaterial[];

  // Practical filters
  const minDoors = searchParams.get('minDoors');
  if (minDoors) filters.minDoors = parseInt(minDoors);

  const minSeats = searchParams.get('minSeats');
  if (minSeats) filters.minSeats = parseInt(minSeats);

  // Location filters
  const province = searchParams.get('province');
  if (province) filters.province = province;

  const radius = searchParams.get('radius');
  if (radius) filters.radius = parseInt(radius);

  const country = searchParams.get('country');
  if (country) filters.country = country;

  const postalCode = searchParams.get('postalCode');
  if (postalCode) filters.postalCode = postalCode;

  const onlineSince = searchParams.get('onlineSince');
  if (onlineSince) filters.onlineSince = onlineSince as OnlineSince;

  // History filters
  const sellerType = searchParams.get('sellerType');
  if (sellerType) filters.sellerType = sellerType as 'private' | 'dealer';

  const maxPreviousOwners = searchParams.get('maxPreviousOwners');
  if (maxPreviousOwners) filters.maxPreviousOwners = parseInt(maxPreviousOwners);

  const minWarranty = searchParams.get('minWarranty');
  if (minWarranty) filters.minWarranty = minWarranty as WarrantyOption;

  const noDamageHistory = searchParams.get('noDamageHistory');
  if (noDamageHistory === 'true') filters.noDamageHistory = true;

  const vatDeductible = searchParams.get('vatDeductible');
  if (vatDeductible === 'true') filters.vatDeductible = true;

  const hasMaintenanceHistory = searchParams.get('hasMaintenanceHistory');
  if (hasMaintenanceHistory === 'true') filters.hasMaintenanceHistory = true;

  const isNonSmoker = searchParams.get('isNonSmoker');
  if (isNonSmoker === 'true') filters.isNonSmoker = true;

  // Feature filters
  const features = searchParams.get('features');
  if (features) filters.features = features.split(',');

  return filters;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>(() => parseFiltersFromURL(searchParams));
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const { save } = useSavedSearches();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 24;
  const { listings: allListings, loading: listingsLoading } = useListings();
  const [mobileResultsRevealed, setMobileResultsRevealed] = useState(false);

  // Update filters when URL params change
  useEffect(() => {
    const newFilters = parseFiltersFromURL(searchParams);
    setFilters(newFilters);
  }, [searchParams]);

  // Simulate loading when filters change
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setIsLoading(true);
    setPage(1);
    startTransition(() => {
      setFilters(newFilters);
      setTimeout(() => setIsLoading(false), 300);
    });
  };

  const handleSortChange = (value: string) => {
    setIsLoading(true);
    startTransition(() => {
      setSortBy(value);
      setTimeout(() => setIsLoading(false), 200);
    });
  };

  const filteredListings = useMemo(() => {
    let results = [...allListings];

    // Free-text query from URL (?q=...)
    const query = searchParams.get('q')?.toLowerCase().trim();
    if (query) {
      results = results.filter(l =>
        l.title.toLowerCase().includes(query) ||
        l.brand.toLowerCase().includes(query) ||
        l.model.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query)
      );
    }

    // Basic filters
    if (filters.brand && filters.brand !== 'all') {
      results = results.filter(l => l.brand === filters.brand);
    }
    if (filters.model) {
      results = results.filter(l => l.model === filters.model);
    }
    if (filters.minPrice) {
      results = results.filter(l => l.price >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      results = results.filter(l => l.price <= filters.maxPrice!);
    }
    if (filters.minYear) {
      results = results.filter(l => l.year >= filters.minYear!);
    }
    if (filters.maxYear) {
      results = results.filter(l => l.year <= filters.maxYear!);
    }
    if (filters.minMileage) {
      results = results.filter(l => l.mileage >= filters.minMileage!);
    }
    if (filters.maxMileage) {
      results = results.filter(l => l.mileage <= filters.maxMileage!);
    }
    if (filters.fuelTypes?.length) {
      results = results.filter(l => filters.fuelTypes!.includes(l.fuelType));
    }
    if (filters.bodyTypes?.length) {
      results = results.filter(l => filters.bodyTypes!.includes(l.bodyType));
    }

    // Performance filters
    if (filters.transmissions?.length) {
      results = results.filter(l => filters.transmissions!.includes(l.transmission));
    }
    if (filters.driveTypes?.length) {
      results = results.filter(l => l.driveType && filters.driveTypes!.includes(l.driveType));
    }
    if (filters.minPower) {
      results = results.filter(l => l.power >= filters.minPower!);
    }
    if (filters.maxPower) {
      results = results.filter(l => l.power <= filters.maxPower!);
    }

    // Appearance filters
    if (filters.paintTypes?.length) {
      results = results.filter(l => l.paintType && filters.paintTypes!.includes(l.paintType));
    }
    if (filters.colors?.length) {
      results = results.filter(l => filters.colors!.includes(l.color));
    }
    if (filters.interiorMaterials?.length) {
      results = results.filter(l => l.interiorMaterial && filters.interiorMaterials!.includes(l.interiorMaterial));
    }

    // Practical filters
    if (filters.minDoors) {
      results = results.filter(l => l.doors >= filters.minDoors!);
    }
    if (filters.minSeats) {
      results = results.filter(l => l.seats >= filters.minSeats!);
    }

    // Location filters
    if (filters.province) {
      results = results.filter(l => l.location.province === filters.province);
    }

    // History filters
    if (filters.sellerType) {
      results = results.filter(l => l.seller.type === filters.sellerType);
    }
    if (filters.maxPreviousOwners) {
      results = results.filter(l => l.previousOwners !== undefined && l.previousOwners <= filters.maxPreviousOwners!);
    }
    if (filters.noDamageHistory) {
      results = results.filter(l => l.hasDamageHistory === false);
    }
    if (filters.vatDeductible) {
      results = results.filter(l => l.vatDeductible === true);
    }
    if (filters.hasMaintenanceHistory) {
      results = results.filter(l => l.hasMaintenanceHistory === true);
    }
    if (filters.isNonSmoker) {
      results = results.filter(l => l.isNonSmoker === true);
    }

    // Feature filters
    if (filters.features?.length) {
      results = results.filter(l => 
        filters.features!.every(f => l.features.includes(f))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'mileage-asc':
        results.sort((a, b) => a.mileage - b.mileage);
        break;
      case 'year-desc':
        results.sort((a, b) => b.year - a.year);
        break;
    }

    // Premium & boosted listings always on top
    const now = new Date();
    results.sort((a, b) => {
      const aIsPremium = a.isPremium || (a.boostUntil && new Date(a.boostUntil) > now);
      const bIsPremium = b.isPremium || (b.boostUntil && new Date(b.boostUntil) > now);
      if (aIsPremium && !bIsPremium) return -1;
      if (!aIsPremium && bIsPremium) return 1;
      return 0;
    });

    return results;
  }, [filters, sortBy, allListings]);

  const handleRemoveFilter = (key: keyof SearchFilters, value?: string) => {
    const arrayKeys = ['fuelTypes', 'transmissions', 'bodyTypes', 'driveTypes', 'paintTypes', 'colors', 'interiorMaterials', 'features'];
    
    if (value && arrayKeys.includes(key)) {
      const currentValues = filters[key] as string[] | undefined;
      setFilters({
        ...filters,
        [key]: currentValues?.filter(v => v !== value),
      });
    } else {
      const newFilters = { ...filters };
      delete newFilters[key];
      // Clear paired filters
      if (key === 'minPrice') delete newFilters.maxPrice;
      if (key === 'minYear') delete newFilters.maxYear;
      if (key === 'minMileage') delete newFilters.maxMileage;
      if (key === 'minPower') delete newFilters.maxPower;
      setFilters(newFilters);
    }
  };

  // Count total active filters
  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
  }).length;

  // Mobile filter-first gate: show fullscreen filters until user reveals results
  const hasIncomingIntent =
    !!searchParams.get('q') ||
    !!searchParams.get('aiIntent') ||
    activeFilterCount > 0;
  const showMobileResults = mobileResultsRevealed || hasIncomingIntent;




  const updateFilterValue = (key: keyof SearchFilters, value: string | number | undefined) => {
    const next = { ...filters };
    if (value === undefined || value === '' || value === 'all') {
      delete next[key];
    } else {
      (next as Record<string, unknown>)[key] = value;
    }
    handleFiltersChange(next);
  };

  const updateArrayFilter = <K extends 'fuelTypes' | 'transmissions'>(key: K, value: string) => {
    const next = { ...filters };
    if (!value || value === 'all') {
      delete next[key];
    } else {
      (next as Record<string, unknown>)[key] = [value];
    }
    handleFiltersChange(next);
  };


  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Auto's zoeken - VATUUR."
        description="Zoek en filter tweedehands auto's op merk, prijs, bouwjaar, kilometerstand en meer. Vind jouw perfecte occasion."
        canonical="https://vatuur.nl/zoeken"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vatuur.nl/" },
            { "@type": "ListItem", "position": 2, "name": "Zoeken", "item": "https://vatuur.nl/zoeken" }
          ]
        }}
      />
      <div className="container py-6">
        <div className="flex gap-8">
          {/* Desktop Filters - Sticky Sidebar */}
          <aside className="hidden w-72 flex-shrink-0 lg:block">
            <div className="sticky top-20">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-card max-h-[calc(100vh-6rem)] overflow-y-auto">
                <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6">


              {/* AI Search Bar / Intent Banner - desktop only */}
              <div className="hidden lg:block">
                {searchParams.get('aiIntent') ? (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 p-4">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {searchParams.get('aiIntent')}
                      </p>
                      {searchParams.get('aiQuery') && (
                        <p className="mt-0.5 text-xs text-muted-foreground italic truncate">
                          Je vraag: "{searchParams.get('aiQuery')}"
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete('aiIntent');
                        next.delete('aiQuery');
                        navigate(`/zoeken?${next.toString()}`);
                      }}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      Klassiek zoeken
                    </Button>
                  </div>
                ) : (
                  <div className="mb-5">
                    <SmartSearchBar variant="compact" />
                  </div>
                )}
              </div>


              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold md:text-3xl">Auto's zoeken</h1>
                  <p className="mt-1 text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredListings.length}</span> resultaten gevonden
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Save Search */}
                  {user && activeFilterCount > 0 && (
                    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 border-border/60">
                          <Bell className="h-4 w-4" />
                          <span className="hidden sm:inline">Bewaar zoekopdracht</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Zoekopdracht opslaan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Naam</Label>
                            <Input
                              value={searchName}
                              onChange={(e) => setSearchName(e.target.value)}
                              placeholder="Bijv. Zwarte BMW automaat"
                              className="mt-1.5"
                            />
                          </div>
                          <Button
                            className="w-full"
                            disabled={!searchName.trim()}
                            onClick={async () => {
                              await save(searchName.trim(), filters);
                              setSearchName('');
                              setSaveDialogOpen(false);
                            }}
                          >
                            Opslaan
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Mobile Filter Button - Drawer */}
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button
                        variant="outline"
                        className="lg:hidden gap-2 border-border/60 min-h-12 px-4 text-sm font-semibold"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 bg-accent text-accent-foreground">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[90vh]">
                      <DrawerHeader className="border-b border-border/60">
                        <DrawerTitle className="flex items-center justify-between">
                          <span>Filters</span>
                          <div className="flex items-center gap-2">
                            {activeFilterCount > 0 && (
                              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                                {activeFilterCount} actief
                              </Badge>
                            )}
                          </div>
                        </DrawerTitle>
                      </DrawerHeader>
                      {activeFilterCount > 0 && (
                        <div className="px-4 pt-4">
                          <Button
                            variant="outline"
                            className="w-full min-h-12 gap-2 border-dashed border-border/60 text-muted-foreground hover:text-foreground"
                            onClick={() => handleFiltersChange({})}
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                            Wis alle filters
                          </Button>
                        </div>
                      )}
                      <div className="overflow-y-auto px-4 py-4">
                        <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} />
                      </div>
                      <DrawerFooter className="border-t border-border/60 flex-row gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 min-h-12"
                          onClick={() => handleFiltersChange({})}
                          disabled={activeFilterCount === 0}
                        >
                          Wis alles
                        </Button>
                        <DrawerClose asChild>
                          <Button className="flex-1 min-h-12">
                            Toon {filteredListings.length} resultaten
                          </Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-44 border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Mode */}
                  <div className="hidden items-center rounded-lg border border-border/60 p-1 sm:flex bg-muted/30">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            <div>
              <FilterChips
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={() => handleFiltersChange({})}
              />
            </div>

            {/* Results */}
            <div className="mt-6">

              {isLoading || isPending || listingsLoading ? (
                <div className={viewMode === 'grid' 
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" 
                  : "flex flex-col gap-4"
                }>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard 
                      key={i} 
                      variant={viewMode === 'list' ? 'horizontal' : 'default'}
                      className="animate-fade-in"
                      style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
                    />
                  ))}
                </div>
              ) : filteredListings.length > 0 ? (
                <>
                  <ListingGrid listings={filteredListings.slice((page - 1) * perPage, page * perPage)} variant={viewMode} columns={3} />
                  
                  {/* Pagination */}
                  {filteredListings.length > perPage && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="border-border/60"
                      >
                        Vorige
                      </Button>
                      {Array.from({ length: Math.min(Math.ceil(filteredListings.length / perPage), 7) }, (_, i) => {
                        const totalPages = Math.ceil(filteredListings.length / perPage);
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (page <= 4) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = page - 3 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className={cn("w-9 h-9", page !== pageNum && "border-border/60")}
                            onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= Math.ceil(filteredListings.length / perPage)}
                        onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="border-border/60"
                      >
                        Volgende
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted mb-4">
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Geen resultaten gevonden</h3>
                  <p className="mt-2 text-muted-foreground max-w-sm">
                    Probeer andere filters of pas je zoekcriteria aan om meer auto's te vinden
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => handleFiltersChange({})}
                  >
                    Wis alle filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

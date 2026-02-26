import { useState, useMemo, useEffect, useTransition } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Grid, List, SlidersHorizontal, Car, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { FilterPanel, FilterChips } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { mockListings } from '@/data/mockListings';
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
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() => parseFiltersFromURL(searchParams));
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const { save } = useSavedSearches();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');

  // Update filters when URL params change
  useEffect(() => {
    const newFilters = parseFiltersFromURL(searchParams);
    setFilters(newFilters);
  }, [searchParams]);

  // Simulate loading when filters change
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setIsLoading(true);
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
    let results = [...mockListings];

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
  }, [filters, sortBy]);

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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Auto's zoeken - AutoSpy"
        description="Zoek en filter tweedehands auto's op merk, prijs, bouwjaar, kilometerstand en meer. Vind jouw perfecte occasion."
        canonical="https://autospy.nl/zoeken"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://autospy.nl/" },
            { "@type": "ListItem", "position": 2, "name": "Zoeken", "item": "https://autospy.nl/zoeken" }
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

                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden gap-2 border-border/60">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 bg-accent text-accent-foreground">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} />
                      </div>
                    </SheetContent>
                  </Sheet>

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
            <FilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={() => handleFiltersChange({})}
            />

            {/* Results */}
            <div className="mt-6">
              {isLoading || isPending ? (
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
                <ListingGrid listings={filteredListings} variant={viewMode} columns={3} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
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

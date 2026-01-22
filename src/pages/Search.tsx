import { useState, useMemo, useEffect, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, SlidersHorizontal, ChevronDown, ChevronUp, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { FilterPanel, FilterChips } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { mockListings } from '@/data/mockListings';
import { SearchFilters, SORT_OPTIONS, BodyType } from '@/types/listing';
import { SkeletonCard } from '@/components/ui/skeleton-card';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    brand: searchParams.get('brand') || undefined,
    model: searchParams.get('model') || undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    bodyTypes: searchParams.get('bodyType') ? [searchParams.get('bodyType') as BodyType] : undefined,
  }));
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Simulate loading when filters change
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setIsLoading(true);
    startTransition(() => {
      setFilters(newFilters);
      // Simulate network delay for UX polish
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

  // Update filters when URL params change
  useEffect(() => {
    const bodyType = searchParams.get('bodyType');
    if (bodyType) {
      setFilters(prev => ({
        ...prev,
        bodyTypes: [bodyType as BodyType],
      }));
    }
  }, [searchParams]);

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

    return results;
  }, [filters, sortBy]);

  const handleRemoveFilter = (key: keyof SearchFilters, value?: string) => {
    if (value && (key === 'fuelTypes' || key === 'transmissions' || key === 'bodyTypes')) {
      const currentValues = filters[key] as string[] | undefined;
      setFilters({
        ...filters,
        [key]: currentValues?.filter(v => v !== value),
      });
    } else {
      const newFilters = { ...filters };
      delete newFilters[key];
      if (key === 'minPrice') delete newFilters.maxPrice;
      if (key === 'minYear') delete newFilters.maxYear;
      setFilters(newFilters);
    }
  };

  // Count active advanced filters
  const advancedFilterCount = [
    filters.minYear || filters.maxYear,
    filters.maxMileage,
    filters.fuelTypes?.length,
    filters.transmissions?.length,
    filters.bodyTypes?.length,
  ].filter(Boolean).length;

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <div className="flex gap-8">
          {/* Desktop Filters - Sticky Sidebar */}
          <aside className="hidden w-72 flex-shrink-0 lg:block">
            <div className="sticky top-20">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-card">
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
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden gap-2 border-border/60">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {hasActiveFilters && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                            !
                          </span>
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

                  {/* Advanced Filters Toggle (Desktop) */}
                  <Button 
                    variant="outline" 
                    className="hidden lg:flex gap-2 border-border/60"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Meer filters
                    {advancedFilterCount > 0 && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                        {advancedFilterCount}
                      </span>
                    )}
                    {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

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

            {/* Advanced Filters Panel (Desktop - collapsible) */}
            <Collapsible open={showAdvancedFilters} className="hidden lg:block mb-6">
              <CollapsibleContent>
                <div className="rounded-xl border border-border/60 bg-card p-5 shadow-card">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <FilterPanel 
                      filters={filters} 
                      onFiltersChange={handleFiltersChange}
                      className="contents [&>*]:col-span-1 [&>h2]:hidden [&>button]:hidden"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Active Filters */}
            <FilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={() => handleFiltersChange({})}
            />

            {/* Results */}
            <div className="mt-6">
              {isLoading || isPending ? (
                // Skeleton loading state
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

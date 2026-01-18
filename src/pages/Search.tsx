import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { FilterPanel, FilterChips } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { mockListings } from '@/data/mockListings';
import { SearchFilters, SORT_OPTIONS, BodyType } from '@/types/listing';

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

    if (filters.brand && filters.brand !== 'all') {
      results = results.filter(l => l.brand === filters.brand);
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
    if (filters.maxMileage) {
      results = results.filter(l => l.mileage <= filters.maxMileage!);
    }
    if (filters.fuelTypes?.length) {
      results = results.filter(l => filters.fuelTypes!.includes(l.fuelType));
    }
    if (filters.transmissions?.length) {
      results = results.filter(l => filters.transmissions!.includes(l.transmission));
    }
    if (filters.bodyTypes?.length) {
      results = results.filter(l => filters.bodyTypes!.includes(l.bodyType));
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

  return (
    <div className="container py-6">
      <div className="flex gap-8">
        {/* Desktop Filters */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Auto's zoeken</h1>
              <p className="text-sm text-muted-foreground">{filteredListings.length} resultaten</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel filters={filters} onFiltersChange={setFilters} />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Advanced Filters Toggle (Desktop) */}
              <Button 
                variant="outline" 
                className="hidden lg:flex gap-2"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Meer filters
                {advancedFilterCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {advancedFilterCount}
                  </span>
                )}
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
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
              <div className="hidden items-center rounded-lg border p-1 sm:flex">
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

          {/* Advanced Filters Panel (Desktop - collapsible) */}
          <Collapsible open={showAdvancedFilters} className="hidden lg:block mb-6">
            <CollapsibleContent>
              <div className="rounded-lg border bg-card p-4">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <FilterPanel 
                    filters={filters} 
                    onFiltersChange={setFilters} 
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
            onClearAll={() => setFilters({})}
          />

          {/* Results */}
          <div className="mt-6">
            <ListingGrid listings={filteredListings} variant={viewMode} columns={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

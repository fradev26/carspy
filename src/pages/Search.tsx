import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FilterPanel, FilterChips } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { mockListings } from '@/data/mockListings';
import { SearchFilters, SORT_OPTIONS, Listing } from '@/types/listing';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    brand: searchParams.get('brand') || undefined,
    model: searchParams.get('model') || undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
  }));
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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

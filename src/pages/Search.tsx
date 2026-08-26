import { useState, useEffect, useTransition, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { Grid, List, SlidersHorizontal, Car, Sparkles, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { FilterPanel, FilterChips, SmartSearchBar } from '@/modules/search';
import { SaveSearchDialog, useSaveSearchGate } from '@/modules/search/SaveSearchDialog';
import { VirtualListingGrid } from '@/modules/listings/VirtualListingGrid';
import { InfiniteFeedFooter } from '@/components/InfiniteFeedFooter';
import { MarketCompareBanner } from '@/components/MarketCompareBanner';
import { useSearchListingsInfinite } from '@/hooks/useSearchListings';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { DEFAULT_PAGE_SIZE } from '@/lib/keyset';
import {
  SearchFilters,
  SORT_OPTIONS,
  CAR_BRANDS,
  CAR_MODELS,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from '@/types/listing';
import { parseFiltersFromURL, serializeFiltersToParams } from '@/lib/searchFilters';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { LiveStatus, LiveAlert } from '@/components/ui/live-status';


// Params we preserve through filter updates (not part of SearchFilters)
const PRESERVED_PARAMS = ['q', 'aiIntent', 'aiQuery', 'compareWith', 'sort'] as const;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const filters = useMemo(() => parseFiltersFromURL(searchParams), [searchParams]);
  const sortBy = searchParams.get('sort') || 'newest';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isPending, startTransition] = useTransition();
  const [aiBarOpen, setAiBarOpen] = useState(false);
  const queryParam = searchParams.get('q') ?? undefined;
  const {
    listings: pageListings,
    total,
    isLoading: listingsLoading,
    isStale: listingsStale,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: listingsError,
    refetch,
  } = useSearchListingsInfinite({
    filters,
    query: queryParam,
    sort: sortBy,
    limit: DEFAULT_PAGE_SIZE,
  });
  // Zolang een nieuwere filteraanvraag onderweg is tonen we geen definitieve tellingen.
  const resultsPending = listingsLoading || listingsStale;
  const [mobileResultsRevealed, setMobileResultsRevealed] = useState(false);
  const compareWithId = searchParams.get('compareWith');
  const referenceListing = compareWithId ? pageListings.find((l) => l.id === compareWithId) : undefined;

  // Keep scroll position + loaded batches when returning from a detail page.
  useScrollRestoration(
    `search:${searchParams.toString()}`,
    !listingsLoading && pageListings.length > 0,
  );

  // Write filters to URL (preserves q/ai/compareWith/sort)
  const writeFiltersToURL = (newFilters: SearchFilters) => {
    const next = new URLSearchParams();
    // Preserve non-filter params
    PRESERVED_PARAMS.forEach((k) => {
      const v = searchParams.get(k);
      if (v) next.set(k, v);
    });
    const serialized = serializeFiltersToParams(newFilters);
    Object.entries(serialized).forEach(([k, v]) => next.set(k, v));
    startTransition(() => {
      setSearchParams(next, { replace: false });
    });
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    writeFiltersToURL(newFilters);
  };

  const handleSortChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'newest') next.set('sort', value);
    else next.delete('sort');
    startTransition(() => setSearchParams(next, { replace: false }));
  };



  const handleRemoveFilter = (key: keyof SearchFilters, value?: string) => {
    const arrayKeys = ['fuelTypes', 'transmissions', 'bodyTypes', 'driveTypes', 'paintTypes', 'colors', 'interiorColors', 'interiorMaterials', 'features', 'brands', 'models', 'conditionTypes', 'emissionClasses'];

    if (value && arrayKeys.includes(key)) {
      const currentValues = filters[key] as string[] | undefined;
      const nextValues = currentValues?.filter((v) => v !== value);
      const next: SearchFilters = {
        ...filters,
        [key]: nextValues && nextValues.length ? nextValues : undefined,
      };
      // Een merk verwijderen haalt ook de modelselectie van dat merk weg.
      if (key === 'brands') {
        const rest = (filters.models ?? []).filter((m) => !m.startsWith(`${value}:`));
        next.models = rest.length ? rest : undefined;
      }
      writeFiltersToURL(next);
    } else {
      const newFilters = { ...filters };
      delete newFilters[key];
      if (key === 'minPrice') delete newFilters.maxPrice;
      if (key === 'minYear') delete newFilters.maxYear;
      if (key === 'minMileage') delete newFilters.maxMileage;
      if (key === 'minPower') delete newFilters.maxPower;
      writeFiltersToURL(newFilters);
    }

  };

  // Count total active filters
  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
  }).length;

  const saveGate = useSaveSearchGate(activeFilterCount);

  // Mobile filter-first gate: show fullscreen filters until user reveals results
  // Only auto-dismiss on incoming intent (homepage/AI search), NOT on filter changes —
  // the user must click "Toon alle resultaten" explicitly.
  const hasIncomingIntent =
    !!searchParams.get('q') ||
    !!searchParams.get('aiIntent');
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
        canonical="https://vatuur.be/zoeken"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vatuur.be/" },
            { "@type": "ListItem", "position": 2, "name": "Zoeken", "item": "https://vatuur.be/zoeken" }
          ]
        }}
      />
      <SaveSearchDialog open={saveGate.open} onOpenChange={saveGate.setOpen} filters={filters} />
      <div className="container py-6">
        <div className="flex gap-8">

          {/* Desktop Filters - Sticky Sidebar */}
          <aside className="hidden w-72 flex-shrink-0 lg:block">
            <div className="sticky top-20">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-card max-h-[calc(100vh-6rem)] overflow-y-auto">
                <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} query={queryParam} />
              </div>
            </div>
          </aside>

          {/* Mobile fullscreen filter gate */}
          {!showMobileResults && (
            <div className="lg:hidden w-full">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Auto's zoeken</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stel je filters in om het aanbod te ontdekken.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} showPresets={false} query={queryParam} />
              </div>
              <div className="sticky bottom-20 mt-4 flex flex-col gap-2 bg-gradient-to-t from-background via-background to-transparent pb-4 pr-16 pt-6 sm:pr-20">
                <Button
                  onClick={() => setMobileResultsRevealed(true)}
                  className="w-full min-h-12 text-base font-semibold"
                >
                  {resultsPending
                    ? 'Resultaten laden…'
                    : `Toon ${activeFilterCount > 0 ? `${total ?? 0} resultaten` : 'alle resultaten'}`}
                </Button>
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={saveGate.openSave}
                    className="w-full min-h-11 gap-2"
                  >
                    <Bell className="h-4 w-4" /> Opslaan als zoekalert
                  </Button>
                )}
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => handleFiltersChange({})}
                    className="w-full min-h-11 text-sm text-muted-foreground"
                  >
                    Wis alle filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={cn('flex-1', !showMobileResults && 'hidden lg:block')}>
            {/* Header */}
            <div className="mb-6">



              {/* AI Search Bar / Intent Banner - desktop only */}
              <div className="hidden lg:block">
                {searchParams.get('aiIntent') ? (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 p-4">
                    <Sparkles className="h-5 w-5 text-primary-strong shrink-0 mt-0.5" />
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
                    {aiBarOpen ? (
                      <div className="space-y-2">
                        <SmartSearchBar variant="compact" />
                        <button
                          type="button"
                          onClick={() => setAiBarOpen(false)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ChevronUp className="h-3 w-3" /> Verberg AI-zoekbalk
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAiBarOpen(true)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground focus-ring"
                      >
                        <Sparkles className="h-4 w-4 text-primary-strong" />
                        <span className="flex-1 truncate">Vraag het de AI… "BMW automaat onder €25.000"</span>
                        <ChevronDown className="h-4 w-4 opacity-60 transition-transform group-hover:translate-y-0.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>


              {/* Statusregio voor schermlezers: kondigt laden en resultaataantal aan.
                  Fouten worden aangekondigd via role="alert" op het zichtbare foutblok. */}
              <LiveStatus
                message={
                  resultsPending
                    ? 'Zoekresultaten worden geladen…'
                    : listingsError
                      ? ''
                      : `${total ?? pageListings.length} resultaten gevonden`
                }
              />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold md:text-3xl">Auto's zoeken</h1>
                  {resultsPending ? (
                    <div className="mt-1 flex h-6 items-center" aria-hidden="true">
                      <div className="h-4 w-40 rounded bg-muted animate-pulse-soft" />
                    </div>
                  ) : listingsError ? (
                    <p className="mt-1 text-muted-foreground">Resultaten konden niet geladen worden</p>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      <span className="font-semibold text-foreground">{total ?? pageListings.length}</span> resultaten gevonden
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">

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
                        <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} showPresets={false} query={queryParam} />
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
                        {activeFilterCount > 0 && (
                          <Button
                            variant="outline"
                            className="min-h-12 px-3"
                            onClick={saveGate.openSave}
                            aria-label="Opslaan als zoekalert"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                        )}
                        <DrawerClose asChild>
                          <Button className="flex-1 min-h-12">
                            {resultsPending ? 'Resultaten laden…' : `Toon ${total ?? 0} resultaten`}
                          </Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>

                  {/* Save as alert */}
                  <Button
                    variant="outline"
                    onClick={saveGate.openSave}
                    aria-label="Zoekopdracht opslaan als alert"
                    title={activeFilterCount === 0 ? 'Voeg eerst filters toe' : 'Zoekopdracht opslaan als alert'}
                    className="gap-2 border-border/60 hover:border-primary/40 hover:text-primary-strong"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="hidden md:inline">Opslaan</span>
                  </Button>


                  {/* Sort */}
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger aria-label="Sorteer zoekresultaten" className="w-44 border-border/60">
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
                      aria-label="Toon resultaten als rasterweergave"
                      aria-pressed={viewMode === 'grid'}
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      aria-label="Toon resultaten als lijstweergave"
                      aria-pressed={viewMode === 'list'}
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
              {compareWithId && (
                <MarketCompareBanner
                  reference={referenceListing}
                  listings={pageListings}
                  onClose={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('compareWith');
                    setSearchParams(next);
                  }}
                />
              )}



              {isPending || listingsLoading ? (
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
              ) : listingsError && pageListings.length === 0 ? (
                <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-12 text-center">
                  <h2 className="text-lg font-semibold">Zoekresultaten konden niet geladen worden</h2>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Er ging iets mis bij het ophalen van de advertenties. Probeer het opnieuw.
                  </p>
                  <Button variant="outline" onClick={() => refetch()}>Opnieuw proberen</Button>
                </div>
              ) : pageListings.length > 0 ? (
                <>
                  <VirtualListingGrid listings={pageListings} variant={viewMode} />

                  <InfiniteFeedFooter
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    error={listingsError}
                    onLoadMore={() => {
                      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
                    onRetry={() => fetchNextPage()}
                    skeletonVariant={viewMode === 'list' ? 'horizontal' : 'default'}
                    skeletonCount={viewMode === 'list' ? 2 : 3}
                  />
                </>

              ) : !listingsLoading && !listingsError && pageListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted mb-4">
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold">Geen resultaten gevonden</h2>
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

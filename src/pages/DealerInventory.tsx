import { useMemo, useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Car, MapPin, Phone, Shield, SlidersHorizontal, Star, Clock, Grid, List } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterPanel, FilterChips } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { SearchFilters, SORT_OPTIONS, Listing } from '@/types/listing';
import { findDealerBySlug, getDealerListings } from '@/lib/dealers';
import { cn } from '@/lib/utils';

const PER_PAGE = 24;

function applyFiltersAndSort(listings: Listing[], filters: SearchFilters, sortBy: string): Listing[] {
  let results = [...listings];
  if (filters.brand && filters.brand !== 'all') results = results.filter((l) => l.brand === filters.brand);
  if (filters.model) results = results.filter((l) => l.model === filters.model);
  if (filters.minPrice) results = results.filter((l) => l.price >= filters.minPrice!);
  if (filters.maxPrice) results = results.filter((l) => l.price <= filters.maxPrice!);
  if (filters.minYear) results = results.filter((l) => l.year >= filters.minYear!);
  if (filters.maxYear) results = results.filter((l) => l.year <= filters.maxYear!);
  if (filters.minMileage) results = results.filter((l) => l.mileage >= filters.minMileage!);
  if (filters.maxMileage) results = results.filter((l) => l.mileage <= filters.maxMileage!);
  if (filters.fuelTypes?.length) results = results.filter((l) => filters.fuelTypes!.includes(l.fuelType));
  if (filters.bodyTypes?.length) results = results.filter((l) => filters.bodyTypes!.includes(l.bodyType));
  if (filters.transmissions?.length) results = results.filter((l) => filters.transmissions!.includes(l.transmission));
  if (filters.driveTypes?.length) results = results.filter((l) => l.driveType && filters.driveTypes!.includes(l.driveType));
  if (filters.minPower) results = results.filter((l) => l.power >= filters.minPower!);
  if (filters.maxPower) results = results.filter((l) => l.power <= filters.maxPower!);
  if (filters.colors?.length) results = results.filter((l) => filters.colors!.includes(l.color));
  if (filters.minDoors) results = results.filter((l) => l.doors >= filters.minDoors!);
  if (filters.minSeats) results = results.filter((l) => l.seats >= filters.minSeats!);
  if (filters.province) results = results.filter((l) => l.location.province === filters.province);
  if (filters.features?.length) results = results.filter((l) => filters.features!.every((f) => l.features.includes(f)));

  switch (sortBy) {
    case 'price-asc': results.sort((a, b) => a.price - b.price); break;
    case 'price-desc': results.sort((a, b) => b.price - a.price); break;
    case 'mileage-asc': results.sort((a, b) => a.mileage - b.mileage); break;
    case 'year-desc': results.sort((a, b) => b.year - a.year); break;
  }
  return results;
}

export default function DealerInventory() {
  const { slug = '' } = useParams<{ slug: string }>();
  const dealer = findDealerBySlug(slug);
  const allListings = useMemo(() => getDealerListings(slug), [slug]);
  const activeListings = useMemo(() => allListings.filter((l) => l.status === 'active'), [allListings]);

  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => applyFiltersAndSort(activeListings, filters, sortBy),
    [activeListings, filters, sortBy],
  );

  if (!dealer) return <Navigate to="/zoeken" replace />;

  const handleRemoveFilter = (key: keyof SearchFilters, value?: string) => {
    const arrayKeys = ['fuelTypes', 'transmissions', 'bodyTypes', 'driveTypes', 'paintTypes', 'colors', 'interiorMaterials', 'features'];
    if (value && arrayKeys.includes(key)) {
      const current = filters[key] as string[] | undefined;
      setFilters({ ...filters, [key]: current?.filter((v) => v !== value) });
    } else {
      const next = { ...filters };
      delete next[key];
      if (key === 'minPrice') delete next.maxPrice;
      if (key === 'minYear') delete next.maxYear;
      if (key === 'minMileage') delete next.maxMileage;
      if (key === 'minPower') delete next.maxPower;
      setFilters(next);
    }
  };

  const activeFilterCount = Object.keys(filters).filter((k) => {
    const v = filters[k as keyof SearchFilters];
    return v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0);
  }).length;

  const dealerName = dealer.seller.name;
  const location = [dealer.city, dealer.province].filter(Boolean).join(', ');
  const canonical = `https://vatuur.be/dealer/${dealer.slug}`;
  const description = `Bekijk ${activeListings.length} tweedehands auto's bij ${dealerName}${location ? ` in ${location}` : ''}. Geverifieerde dealer met snelle reactietijd op VATUUR.`;

  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: dealerName,
      url: canonical,
      ...(dealer.seller.phone && { telephone: dealer.seller.phone }),
      ...(location && {
        address: {
          '@type': 'PostalAddress',
          addressLocality: dealer.city,
          addressRegion: dealer.province,
          addressCountry: 'NL',
        },
      }),
      ...(dealer.seller.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: dealer.seller.rating,
          reviewCount: dealer.seller.reviewCount ?? 1,
        },
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vatuur.be/' },
        { '@type': 'ListItem', position: 2, name: "Auto's zoeken", item: 'https://vatuur.be/zoeken' },
        { '@type': 'ListItem', position: 3, name: dealerName, item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Aanbod ${dealerName}`,
      itemListElement: activeListings.slice(0, 20).map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://vatuur.be/auto/${l.id}`,
        item: {
          '@type': 'Vehicle',
          name: l.title,
          brand: l.brand,
          model: l.model,
          vehicleModelDate: l.year,
          mileageFromOdometer: { '@type': 'QuantitativeValue', value: l.mileage, unitCode: 'KMT' },
          offers: { '@type': 'Offer', price: l.price, priceCurrency: 'EUR' },
        },
      })),
    },
  ];

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${dealerName} – ${activeListings.length} occasions | VATUUR.`}
        description={description}
        canonical={canonical}
        jsonLd={jsonLd}
      />

      <div className="container py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/zoeken" className="hover:text-foreground">Zoeken</Link>
          <span>/</span>
          <span className="text-foreground">{dealerName}</span>
        </nav>

        <Button variant="ghost" size="sm" asChild className="mb-4 gap-2 text-muted-foreground">
          <Link to="/zoeken"><ArrowLeft className="h-4 w-4" /> Terug naar zoeken</Link>
        </Button>

        {/* Dealer header */}
        <header className="mb-6 rounded-xl border border-border/60 bg-card p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary/10 text-primary text-2xl font-bold">
                {dealerName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">{dealerName}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-success">
                    <Shield className="h-3.5 w-3.5" /> Geverifieerde dealer
                  </span>
                  {location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {location}
                    </span>
                  )}
                  {dealer.seller.responseTime && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Reageert {dealer.seller.responseTime}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <Badge variant="secondary" className="gap-1">
                    <Car className="h-3 w-3" />
                    {activeListings.length} auto{activeListings.length === 1 ? '' : "'s"} beschikbaar
                  </Badge>
                  {dealer.seller.rating && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-semibold">{dealer.seller.rating}</span>
                      <span className="text-muted-foreground">({dealer.seller.reviewCount ?? 0} reviews)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {dealer.seller.phone && (
              <Button asChild className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <a href={`tel:${dealer.seller.phone.replace(/\s/g, '')}`}>
                  <Phone className="h-4 w-4" /> {dealer.seller.phone}
                </a>
              </Button>
            )}
          </div>
        </header>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden w-72 flex-shrink-0 lg:block">
            <div className="sticky top-20">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-card max-h-[calc(100vh-6rem)] overflow-y-auto">
                <FilterPanel filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} showPresets={false} />
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> van {activeListings.length} auto's
              </p>

              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden gap-2 border-border/60">
                      <SlidersHorizontal className="h-4 w-4" /> Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 bg-accent text-accent-foreground">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                    <div className="mt-6">
                      <FilterPanel filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} showPresets={false} />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card">
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="hidden items-center rounded-lg border border-border/60 p-1 sm:flex bg-muted/30">
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} onClearAll={() => setFilters({})} />

            <div className="mt-6">
              <ListingGrid listings={pageItems} variant={viewMode} columns={3} />

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="border-border/60">
                    Vorige
                  </Button>
                  <span className="px-3 text-sm text-muted-foreground">Pagina {page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={cn('border-border/60')}>
                    Volgende
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

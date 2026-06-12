import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingGrid } from '@/modules/listings';
import type { Listing } from '@/types/listing';
import { cn } from '@/lib/utils';

interface CategorySectionsProps {
  allListings: Listing[];
  loading: boolean;
  favorites: Set<string>;
  onToggle: (id: string) => void;
}

interface CategoryDef {
  key: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  to: string;
  filter: (l: Listing) => boolean;
}

const categories: CategoryDef[] = [
  {
    key: 'suv',
    title: "Uitgelichte SUV's",
    subtitle: 'Ruim, hoog en veelzijdig',
    ctaLabel: "Bekijk alle SUV's",
    to: '/zoeken?bodyTypes=suv',
    filter: (l) => l.bodyType === 'suv',
  },
  {
    key: 'elektrisch',
    title: 'Uitgelichte elektrische auto’s',
    subtitle: 'Stil, schoon en zuinig',
    ctaLabel: 'Bekijk alle elektrische auto’s',
    to: '/zoeken?fuelTypes=elektrisch',
    filter: (l) => l.fuelType === 'elektrisch',
  },
  {
    key: 'budget',
    title: 'Budget onder €10.000',
    subtitle: 'Betaalbare occasions',
    ctaLabel: 'Bekijk budgetauto’s',
    to: '/zoeken?maxPrice=10000',
    filter: (l) => l.price > 0 && l.price <= 10000,
  },
  {
    key: 'sportief',
    title: 'Sportieve auto’s',
    subtitle: 'Coupé’s met karakter',
    ctaLabel: 'Bekijk sportieve auto’s',
    to: '/zoeken?bodyTypes=coupe',
    filter: (l) => l.bodyType === 'coupe',
  },
];

export function CategorySections({ allListings, loading, favorites, onToggle }: CategorySectionsProps) {
  return (
    <>
      {categories.map((cat, idx) => {
        const items = allListings.filter(cat.filter).slice(0, 3);
        if (!loading && items.length === 0) return null;

        const alt = idx % 2 === 0;
        return (
          <section
            key={cat.key}
            className={cn('py-12 md:py-16', alt ? 'bg-background' : 'bg-muted/30')}
          >
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold">{cat.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{cat.subtitle}</p>
                </div>
                <Button variant="outline" asChild className="gap-2 shadow-sm">
                  <Link to={cat.to}>
                    {cat.ctaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <ListingGrid
                  listings={items}
                  columns={3}
                  favorites={Array.from(favorites)}
                  onFavoriteToggle={(id) => onToggle(id)}
                />
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

// Backwards-compatible export name in case of stale imports
export const CategoryGrid = () => null;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Fuel, Gauge, Calendar, Eye, GitCompareArrows, Crown, Settings2, BadgeCheck, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Listing } from '@/types/listing';
import { cn } from '@/lib/utils';
import { useCompare } from '@/hooks/useCompare';
import { useFavorites } from '@/hooks/useFavorites';
import { getSellerLabel } from '@/lib/sellerType';
import { StatusBadge } from './StatusBadge';
import { ListingImageCarousel } from './ListingImageCarousel';


interface ListingCardProps {
  listing: Listing;
  variant?: 'default' | 'compact' | 'horizontal';
}

export function ListingCard({ listing, variant = 'default' }: ListingCardProps) {
  const [justLiked, setJustLiked] = useState(false);
  const navigate = useNavigate();

  const { isFavorite: isFavGlobal, toggle: toggleFavGlobal } = useFavorites();
  const favorite = isFavGlobal(listing.id);

  const { add, has } = useCompare();
  const isComparing = has(listing.id);
  const isPremium = listing.isPremium || (listing.boostUntil && new Date(listing.boostUntil) > new Date());

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(listing);
  };

  const handleMarketCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams();
    if (listing.brand) params.set('brand', listing.brand);
    if (listing.model) params.set('model', listing.model);
    if (listing.year) {
      params.set('yearMin', String(listing.year - 1));
      params.set('yearMax', String(listing.year + 1));
    }
    params.set('compareWith', listing.id);
    navigate(`/zoeken?${params.toString()}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!favorite) {
      setJustLiked(true);
      window.setTimeout(() => setJustLiked(false), 420);
    }
    toggleFavGlobal(listing.id);
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('nl-NL').format(mileage);
  };

  if (variant === 'horizontal') {
    return (
      <Link to={`/auto/${listing.id}`} className="block" aria-label={`${listing.title} - ${formatPrice(listing.price)}`}>
        <Card className={cn(
          "group overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 border-border/60",
          isPremium && "border-premium/50 shadow-glow-premium ring-1 ring-premium/20"
        )}>
          <div className="flex flex-col sm:flex-row">
            {/* Image Container */}
            <div className="relative sm:w-72 sm:flex-shrink-0">
              <ListingImageCarousel
                images={listing.images}
                alt={listing.title}
                aspectClass="aspect-[16/10] sm:aspect-[4/3]"
              >
                {/* Price Badge */}
                <div className="absolute left-3 top-3 z-10 rounded-lg bg-card/95 px-3 py-1.5 shadow-elevated backdrop-blur-sm">
                  <span className="text-lg font-bold text-accent">{formatPrice(listing.price)}</span>
                </div>

                {/* Favorite Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={favorite ? 'Verwijder uit favorieten' : 'Toevoegen aan favorieten'}
                  aria-pressed={favorite}
                  className={cn(
                    'absolute right-3 top-3 z-10 h-9 w-9 rounded-md backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground',
                    favorite
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-1 ring-offset-background'
                      : 'bg-card/90 text-accent'
                  )}
                  onClick={handleFavoriteClick}
                >
                  <Heart className={cn('h-4 w-4 transition-transform', favorite && 'fill-current scale-110', justLiked && 'animate-heart-pop')} />
                </Button>

                {/* Status / Premium Badges */}
                <div className="absolute left-3 bottom-3 z-10 flex items-center gap-1.5">
                  {isPremium && (
                    <Badge className="bg-premium text-premium-foreground font-semibold gap-1">
                      <Crown className="h-3 w-3" /> Top
                    </Badge>
                  )}
                  <StatusBadge status={listing.status} />
                </div>
              </ListingImageCarousel>
            </div>

            {/* Content */}
            <CardContent className="flex flex-1 flex-col justify-between p-5">

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary-strong transition-colors">
                  {listing.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {listing.year}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gauge className="h-4 w-4" />
                    {formatMileage(listing.mileage)} km
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Fuel className="h-4 w-4" />
                    <span className="capitalize">{listing.fuelType}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Settings2 className="h-4 w-4" />
                    <span className="capitalize">{listing.transmission}</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {listing.location.city}
                </span>
                <Badge variant="secondary" className="font-medium">
                  {getSellerLabel(listing)}
                </Badge>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/auto/${listing.id}`} className="block" aria-label={`${listing.title} - ${formatPrice(listing.price)}`}>
      <Card className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 border-border/60",
        isPremium && "border-premium/50 shadow-glow-premium ring-1 ring-premium/20"
      )}>
        {/* Image Container */}
        <ListingImageCarousel
          images={listing.images}
          alt={listing.title}
          aspectClass="aspect-[16/10]"
        >
          {/* Gradient overlay */}
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Price Badge */}
          <div className="absolute left-3 top-3 z-10 rounded-lg bg-card/95 px-2.5 py-1 shadow-elevated backdrop-blur-sm">
            <span className="text-base font-bold text-accent">{formatPrice(listing.price)}</span>
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={favorite ? 'Verwijder uit favorieten' : 'Toevoegen aan favorieten'}
            aria-pressed={favorite}
            className={cn(
              'absolute right-3 top-3 z-10 h-9 w-9 rounded-md backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground',
              favorite
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-1 ring-offset-background'
                : 'bg-card/90 text-accent'
            )}
            onClick={handleFavoriteClick}
          >
            <Heart className={cn('h-4 w-4 transition-transform', favorite && 'fill-current scale-110', justLiked && 'animate-heart-pop')} />
          </Button>

          {/* Compare Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={isComparing ? 'Wordt vergeleken' : 'Vergelijk deze auto'}
            className={cn(
              'absolute right-3 top-14 z-10 h-9 w-9 rounded-md backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground',
              isComparing ? 'bg-primary text-primary-foreground' : 'bg-card/90 text-primary-strong'
            )}
            onClick={handleCompareClick}
            disabled={isComparing}
          >
            <GitCompareArrows className={cn('h-4 w-4', isComparing && 'scale-110')} />
          </Button>

          {/* Status / Premium Badges */}
          <div className="absolute left-3 bottom-3 z-10 flex items-center gap-1.5">
            {isPremium && (
              <Badge className="bg-premium text-premium-foreground font-semibold gap-1">
                <Crown className="h-3 w-3" /> Top
              </Badge>
            )}
            <StatusBadge status={listing.status} />
          </div>

          {/* Hover CTA (desktop only) */}
          <div className="pointer-events-none absolute inset-x-3 bottom-12 z-10 hidden opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 lg:block">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/95 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <Eye className="h-4 w-4" />
              Bekijk deze deal
            </div>
          </div>
        </ListingImageCarousel>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className={cn(
            'font-semibold text-foreground line-clamp-1 group-hover:text-primary-strong transition-colors',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}>
            {listing.title}
          </h3>
          {listing.modelVersion && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{listing.modelVersion}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Calendar className="h-3 w-3" />
              {listing.year}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Gauge className="h-3 w-3" />
              {formatMileage(listing.mileage)} {listing.mileageUnit ?? 'km'}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Fuel className="h-3 w-3" />
              <span className="capitalize">{listing.fuelType}</span>
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Settings2 className="h-3 w-3" />
              <span className="capitalize">{listing.transmission}</span>
            </span>
            {listing.source === 'autoscout' && (
              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-secondary-foreground">
                <BadgeCheck className="h-3 w-3" />
                AS24
              </span>
            )}
            {listing.vatDeductible && (
              <span className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">Btw aftrekbaar</span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {listing.location.city}
            </span>
            <Badge variant="secondary" className="text-xs font-medium">
              {getSellerLabel(listing)}
            </Badge>
          </div>

          {variant !== 'compact' && (
            <button
              type="button"
              onClick={handleMarketCompare}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary-strong hover:border-primary/30"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Vergelijk markt
            </button>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

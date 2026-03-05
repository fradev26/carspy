import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Fuel, Gauge, Calendar, Eye, GitCompareArrows, Crown, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Listing } from '@/types/listing';
import { cn } from '@/lib/utils';
import { useCompare } from '@/hooks/useCompare';

interface ListingCardProps {
  listing: Listing;
  variant?: 'default' | 'compact' | 'horizontal';
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  isFavorite?: boolean;
}

export function ListingCard({ listing, variant = 'default', onFavoriteToggle, isFavorite = false }: ListingCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { add, has } = useCompare();
  const isComparing = has(listing.id);
  const isPremium = listing.isPremium || (listing.boostUntil && new Date(listing.boostUntil) > new Date());

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(listing);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorite = !favorite;
    setFavorite(newFavorite);
    onFavoriteToggle?.(listing.id, newFavorite);
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

  const imageUrl = imageError || !listing.images[0] 
    ? '/placeholder.svg' 
    : listing.images[0];

  if (variant === 'horizontal') {
    return (
      <Link to={`/auto/${listing.id}`} className="block">
        <Card className={cn(
          "group overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 border-border/60",
          isPremium && "border-premium/50 shadow-glow-premium ring-1 ring-premium/20"
        )}>
          <div className="flex flex-col sm:flex-row">
            {/* Image Container */}
            <div className="relative aspect-[16/10] sm:aspect-[4/3] sm:w-72 overflow-hidden bg-muted">
              {!imageLoaded && (
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
              )}
              <img
                src={imageUrl}
                alt={listing.title}
                className={cn(
                  "h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              
              {/* Price Badge */}
              <div className="absolute left-3 top-3 rounded-lg bg-card/95 px-3 py-1.5 shadow-elevated backdrop-blur-sm">
                <span className="text-lg font-bold text-accent">{formatPrice(listing.price)}</span>
              </div>
              
              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute right-3 top-3 h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md transition-all hover:scale-110',
                  favorite ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                )}
                onClick={handleFavoriteClick}
              >
                <Heart className={cn('h-4 w-4 transition-transform', favorite && 'fill-current scale-110')} />
              </Button>
              
              {/* Status / Premium Badges */}
              {isPremium && (
                <Badge className="absolute left-3 bottom-3 bg-premium text-premium-foreground font-semibold gap-1">
                  <Crown className="h-3 w-3" />
                  Top
                </Badge>
              )}
              {listing.status === 'reserved' && (
                <Badge className={cn("absolute bottom-3 bg-warning text-warning-foreground font-medium", isPremium ? "left-20" : "left-3")}>
                  Gereserveerd
                </Badge>
              )}
            </div>

            {/* Content */}
            <CardContent className="flex flex-1 flex-col justify-between p-5">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
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
                  {listing.seller.type === 'dealer' ? 'Dealer' : 'Particulier'}
                </Badge>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/auto/${listing.id}`} className="block">
      <Card className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 border-border/60",
        isPremium && "border-premium/50 shadow-glow-premium ring-1 ring-premium/20"
      )}>
        {/* Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
          )}
          <img
            src={imageUrl}
            alt={listing.title}
            className={cn(
              "h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Price Badge */}
          <div className="absolute left-3 top-3 rounded-lg bg-card/95 px-2.5 py-1 shadow-elevated backdrop-blur-sm">
            <span className="text-base font-bold text-accent">{formatPrice(listing.price)}</span>
          </div>
          
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-3 top-3 h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md transition-all hover:scale-110',
              favorite ? 'text-accent' : 'text-muted-foreground hover:text-accent'
            )}
            onClick={handleFavoriteClick}
          >
            <Heart className={cn('h-4 w-4 transition-transform', favorite && 'fill-current scale-110')} />
          </Button>

          {/* Compare Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-3 top-14 h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md transition-all hover:scale-110',
              isComparing ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
            onClick={handleCompareClick}
            disabled={isComparing}
          >
            <GitCompareArrows className={cn('h-4 w-4', isComparing && 'scale-110')} />
          </Button>
          
          {/* Status / Premium Badges */}
          {isPremium && (
            <Badge className="absolute left-3 bottom-3 bg-premium text-premium-foreground font-semibold gap-1">
              <Crown className="h-3 w-3" />
              Top
            </Badge>
          )}
          {listing.status === 'reserved' && (
            <Badge className={cn("absolute bottom-3 bg-warning text-warning-foreground font-medium", isPremium ? "left-20" : "left-3")}>
              Gereserveerd
            </Badge>
          )}
          
          {/* Hover CTA */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/95 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <Eye className="h-4 w-4" />
              Bekijk details
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className={cn(
            'font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}>
            {listing.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Calendar className="h-3 w-3" />
              {listing.year}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Gauge className="h-3 w-3" />
              {formatMileage(listing.mileage)} km
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Fuel className="h-3 w-3" />
              <span className="capitalize">{listing.fuelType}</span>
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Settings2 className="h-3 w-3" />
              <span className="capitalize">{listing.transmission}</span>
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {listing.location.city}
            </span>
            <Badge variant="secondary" className="text-xs font-medium">
              {listing.seller.type === 'dealer' ? 'Dealer' : 'Particulier'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Fuel, Gauge, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Listing } from '@/types/listing';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
  variant?: 'default' | 'compact' | 'horizontal';
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  isFavorite?: boolean;
}

export function ListingCard({ listing, variant = 'default', onFavoriteToggle, isFavorite = false }: ListingCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [imageError, setImageError] = useState(false);

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
      <Link to={`/auto/${listing.id}`}>
        <Card className="group overflow-hidden transition-all hover:shadow-card-hover">
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="relative aspect-[16/10] sm:aspect-[4/3] sm:w-64 overflow-hidden">
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute right-2 top-2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm',
                  favorite && 'text-accent'
                )}
                onClick={handleFavoriteClick}
              >
                <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
              </Button>
              {listing.status === 'reserved' && (
                <Badge className="absolute left-2 top-2 bg-warning text-warning-foreground">Gereserveerd</Badge>
              )}
            </div>

            {/* Content */}
            <CardContent className="flex flex-1 flex-col justify-between p-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  <span className="text-lg font-bold text-accent whitespace-nowrap">
                    {formatPrice(listing.price)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {listing.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" />
                    {formatMileage(listing.mileage)} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className="h-3.5 w-3.5" />
                    {listing.fuelType}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.location.city}
                </span>
                <Badge variant="secondary" className="text-xs">
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
    <Link to={`/auto/${listing.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-card-hover">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-2 top-2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm',
              favorite && 'text-accent'
            )}
            onClick={handleFavoriteClick}
          >
            <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
          </Button>
          {listing.status === 'reserved' && (
            <Badge className="absolute left-2 top-2 bg-warning text-warning-foreground">Gereserveerd</Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              'font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors',
              variant === 'compact' ? 'text-sm' : 'text-base'
            )}>
              {listing.title}
            </h3>
          </div>

          <span className="mt-1 block text-lg font-bold text-accent">
            {formatPrice(listing.price)}
          </span>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {listing.year}
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {formatMileage(listing.mileage)} km
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Fuel className="h-3 w-3" />
              {listing.fuelType}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {listing.location.city}
            </span>
            <Badge variant="secondary" className="text-xs">
              {listing.seller.type === 'dealer' ? 'Dealer' : 'Particulier'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

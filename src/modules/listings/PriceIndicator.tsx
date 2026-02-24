import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Listing } from '@/types/listing';
import { getPriceAnalysis, type PriceAnalysis } from '@/data/mockListings';

interface PriceIndicatorProps {
  listing: Listing;
  className?: string;
}

const ratingConfig: Record<PriceAnalysis['rating'], {
  label: string;
  description: string;
  icon: typeof TrendingDown;
  colorClass: string;
  bgClass: string;
  barColor: string;
}> = {
  good: {
    label: 'Goede deal',
    description: 'Deze prijs ligt onder het marktgemiddelde',
    icon: TrendingDown,
    colorClass: 'text-success',
    bgClass: 'bg-success/10 border-success/30',
    barColor: 'bg-success',
  },
  fair: {
    label: 'Marktconform',
    description: 'Deze prijs ligt rond het marktgemiddelde',
    icon: Minus,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10 border-warning/30',
    barColor: 'bg-warning',
  },
  high: {
    label: 'Boven marktprijs',
    description: 'Deze prijs ligt boven het marktgemiddelde',
    icon: TrendingUp,
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10 border-destructive/30',
    barColor: 'bg-destructive',
  },
};

export function PriceIndicator({ listing, className }: PriceIndicatorProps) {
  const analysis = getPriceAnalysis(listing);

  if (!analysis || analysis.comparableCount < 2) return null;

  const config = ratingConfig[analysis.rating];
  const Icon = config.icon;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

  // Calculate position on bar (0-100%)
  const range = analysis.maxPrice - analysis.minPrice;
  const position = range > 0
    ? Math.min(100, Math.max(0, ((listing.price - analysis.minPrice) / range) * 100))
    : 50;

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', config.bgClass, className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', config.colorClass)} />
          <span className={cn('font-semibold text-sm', config.colorClass)}>{config.label}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {analysis.comparableCount} vergelijkbare auto's
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground">{config.description}</p>

      {/* Price bar */}
      <div className="space-y-1.5">
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('absolute top-0 h-full w-3 rounded-full shadow-sm', config.barColor)}
            style={{ left: `calc(${position}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(analysis.minPrice)}</span>
          <span className="font-medium">{formatPrice(analysis.averagePrice)} gem.</span>
          <span>{formatPrice(analysis.maxPrice)}</span>
        </div>
      </div>
    </div>
  );
}

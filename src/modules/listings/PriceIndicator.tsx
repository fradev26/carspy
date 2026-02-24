import { TrendingDown, TrendingUp, Minus, Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Listing } from '@/types/listing';
import { getPriceAnalysis, type PriceAnalysis } from '@/data/mockListings';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PriceIndicatorProps {
  listing: Listing;
  className?: string;
}

interface AiInsight {
  summary: string;
  details: string;
  tips: string[];
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
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!analysis || analysis.comparableCount < 2) return null;

  const config = ratingConfig[analysis.rating];
  const Icon = config.icon;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

  const range = analysis.maxPrice - analysis.minPrice;
  const position = range > 0
    ? Math.min(100, Math.max(0, ((listing.price - analysis.minPrice) / range) * 100))
    : 50;

  const fetchAiInsight = async () => {
    if (aiInsight || loading) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/price-analysis`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ listing, analysis }),
      });
      if (!resp.ok) throw new Error('AI niet beschikbaar');
      const data = await resp.json();
      setAiInsight(data);
    } catch {
      setError('AI-analyse kon niet worden geladen');
    } finally {
      setLoading(false);
    }
  };

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

      {/* AI Insight Section */}
      {!aiInsight && !loading && !error && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={fetchAiInsight}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI-analyse bekijken
        </Button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          AI analyseert deze prijs…
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive text-center py-2">{error}</p>
      )}

      {aiInsight && (
        <div className="space-y-2.5 border-t border-border/40 pt-3">
          <div className="flex items-start gap-2">
            <Sparkles className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.colorClass)} />
            <div className="space-y-1">
              <p className="text-sm font-medium">{aiInsight.summary}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{aiInsight.details}</p>
            </div>
          </div>
          {aiInsight.tips.length > 0 && (
            <div className="space-y-1.5">
              {aiInsight.tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lightbulb className="h-3 w-3 text-warning flex-shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

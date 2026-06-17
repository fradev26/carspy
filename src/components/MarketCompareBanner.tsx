import { useMemo } from 'react';
import { BarChart3, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Listing } from '@/types/listing';

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

interface Props {
  reference: Listing | null | undefined;
  listings: Listing[];
  onClose: () => void;
}

export function MarketCompareBanner({ reference, listings, onClose }: Props) {
  const stats = useMemo(() => {
    const others = listings.filter((l) => l.id !== reference?.id).map((l) => l.price).filter((p) => p > 0);
    if (others.length === 0) return null;
    const min = Math.min(...others);
    const max = Math.max(...others);
    const avg = others.reduce((a, b) => a + b, 0) / others.length;
    return { min, max, avg, count: others.length };
  }, [listings, reference?.id]);

  if (!reference) return null;

  let positionLabel = '—';
  let positionTone = 'text-muted-foreground';
  if (stats) {
    const diff = reference.price - stats.avg;
    const pct = (diff / stats.avg) * 100;
    if (pct < -5) { positionLabel = `${Math.abs(pct).toFixed(0)}% onder marktgemiddelde`; positionTone = 'text-success'; }
    else if (pct > 5) { positionLabel = `${pct.toFixed(0)}% boven marktgemiddelde`; positionTone = 'text-destructive'; }
    else { positionLabel = 'rond marktgemiddelde'; positionTone = 'text-foreground'; }
  }

  return (
    <div className="mb-5 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 p-4">
      <div className="flex items-start gap-3">
        <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Marktvergelijking voor{' '}
            <Link to={`/auto/${reference.id}`} className="underline hover:text-primary">
              {reference.title}
            </Link>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vraagprijs <span className="font-semibold text-foreground">{fmt(reference.price)}</span> — <span className={positionTone}>{positionLabel}</span>
          </p>
          {stats && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Min: <span className="font-medium text-foreground">{fmt(stats.min)}</span></span>
              <span>Gemiddeld: <span className="font-medium text-foreground">{fmt(stats.avg)}</span></span>
              <span>Max: <span className="font-medium text-foreground">{fmt(stats.max)}</span></span>
              <span>{stats.count} vergelijkbare auto's</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Sluit marktvergelijking" className="shrink-0 h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

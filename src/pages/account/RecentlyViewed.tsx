import { Link } from 'react-router-dom';
import { Clock, Trash2, Eye } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRecentlyViewedListings } from '@/hooks/useRecentlyViewedListings';

const fmt = (p: number | null) =>
  p == null ? '—' : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(p);

export default function RecentlyViewed() {
  const { items, clear, removeOne } = useRecentlyViewedListings();

  return (
    <div className="container py-8">
      <SEOHead title="Recent bekeken — VATUUR." description="Voertuigen die je recent hebt bekeken." noindex />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recent bekeken</h1>
          <p className="text-sm text-muted-foreground">Snel terug naar wagens die je eerder bekeek.</p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={clear}><Trash2 className="h-4 w-4" />Wis alles</Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Je hebt nog geen wagens bekeken.</p>
            <Button asChild className="mt-2"><Link to="/zoeken">Ga zoeken</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.id} className="overflow-hidden transition hover:shadow-md">
              <Link to={`/auto/${it.id}`} className="block">
                <img src={it.image || '/placeholder.svg'} alt={it.title} className="h-40 w-full object-cover" loading="lazy" />
              </Link>
              <CardContent className="p-4">
                <Link to={`/auto/${it.id}`} className="font-semibold hover:text-primary line-clamp-1">{it.title}</Link>
                <p className="mt-1 text-lg font-bold text-accent">{fmt(it.price)}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{it.city ?? ''}</span>
                  <span>{new Date(it.viewedAt).toLocaleDateString('nl-NL')}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 gap-2"><Link to={`/auto/${it.id}`}><Eye className="h-4 w-4" />Bekijken</Link></Button>
                  <Button variant="outline" size="icon" onClick={() => removeOne(it.id)} aria-label="Verwijderen">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

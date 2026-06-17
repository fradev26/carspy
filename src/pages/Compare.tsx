import { Link } from 'react-router-dom';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompare } from '@/hooks/useCompare';
import { SEOHead } from '@/components/SEOHead';

export default function Compare() {
  const { items, remove, clear } = useCompare();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
  const formatMileage = (m: number) => new Intl.NumberFormat('nl-NL').format(m);

  const specs: { label: string; getValue: (l: typeof items[0]) => string }[] = [
    { label: 'Prijs', getValue: l => formatPrice(l.price) },
    { label: 'Bouwjaar', getValue: l => l.year.toString() },
    { label: 'Km-stand', getValue: l => `${formatMileage(l.mileage)} km` },
    { label: 'Vermogen', getValue: l => `${l.power} pk` },
    { label: 'Brandstof', getValue: l => l.fuelType },
    { label: 'Transmissie', getValue: l => l.transmission },
    { label: 'Carrosserie', getValue: l => l.bodyType },
    { label: 'Kleur', getValue: l => l.color },
    { label: 'Deuren', getValue: l => l.doors.toString() },
    { label: 'Motor', getValue: l => l.engineSize ? `${l.engineSize}L` : '-' },
  ];

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Geen auto's om te vergelijken</h1>
        <p className="mt-2 text-muted-foreground">Voeg auto's toe via de zoekpagina of detailpagina.</p>
        <Button asChild className="mt-6">
          <Link to="/zoeken">Naar zoeken</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Auto's vergelijken - VATUUR."
        description="Vergelijk tweedehands auto's op prijs, specificaties en uitrusting. Maak de beste keuze met VATUUR."
        canonical="https://vatuur.be/vergelijken"
        noindex
      />
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
              <Link to="/zoeken"><ArrowLeft className="mr-2 h-4 w-4" />Terug</Link>
            </Button>
            <h1 className="text-2xl font-bold">Auto's vergelijken</h1>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={clear}>Wis alles</Button>
          )}
        </div>

        {/* Mobile-friendly horizontal scroll wrapper so the grid never overflows the viewport. */}
        <div className="-mx-4 px-4 overflow-x-auto md:mx-0 md:px-0 md:overflow-visible">
          <div className="min-w-[640px] md:min-w-0">
            {/* Car headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `160px repeat(${items.length}, minmax(180px, 1fr))` }}>
              {/* Empty top-left cell */}
              <div />
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden border-border/60">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img src={item.images[0] || '/placeholder.svg'} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                    <Button
                      variant="ghost" size="icon"
                      aria-label={`Verwijder ${item.title} uit vergelijking`}
                      className="absolute top-2 right-2 h-7 w-7 rounded-md bg-card/90 backdrop-blur-sm"
                      onClick={() => remove(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <Link to={`/auto/${item.id}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="text-lg font-bold text-accent mt-1">{formatPrice(item.price)}</p>
                  </CardContent>
                </Card>
              ))}
              {items.length < 3 && (
                <Link to="/zoeken" className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/60 min-h-[200px] hover:border-primary/40 transition-colors">
                  <div className="text-center text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm">Auto toevoegen</span>
                  </div>
                </Link>
              )}
            </div>

            {/* Specs comparison */}
            <div className="mt-6 rounded-xl border border-border/60 overflow-hidden">
              {specs.map((spec, i) => (
                <div
                  key={spec.label}
                  className="grid items-center gap-4"
                  style={{
                    gridTemplateColumns: `160px repeat(${items.length}, minmax(180px, 1fr))`,
                    backgroundColor: i % 2 === 0 ? 'hsl(var(--muted) / 0.3)' : undefined
                  }}
                >
                  <div className="p-3 text-sm font-medium text-muted-foreground">{spec.label}</div>
                  {items.map(item => (
                    <div key={item.id} className="p-3 text-sm font-medium capitalize">{spec.getValue(item)}</div>
                  ))}
                </div>
              ))}
            </div>

            {/* Features comparison */}
            <h2 className="text-lg font-semibold mt-8 mb-4">Uitrusting</h2>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              {(() => {
                const allFeatures = [...new Set(items.flatMap(i => i.features))].sort();
                return allFeatures.map((feature, i) => (
                  <div
                    key={feature}
                    className="grid items-center gap-4"
                    style={{
                      gridTemplateColumns: `160px repeat(${items.length}, minmax(180px, 1fr))`,
                      backgroundColor: i % 2 === 0 ? 'hsl(var(--muted) / 0.3)' : undefined
                    }}
                  >
                    <div className="p-3 text-sm text-muted-foreground capitalize">{feature.replace(/_/g, ' ')}</div>
                    {items.map(item => (
                      <div key={item.id} className="p-3 text-sm">
                        {item.features.includes(feature) ? (
                          <Badge className="bg-success/10 text-success border-success/30 inline-flex items-center gap-1">
                            <Check className="h-3 w-3" />
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

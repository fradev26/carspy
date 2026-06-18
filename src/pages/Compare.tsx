import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Plus, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCompare } from '@/hooks/useCompare';
import { SEOHead } from '@/components/SEOHead';
import { toast } from '@/hooks/use-toast';
import { Listing } from '@/types/listing';
import { cn } from '@/lib/utils';

type CompareDir = 'higher' | 'lower' | null;
type Spec = {
  label: string;
  getValue: (l: Listing) => string;
  getNumeric?: (l: Listing) => number | null;
  compare?: CompareDir;
};

export default function Compare() {
  const { items, remove, clear } = useCompare();
  const [onlyDiff, setOnlyDiff] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
  const formatNum = (m: number) => new Intl.NumberFormat('nl-NL').format(m);

  const specs: Spec[] = [
    { label: 'Prijs', getValue: l => formatPrice(l.price), getNumeric: l => l.price, compare: 'lower' },
    { label: 'Bouwjaar', getValue: l => l.year.toString(), getNumeric: l => l.year, compare: 'higher' },
    { label: 'Km-stand', getValue: l => `${formatNum(l.mileage)} km`, getNumeric: l => l.mileage, compare: 'lower' },
    { label: 'Vermogen', getValue: l => `${l.power} pk`, getNumeric: l => l.power, compare: 'higher' },
    { label: 'Motor', getValue: l => (l.engineSize ? `${l.engineSize}L` : '—'), getNumeric: l => l.engineSize ?? null, compare: 'higher' },
    { label: 'Brandstof', getValue: l => l.fuelType },
    { label: 'Transmissie', getValue: l => l.transmission },
    { label: 'Carrosserie', getValue: l => l.bodyType },
    { label: 'Kleur', getValue: l => l.color },
    { label: 'Deuren', getValue: l => l.doors.toString() },
  ];

  // Winner detection per spec
  const winners = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const spec of specs) {
      if (!spec.compare || !spec.getNumeric || items.length < 2) continue;
      const values = items
        .map(it => ({ id: it.id, v: spec.getNumeric!(it) }))
        .filter(x => x.v != null) as { id: string; v: number }[];
      if (values.length < 2) continue;
      const best = spec.compare === 'higher' ? Math.max(...values.map(x => x.v)) : Math.min(...values.map(x => x.v));
      const winnerIds = new Set(values.filter(x => x.v === best).map(x => x.id));
      // Only highlight if there's a unique winner (not all tied)
      if (winnerIds.size > 0 && winnerIds.size < values.length) {
        map.set(spec.label, winnerIds);
      }
    }
    return map;
  }, [items, specs]);

  const visibleSpecs = useMemo(() => {
    if (!onlyDiff || items.length < 2) return specs;
    return specs.filter(s => new Set(items.map(it => s.getValue(it))).size > 1);
  }, [specs, items, onlyDiff]);

  const allFeatures = useMemo(() => [...new Set(items.flatMap(i => i.features))].sort(), [items]);
  const visibleFeatures = useMemo(() => {
    if (!onlyDiff || items.length < 2) return allFeatures;
    return allFeatures.filter(f => new Set(items.map(it => it.features.includes(f))).size > 1);
  }, [allFeatures, items, onlyDiff]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Auto's vergelijken - VATUUR", url }); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link gekopieerd' });
    } catch {
      toast({ title: 'Kopiëren mislukt', variant: 'destructive' });
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <SEOHead title="Auto's vergelijken - VATUUR." description="Vergelijk tweedehands auto's." canonical="https://vatuur.be/vergelijken" noindex />
        <h1 className="text-2xl font-bold">Geen auto's om te vergelijken</h1>
        <p className="mt-2 text-muted-foreground">Voeg auto's toe via de zoekpagina of detailpagina.</p>
        <Button asChild className="mt-6"><Link to="/zoeken">Naar zoeken</Link></Button>
      </div>
    );
  }

  const colCount = items.length + (items.length < 3 ? 1 : 0);
  const gridTemplate = `110px repeat(${colCount}, minmax(120px, 1fr))`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Auto's vergelijken - VATUUR."
        description="Vergelijk tweedehands auto's op prijs, specificaties en uitrusting. Maak de beste keuze met VATUUR."
        canonical="https://vatuur.be/vergelijken"
        noindex
      />

      {/* Page header */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border/60">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" asChild className="-ml-2 shrink-0">
                <Link to="/zoeken" aria-label="Terug"><ArrowLeft className="h-5 w-5" /></Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold truncate">Auto's vergelijken</h1>
                <p className="text-xs text-muted-foreground">{items.length} van 3 geselecteerd</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Switch id="only-diff" checked={onlyDiff} onCheckedChange={setOnlyDiff} disabled={items.length < 2} />
                <Label htmlFor="only-diff" className="text-xs md:text-sm cursor-pointer">Alleen verschillen</Label>
              </div>
              <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground hover:text-foreground">Wis alles</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="-mx-4 px-4 overflow-x-auto md:mx-0 md:px-0 md:overflow-visible">
          <div className="min-w-[520px] md:min-w-0">

            {/* Sticky compact car header */}
            <div
              className="sticky top-[88px] md:top-[92px] z-30 bg-background/95 backdrop-blur pt-3 pb-3 grid items-end gap-2 md:gap-3 border-b border-border/60"
              style={{ gridTemplateColumns: gridTemplate }}
              role="row"
            >
              <div />
              {items.map(item => (
                <div key={item.id} className="relative">
                  <div className="relative aspect-[4/3] max-h-28 md:max-h-32 overflow-hidden rounded-lg bg-muted">
                    <img src={item.images[0] || '/placeholder.svg'} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                    <button
                      type="button"
                      aria-label={`Verwijder ${item.title}`}
                      onClick={() => remove(item.id)}
                      className="absolute top-1.5 right-1.5 h-7 w-7 inline-flex items-center justify-center rounded-md bg-card/90 backdrop-blur-sm hover:bg-card focus-ring"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Link to={`/auto/${item.id}`} className="block mt-1.5 text-xs md:text-sm font-semibold leading-tight line-clamp-1 hover:text-primary transition-colors">
                    {item.title}
                  </Link>
                  <p className="text-sm md:text-base font-bold text-accent leading-tight">{formatPrice(item.price)}</p>
                </div>
              ))}
              {items.length < 3 && (
                <Link to="/zoeken" className="flex items-center justify-center aspect-[4/3] max-h-28 md:max-h-32 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/40 transition-colors text-muted-foreground">
                  <div className="text-center">
                    <Plus className="h-5 w-5 mx-auto mb-0.5" />
                    <span className="text-[10px] md:text-xs">Toevoegen</span>
                  </div>
                </Link>
              )}
            </div>

            {/* Specs table */}
            <div className="mt-4 rounded-xl border border-border/60 overflow-hidden" role="table" aria-label="Specificaties">
              {visibleSpecs.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Geen verschillen in specificaties.</div>
              ) : visibleSpecs.map((spec, i) => {
                const winnerIds = winners.get(spec.label);
                return (
                  <div
                    key={spec.label}
                    className={cn('grid items-center gap-2 md:gap-3', i % 2 === 0 && 'bg-muted/30')}
                    style={{ gridTemplateColumns: gridTemplate }}
                    role="row"
                  >
                    <div className="px-3 py-2.5 text-xs md:text-sm font-medium text-muted-foreground" role="cell">{spec.label}</div>
                    {items.map(item => {
                      const isWinner = winnerIds?.has(item.id) ?? false;
                      return (
                        <div key={item.id} className="px-2 md:px-3 py-2.5 text-xs md:text-sm capitalize" role="cell">
                          <span className={cn('inline-flex items-center gap-1.5', isWinner && 'text-success font-semibold')}>
                            {isWinner && <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" aria-label="beste waarde" />}
                            {spec.getValue(item)}
                          </span>
                        </div>
                      );
                    })}
                    {items.length < 3 && <div />}
                  </div>
                );
              })}
            </div>

            {/* Features */}
            {allFeatures.length > 0 && (
              <>
                <h2 className="text-base md:text-lg font-semibold mt-6 mb-3">Uitrusting</h2>
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  {visibleFeatures.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">Geen verschillen in uitrusting.</div>
                  ) : visibleFeatures.map((feature, i) => (
                    <div
                      key={feature}
                      className={cn('grid items-center gap-2 md:gap-3', i % 2 === 0 && 'bg-muted/30')}
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      <div className="px-3 py-2.5 text-xs md:text-sm text-muted-foreground capitalize">{feature.replace(/_/g, ' ')}</div>
                      {items.map(item => (
                        <div key={item.id} className="px-2 md:px-3 py-2.5 text-sm">
                          {item.features.includes(feature) ? (
                            <Badge className="bg-success/10 text-success border-success/30 inline-flex items-center gap-1 h-5 px-1.5">
                              <Check className="h-3 w-3" />
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      ))}
                      {items.length < 3 && <div />}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Bottom CTA */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              {items.length < 3 && (
                <Button asChild variant="outline" className="flex-1 h-11">
                  <Link to="/zoeken"><Plus className="mr-2 h-4 w-4" />Auto toevoegen</Link>
                </Button>
              )}
              <Button onClick={handleShare} className="flex-1 h-11">
                <Share2 className="mr-2 h-4 w-4" />Deel vergelijking
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

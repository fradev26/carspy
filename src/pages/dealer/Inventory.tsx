import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Heart, MessageCircle, Car, Crown, Rocket, Pencil, CheckCircle2,
  Search as SearchIcon, ExternalLink, Trash2, Plus, BarChart3,
  Clock, Flame, TrendingDown, PlayCircle,
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/modules/listings/StatusBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDealerAnalytics, type ListingAnalytics } from '@/hooks/useDealerAnalytics';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

type Preset = 'fast' | 'stale' | 'margin' | null;

const STATUS_OPTIONS = [
  { v: 'active',   label: 'Beschikbaar' },
  { v: 'draft',    label: 'Concept' },
  { v: 'reserved', label: 'Gereserveerd' },
  { v: 'sold',     label: 'Verkocht' },
] as const;

export default function Inventory() {
  const { listings, loading, refresh } = useDealerAnalytics();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState<Preset>(null);

  // Median views — alleen nodig voor de "Snel verkopen" preset
  const medianViews = useMemo(() => {
    const arr = listings.filter((l) => l.status === 'active').map((l) => l.views).sort((a, b) => a - b);
    return arr.length ? arr[Math.floor(arr.length / 2)] : 0;
  }, [listings]);

  // ── Filter pipeline ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (statusFilter.size > 0 && !statusFilter.has(l.status)) return false;
      if (preset === 'fast' && !(l.views > medianViews && daysSince(l.createdAt) < 14)) return false;
      if (preset === 'stale' && daysSince(l.createdAt) < 60) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !l.title.toLowerCase().includes(q) &&
          !l.brand?.toLowerCase().includes(q) &&
          !l.model?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [listings, query, statusFilter, preset, medianViews]);

  // ── Selection & bulk ────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleStatus = (v: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };
  const togglePreset = (p: Exclude<Preset, null>) => setPreset((cur) => (cur === p ? null : p));

  const bulkAction = async (action: 'premium' | 'boost' | 'sold' | 'delete') => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (action === 'delete') {
      if (!confirm(`${ids.length} advertenties verwijderen?`)) return;
      const { error } = await supabase.from('listings').delete().in('id', ids);
      if (error) return toast.error('Verwijderen mislukt');
      toast.success(`${ids.length} verwijderd`);
    } else {
      const updates =
        action === 'premium' ? { is_premium: true } :
        action === 'boost'   ? { boost_until: new Date(Date.now() + 7 * 86400000).toISOString() } :
                               { status: 'sold' };
      const { error } = await supabase.from('listings').update(updates as any).in('id', ids);
      if (error) return toast.error('Bulkactie mislukt');
      toast.success(`${ids.length} bijgewerkt`);
    }
    setSelectedIds(new Set());
    refresh();
  };

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-5">
      <SEOHead title="Verkopen — VATUUR. Zakelijk" description="Sales feed voor je voorraad." noindex />

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" /> Verkopen
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Elke kaart is een beslis-unit. Insight zit waar je actie onderneemt.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link to="/verkopen?dealer=1"><Plus className="h-4 w-4" /> Voertuig toevoegen</Link>
        </Button>
      </div>


      {/* Filters */}
      <div className="space-y-2.5">
        {/* Smart presets */}
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {[
            { id: 'fast'   as const, label: 'Snel verkopen',   icon: Flame },
            { id: 'stale'  as const, label: 'Lang in voorraad', icon: TrendingDown },
          ].map((p) => {
            const active = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePreset(p.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border whitespace-nowrap transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border/60 hover:bg-muted'
                )}
              >
                <p.icon className="h-3.5 w-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Search + status chips */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative sm:w-72">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op titel, merk, model…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
            <button
              type="button"
              onClick={() => setStatusFilter(new Set())}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium border whitespace-nowrap transition-colors',
                statusFilter.size === 0
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border/60 hover:bg-muted'
              )}
            >
              Alle ({listings.length})
            </button>
            {STATUS_OPTIONS.map((c) => {
              const count = listings.filter((l) => l.status === c.v).length;
              const active = statusFilter.has(c.v);
              return (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => toggleStatus(c.v)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium border whitespace-nowrap transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground'
                  )}
                >
                  {c.label} <span className="opacity-70 ml-0.5">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-14 z-10 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 backdrop-blur p-2.5 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} geselecteerd</span>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('premium')}>
            <Crown className="h-3.5 w-3.5" /> Premium
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('boost')}>
            <Rocket className="h-3.5 w-3.5" /> Boost
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('sold')}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Verkocht
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={() => bulkAction('delete')}>
            <Trash2 className="h-3.5 w-3.5" /> Verwijder
          </Button>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        listings.length === 0 ? (
          <EmptyState />
        ) : (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-muted-foreground">
              Geen voertuigen met deze filters.
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((l) => (
            <DealerCard
              key={l.id}
              listing={l}
              selected={selectedIds.has(l.id)}
              onSelect={() => toggleSelect(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Decision-unit card ────────────────────────────────────────────────────
function DealerCard({
  listing: l,
  selected,
  onSelect,
}: {
  listing: ListingAnalytics;
  selected: boolean;
  onSelect: () => void;
}) {
  const isDraft = l.status === 'draft';
  const ageDays = daysSince(l.createdAt);

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all hover:shadow-card-hover hover:-translate-y-0.5 border-border/60',
        selected && 'ring-2 ring-primary',
        l.isPremium && 'border-premium/50 ring-1 ring-premium/20',
      )}
    >
      <div className="relative">
        <Link to={`/zakelijk/voorraad/${l.id}`} className="block aspect-[16/10] bg-muted overflow-hidden">
          <img
            src={l.image || '/placeholder.svg'}
            alt={l.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Checkbox */}
        <label
          className="absolute top-2 left-2 h-7 w-7 rounded-md bg-card/95 backdrop-blur flex items-center justify-center shadow-sm cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox checked={selected} onCheckedChange={onSelect} />
        </label>

        {/* Status badge top-right */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {l.isPremium && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-premium text-premium-foreground text-[10px] font-semibold px-2 py-0.5 shadow-sm">
              <Crown className="h-3 w-3" /> Top
            </span>
          )}
          <StatusBadge status={l.status} />
        </div>
      </div>

      <CardContent className="p-3.5 space-y-3">
        {/* Title + meta */}
        <div className="min-w-0">
          <Link
            to={`/zakelijk/voorraad/${l.id}`}
            className="block font-semibold text-sm leading-tight truncate hover:text-primary"
          >
            {l.title}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {l.year} · {l.mileage?.toLocaleString('nl-NL')} km · <span className="capitalize">{l.fuelType}</span>
          </p>
        </div>

        {/* Price row */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-bold text-foreground">{formatPrice(l.price)}</span>
          {/* margin pill — graceful: only render when backend later supplies marketDelta */}
        </div>

        {/* Mini-stats row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{l.views}</span>
          <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{l.favorites}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{l.messages}</span>
          <span className="inline-flex items-center gap-1 ml-auto"><Clock className="h-3 w-3" />{ageDays}d</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button asChild size="sm" className="flex-1 h-9 gap-1.5">
            <Link to={`/zakelijk/voorraad/${l.id}`}>
              {isDraft ? (
                <><PlayCircle className="h-4 w-4" /> Verkoop starten</>
              ) : (
                <><Pencil className="h-4 w-4" /> Bewerken</>
              )}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-9 px-2.5 gap-1.5 text-muted-foreground hover:text-primary" title="Vergelijk markt">
            <Link
              to={`/zoeken?brand=${encodeURIComponent(l.brand ?? '')}&model=${encodeURIComponent(l.model ?? '')}&yearMin=${(l.year ?? 0) - 1}&yearMax=${(l.year ?? 0) + 1}&compareWith=${l.id}`}
              aria-label="Vergelijk markt"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Markt</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-9 w-9" title="Publieke pagina">
            <Link to={`/auto/${l.id}`} target="_blank" aria-label="Publieke pagina">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <Card className="border-dashed border-border/60">
      <CardContent className="py-14 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Car className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Je eerste auto staat één klik weg</h3>
          <p className="text-sm text-muted-foreground">Binnen 2 minuten live voorraad.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
          <Button asChild size="lg" className="gap-1.5">
            <Link to="/verkopen?dealer=1"><Plus className="h-4 w-4" /> Eerste voertuig toevoegen</Link>
          </Button>
          <Button asChild variant="link" className="text-muted-foreground hover:text-primary">
            <Link to="/zakelijk/import">Of importeer via CSV</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

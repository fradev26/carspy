import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Heart, MessageCircle, Car, Crown, Rocket, Pencil, CheckCircle2,
  Search as SearchIcon, ExternalLink, Trash2, Plus, BarChart3,
  Clock, PlayCircle, RotateCcw, Settings as SettingsIcon, RefreshCw, Upload,
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
import { type ListingAnalytics } from '@/hooks/useDealerAnalytics';
import { useDealerInventoryInfinite } from '@/hooks/useDealerInventory';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { VirtualGrid } from '@/components/VirtualGrid';
import { InfiniteFeedFooter } from '@/components/InfiniteFeedFooter';
import { DEFAULT_PAGE_SIZE } from '@/lib/keyset';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { BoostDialog } from '@/components/boost/BoostDialog';
import { usePermissions } from '@/hooks/usePermissions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);

const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

const STATUS_OPTIONS = [
  { v: 'active',     label: 'Beschikbaar' },
  { v: 'boostable',  label: 'Boostbaar' },
  { v: 'draft',      label: 'Concept' },
  { v: 'reserved',   label: 'Gereserveerd' },
  { v: 'sold',       label: 'Verkocht' },
] as const;

const isBoostable = (l: ListingAnalytics) =>
  l.status === 'active' && (!l.boostUntil || new Date(l.boostUntil).getTime() <= Date.now());

export default function Inventory() {
  const perms = usePermissions();
  const { isLinked: autoScoutLinked } = useAutoScoutLink();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [boostDialog, setBoostDialog] = useState<{ ids: string[]; title?: string } | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);

  // Debounce the free-text query before it hits the cursor endpoint.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // 'boostable' is a derived state, not a DB status → refine client-side.
  const serverStatuses = useMemo(
    () => Array.from(statusFilter).filter((s) => s !== 'boostable'),
    [statusFilter],
  );

  const {
    listings,
    statusCounts,
    total,
    isLoading: loading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: feedError,
    refetch,
  } = useDealerInventoryInfinite({
    query: debouncedQuery,
    statuses: serverStatuses,
    limit: DEFAULT_PAGE_SIZE,
  });

  const refresh = () => refetch();

  useScrollRestoration(
    `inventory:${debouncedQuery}:${serverStatuses.join(',')}`,
    !loading && listings.length > 0,
  );

  // ── Client-side refinement (boostable only) ────────────────────────────
  const filtered = useMemo(
    () => (statusFilter.has('boostable') ? listings.filter(isBoostable) : listings),
    [listings, statusFilter],
  );

  const allSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));
  const someSelected = !allSelected && filtered.some((l) => selectedIds.has(l.id));

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filtered.forEach((l) => next.delete(l.id));
      } else {
        filtered.forEach((l) => next.add(l.id));
      }
      return next;
    });
  };

  const selectBoostable = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.filter(isBoostable).forEach((l) => next.add(l.id));
      return next;
    });
  };

  // ── Selection & bulk ────────────────────────────────────────────────────
  const toggleSelect = (id: string, opts?: { shift?: boolean }) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (opts?.shift && lastSelectedId && lastSelectedId !== id) {
        const ids = filtered.map((l) => l.id);
        const a = ids.indexOf(lastSelectedId);
        const b = ids.indexOf(id);
        if (a !== -1 && b !== -1) {
          const [from, to] = a < b ? [a, b] : [b, a];
          const shouldAdd = !next.has(id);
          for (let i = from; i <= to; i++) {
            if (shouldAdd) next.add(ids[i]);
            else next.delete(ids[i]);
          }
          return next;
        }
      }
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLastSelectedId(id);
  };
  const toggleStatus = (v: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const confirmBulkDelete = async () => {
    if (!deleteIds) return;
    const ids = deleteIds;
    setDeleteIds(null);
    const { error } = await supabase.from('listings').delete().in('id', ids);
    if (error) return toast.error('Verwijderen mislukt');
    toast.success(`${ids.length} advertentie${ids.length === 1 ? '' : 's'} verwijderd`);
    setSelectedIds(new Set());
    refresh();
  };

  const bulkAction = async (action: 'premium' | 'boost' | 'sold' | 'delete') => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (action === 'boost') {
      if (!perms.canBoost) return toast.error('Je hebt geen rechten om te boosten');
      setBoostDialog({ ids });
      return;
    }
    if (action === 'delete') {
      if (!perms.canDeleteListings) return toast.error('Je hebt geen rechten om advertenties te verwijderen');
      setDeleteIds(ids);
      return;
    }
    {
      if (!perms.canEditListings) return toast.error('Je hebt geen rechten om advertenties te bewerken');
      if (action === 'premium') {
        // Betaalde plaatsing: via de abonnements-gecontroleerde RPC per advertentie.
        const results = await Promise.all(
          ids.map((listingId) =>
            supabase.rpc('set_listing_premium', { _listing_id: listingId, _enabled: true }),
          ),
        );
        const failed = results.filter((r) => r.error).length;
        if (failed === ids.length) return toast.error('Premium vereist een actief betaald abonnement');
        if (failed > 0) toast.warning(`${ids.length - failed} bijgewerkt, ${failed} mislukt`);
        else toast.success(`${ids.length} bijgewerkt`);
      } else {
        const { error } = await supabase.from('listings').update({ status: 'sold' }).in('id', ids);
        if (error) return toast.error('Bulkactie mislukt');
        toast.success(`${ids.length} bijgewerkt`);
      }
    }
    setSelectedIds(new Set());
    refresh();
  };



  if (loading) {
    return (
      <div className="container py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (feedError && listings.length === 0) {
    return (
      <div className="container py-12">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <p className="text-sm">Je voorraad kon niet geladen worden.</p>
            <Button variant="outline" onClick={() => refetch()}>Opnieuw proberen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-5">
      <SEOHead title="Zakelijk — VATUUR." description="Sales feed voor je voorraad." noindex />

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Voorraad</h1>
          <p className="text-xs text-muted-foreground">{total} advertenties</p>
        </div>
        <div className="flex items-center gap-2">
          {perms.canEditListings && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to={autoScoutLinked ? '/zakelijk/import#autoscout' : '/zakelijk/import'}>
                {autoScoutLinked ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" /> Sync
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" /> Importeren
                  </>
                )}
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/zakelijk/voorraad-instellingen">
              <SettingsIcon className="h-3.5 w-3.5" /> Voorkeuren
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2.5">
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
              Alle ({total})
            </button>
            {STATUS_OPTIONS.map((c) => {
              const count = statusCounts[c.v] ?? 0;
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

      {/* Selection toolbar */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={toggleSelectAllFiltered}
            />
            <span>
              {allSelected
                ? `Alles gedeselecteerd ${filtered.length}`
                : `Selecteer alle ${filtered.length} zichtbare`}
            </span>
          </label>
          <button
            type="button"
            onClick={selectBoostable}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 hover:bg-muted text-foreground"
          >
            <Rocket className="h-3 w-3" /> Selecteer boostbare ({filtered.filter(isBoostable).length})
          </button>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Selectie wissen
            </button>
          )}
        </div>
      )}

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-14 z-10 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 backdrop-blur p-2.5 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} geselecteerd</span>
          {perms.canBoost && (
            <Button size="sm" className="gap-1.5" onClick={() => bulkAction('boost')}>
              <Rocket className="h-3.5 w-3.5" /> Boost {selectedIds.size}
            </Button>
          )}
          {perms.canEditListings && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('premium')}>
                <Crown className="h-3.5 w-3.5" /> Premium
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => bulkAction('sold')}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Verkocht
              </Button>
            </>
          )}
          {perms.canDeleteListings && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={() => bulkAction('delete')}>
              <Trash2 className="h-3.5 w-3.5" /> Verwijder
            </Button>
          )}
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
        <>
          <VirtualGrid
            items={filtered}
            getKey={(l) => l.id}
            columns={[1, 2, 3]}
            estimateRowHeight={370}
            renderItem={(l) => (
              <DealerCard
                listing={l}
                selected={selectedIds.has(l.id)}
                onSelect={(shift) => toggleSelect(l.id, { shift })}
                onBoost={() => setBoostDialog({ ids: [l.id], title: l.title })}
                onRelist={async () => {
                  if (!perms.canEditListings) return toast.error('Je hebt geen rechten om advertenties te bewerken');
                  const { error } = await supabase
                    .from('listings')
                    .update({ status: 'active', sold_at: null })
                    .eq('id', l.id);
                  if (error) return toast.error('Opnieuw plaatsen mislukt');
                  toast.success('Advertentie staat weer te koop');
                  refresh();
                }}
              />
            )}
          />

          <InfiniteFeedFooter
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            error={feedError}
            onLoadMore={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onRetry={() => fetchNextPage()}
            skeletonCount={3}
            endLabel="Je hebt je volledige voorraad gezien"
          />
        </>
      )}

      <BoostDialog
        open={boostDialog !== null}
        onOpenChange={(v) => !v && setBoostDialog(null)}
        listingId={boostDialog?.ids.length === 1 ? boostDialog.ids[0] : undefined}
        listingTitle={boostDialog?.title}
        lockedListing={boostDialog?.ids.length === 1}
        bulkListingIds={boostDialog && boostDialog.ids.length > 1 ? boostDialog.ids : undefined}
        onSuccess={() => {
          setSelectedIds(new Set());
          refresh();
        }}
      />

      <AlertDialog open={deleteIds !== null} onOpenChange={(v) => !v && setDeleteIds(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteIds?.length === 1
                ? 'Advertentie verwijderen?'
                : `${deleteIds?.length ?? 0} advertenties verwijderen?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dit kan niet ongedaan gemaakt worden. De advertenties verdwijnen direct uit het zoekaanbod.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Decision-unit card ────────────────────────────────────────────────────
function DealerCard({
  listing: l,
  selected,
  onSelect,
  onBoost,
  onRelist,
}: {
  listing: ListingAnalytics;
  selected: boolean;
  onSelect: (shift?: boolean) => void;
  onBoost: () => void;
  onRelist: () => void;
}) {
  const isDraft = l.status === 'draft';
  const isSold = l.status === 'sold';
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
        <button
          type="button"
          aria-label={selected ? 'Deselecteer' : 'Selecteer'}
          title="Shift-klik om een bereik te selecteren"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSelect(e.shiftKey);
          }}
          className="absolute top-2 left-2 h-7 w-7 rounded-md bg-card/95 backdrop-blur flex items-center justify-center shadow-sm cursor-pointer"
        >
          <Checkbox checked={selected} className="pointer-events-none" />
        </button>

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
            className="block font-semibold text-sm leading-tight truncate hover:text-primary-strong"
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
          {isSold ? (
            <Button size="sm" className="flex-1 h-9 gap-1.5" onClick={onRelist}>
              <RotateCcw className="h-4 w-4" /> Terug te koop
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="flex-1 h-9 gap-1.5">
                <Link to={`/zakelijk/voorraad/${l.id}`}>
                  {isDraft ? (
                    <><PlayCircle className="h-4 w-4" /> Verkoop starten</>
                  ) : (
                    <><Pencil className="h-4 w-4" /> Bewerken</>
                  )}
                </Link>
              </Button>
              <Button size="sm" className="flex-1 h-9 gap-1.5" title="Boosten" onClick={onBoost}>
                <Rocket className="h-4 w-4" />
                Boosten
              </Button>
            </>
          )}
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0 transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground" title="Vergelijk markt">
            <Link
              to={`/zoeken?brand=${encodeURIComponent(l.brand ?? '')}&model=${encodeURIComponent(l.model ?? '')}&yearMin=${(l.year ?? 0) - 1}&yearMax=${(l.year ?? 0) + 1}&compareWith=${l.id}`}
              aria-label="Vergelijk markt"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="sr-only">Markt</span>
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
          <Car className="h-6 w-6 text-primary-strong" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Je eerste auto staat één klik weg</h3>
          <p className="text-sm text-muted-foreground">Binnen 2 minuten live voorraad.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
          <Button asChild size="lg" className="gap-1.5">
            <Link to="/verkopen?dealer=1"><Plus className="h-4 w-4" /> Eerste voertuig toevoegen</Link>
          </Button>
          <Button asChild variant="link" className="text-muted-foreground hover:text-primary-strong">
            <Link to="/zakelijk/import">Of importeer via CSV</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart,
  Clock,
  Bell,
  Search as SearchIcon,
  Trash2,
  Pause,
  Play,
  Eye,
  GitCompare,
  LogIn,
  Pencil,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ListingGrid } from '@/modules/listings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useCompare } from '@/hooks/useCompare';
import { useToast } from '@/hooks/use-toast';
import { useRecentlyViewedListings } from '@/hooks/useRecentlyViewedListings';
import { Listing } from '@/types/listing';

type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'mileage-asc' | 'year-desc';

const VALID_TABS = ['favorieten', 'recent', 'alerts'] as const;
type TabKey = (typeof VALID_TABS)[number];

const fmtPrice = (p: number | null | undefined) =>
  p == null
    ? '—'
    : new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
      }).format(p);

const rtf = new Intl.RelativeTimeFormat('nl-NL', { numeric: 'auto' });
function relTime(ts: number): string {
  const diff = (ts - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return new Date(ts).toLocaleDateString('nl-NL');
}

export default function Favorites() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = (VALID_TABS as readonly string[]).includes(rawTab ?? '')
    ? (rawTab as TabKey)
    : 'favorieten';

  const onTabChange = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === 'favorieten') next.delete('tab');
    else next.set('tab', v);
    setSearchParams(next, { replace: true });
  };

  // Logged-out gate
  if (!user) {
    return (
      <div className="container py-12">
        <SEOHead
          title="Mijn activiteiten — VATUUR."
          description="Log in om je favorieten, recent bekeken wagens en zoekalerts te beheren."
          noindex
        />
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 text-xl font-bold">Bewaar wagens, alerts en geschiedenis</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Meld je aan om favorieten op te slaan, je zoekalerts te beheren en je recent bekeken
            wagens terug te vinden op al je toestellen.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild className="w-full gap-2">
              <Link to="/auth" state={{ from: location }}>
                <LogIn className="h-4 w-4" />
                Inloggen of registreren
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full gap-2">
              <Link to="/zoeken">
                <SearchIcon className="h-4 w-4" />
                Eerst wagens bekijken
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8">
      <SEOHead
        title="Mijn activiteiten — VATUUR."
        description="Beheer je favoriete voertuigen, recente bezoeken en zoekalerts op één plek."
        noindex
      />

      <header className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Mijn activiteiten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Beheer je favoriete voertuigen, recente bezoeken en zoekalerts.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-4 mb-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:top-16">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto w-full min-w-max gap-1 bg-muted p-1 sm:w-auto">
              <TabsTrigger value="favorieten" className="gap-2 px-3 py-2">
                <Heart className="h-4 w-4" /> Favorieten
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2 px-3 py-2">
                <Clock className="h-4 w-4" /> Recent bekeken
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2 px-3 py-2">
                <Bell className="h-4 w-4" /> Zoekalerts
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="favorieten" className="mt-0">
          <FavoritesTab />
        </TabsContent>
        <TabsContent value="recent" className="mt-0">
          <RecentTab />
        </TabsContent>
        <TabsContent value="alerts" className="mt-0">
          <AlertsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Favorites ---------------- */

function FavoritesTab() {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { items: compareItems } = useCompare();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('recent');

  useEffect(() => {
    if (!user) return;
    const ids = Array.from(favorites);
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('listings')
      .select('*')
      .in('id', ids)
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setListings(
            data.map((l) => ({
              id: l.id,
              title: l.title,
              brand: l.brand,
              model: l.model,
              year: l.year,
              price: l.price,
              mileage: l.mileage,
              fuelType: l.fuel_type as Listing['fuelType'],
              transmission: l.transmission as Listing['transmission'],
              bodyType: l.body_type as Listing['bodyType'],
              color: l.color || '',
              power: l.power || 0,
              engineSize: l.engine_size || 0,
              doors: l.doors || 5,
              seats: l.seats || 5,
              images: l.images || [],
              description: l.description || '',
              features: l.features || [],
              location: { city: l.city || '', province: l.province || '' },
              seller: {
                id: l.user_id,
                name: 'Verkoper',
                type: 'private' as const,
                memberSince: '',
              },
              createdAt: l.created_at,
              updatedAt: l.updated_at,
              views: l.views,
              status: l.status as Listing['status'],
            })),
          );
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, favorites]);

  const sorted = useMemo(() => {
    const arr = [...listings];
    switch (sort) {
      case 'price-asc':
        return arr.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return arr.sort((a, b) => b.price - a.price);
      case 'mileage-asc':
        return arr.sort((a, b) => a.mileage - b.mileage);
      case 'year-desc':
        return arr.sort((a, b) => b.year - a.year);
      default:
        return arr.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  }, [listings, sort]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Nog geen favorieten"
        text="Sla voertuigen op door op het hartje te klikken."
        ctaLabel="Wagens zoeken"
        ctaTo="/zoeken"
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {listings.length} {listings.length === 1 ? 'wagen' : 'wagens'}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {compareItems.length > 0 && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/vergelijken">
                <GitCompare className="h-4 w-4" />
                Vergelijken ({compareItems.length})
              </Link>
            </Button>
          )}
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger aria-label="Sorteer favorieten" className="h-9 w-[170px]">
              <SelectValue placeholder="Sorteren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Nieuwste eerst</SelectItem>
              <SelectItem value="price-asc">Prijs laag → hoog</SelectItem>
              <SelectItem value="price-desc">Prijs hoog → laag</SelectItem>
              <SelectItem value="mileage-asc">Laagste km-stand</SelectItem>
              <SelectItem value="year-desc">Nieuwste bouwjaar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ListingGrid listings={sorted} columns={3} />
    </div>
  );
}

/* ---------------- Recent ---------------- */

function RecentTab() {
  const { items, clear, removeOne } = useRecentlyViewedListings();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Nog geen bekeken voertuigen"
        text="Voertuigen die je bekijkt verschijnen hier automatisch."
        ctaLabel="Wagens zoeken"
        ctaTo="/zoeken"
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Badge variant="secondary" className="rounded-full">
          {items.length} {items.length === 1 ? 'wagen' : 'wagens'}
        </Badge>
        <Button variant="outline" size="sm" className="gap-2" onClick={clear}>
          <Trash2 className="h-4 w-4" />
          Wis alles
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={it.id} className="overflow-hidden transition hover:shadow-md">
            <Link to={`/auto/${it.id}`} className="block">
              <img
                src={it.image || '/placeholder.svg'}
                alt={it.title}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            </Link>
            <CardContent className="p-4">
              <Link
                to={`/auto/${it.id}`}
                className="line-clamp-1 font-semibold hover:text-primary"
              >
                {it.title}
              </Link>
              <p className="mt-1 text-lg font-bold text-accent">{fmtPrice(it.price)}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">{it.city ?? ''}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {relTime(it.viewedAt)}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 gap-2">
                  <Link to={`/auto/${it.id}`}>
                    <Eye className="h-4 w-4" />
                    Bekijken
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeOne(it.id)}
                  aria-label="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Alerts ---------------- */

interface AlertRow {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
  paused: boolean;
  frequency: string;
  last_notified_at: string | null;
}

function summarize(f: Record<string, unknown>): string {
  const parts: string[] = [];
  if (f.brand) parts.push(String(f.brand));
  if (f.model) parts.push(String(f.model));
  if (f.fuelType) parts.push(String(f.fuelType));
  if (f.minPrice || f.maxPrice) parts.push(`€${f.minPrice ?? 0} – €${f.maxPrice ?? '∞'}`);
  if (f.minYear) parts.push(`≥ ${f.minYear}`);
  if (f.location || f.province) parts.push(String(f.location ?? f.province));
  return parts.join(' · ') || 'Alle wagens';
}

function freqLabel(f: string): string {
  return f === 'instant' ? 'Direct' : f === 'weekly' ? 'Wekelijks' : 'Dagelijks';
}

async function countNewMatches(a: AlertRow): Promise<number> {
  const since = a.last_notified_at ?? a.created_at;
  let q = supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gt('created_at', since);
  const f = a.filters || {};
  if (f.brand) q = q.eq('brand', String(f.brand));
  if (f.model) q = q.eq('model', String(f.model));
  if (f.fuelType) q = q.eq('fuel_type', String(f.fuelType));
  if (f.bodyType) q = q.eq('body_type', String(f.bodyType));
  if (f.transmission) q = q.eq('transmission', String(f.transmission));
  if (f.province) q = q.eq('province', String(f.province));
  if (f.minPrice) q = q.gte('price', Number(f.minPrice));
  if (f.maxPrice) q = q.lte('price', Number(f.maxPrice));
  if (f.minYear) q = q.gte('year', Number(f.minYear));
  if (f.maxMileage) q = q.lte('mileage', Number(f.maxMileage));
  const { count } = await q;
  return count ?? 0;
}

function AlertsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCounts, setNewCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<AlertRow | null>(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState<AlertRow | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('saved_searches')
      .select('id, name, filters, created_at, paused, frequency, last_notified_at')
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        if (cancelled) return;
        const rows = (data ?? []) as AlertRow[];
        setAlerts(rows);
        setLoading(false);
        const entries = await Promise.all(
          rows.map(async (r) => [r.id, await countNewMatches(r)] as const),
        );
        if (!cancelled) setNewCounts(Object.fromEntries(entries));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function togglePause(a: AlertRow) {
    const { error } = await supabase
      .from('saved_searches')
      .update({ paused: !a.paused })
      .eq('id', a.id);
    if (error) return toast({ title: 'Fout bij bijwerken', variant: 'destructive' });
    setAlerts((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, paused: !x.paused } : x)),
    );
    toast({ title: a.paused ? 'Alert hervat' : 'Alert gepauzeerd' });
  }

  async function changeFreq(a: AlertRow, frequency: string) {
    const { error } = await supabase
      .from('saved_searches')
      .update({ frequency })
      .eq('id', a.id);
    if (error) return toast({ title: 'Fout bij bijwerken', variant: 'destructive' });
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, frequency } : x)));
    toast({ title: 'Frequentie aangepast' });
  }

  async function saveName() {
    if (!editing) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast({ title: 'Naam mag niet leeg zijn', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('saved_searches')
      .update({ name: trimmed })
      .eq('id', editing.id);
    if (error) return toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    setAlerts((prev) =>
      prev.map((x) => (x.id === editing.id ? { ...x, name: trimmed } : x)),
    );
    setEditing(null);
    toast({ title: 'Naam bijgewerkt' });
  }

  async function confirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (error) return toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    setAlerts((prev) => prev.filter((x) => x.id !== id));
    setDeleting(null);
    toast({ title: 'Alert verwijderd' });
  }

  async function openResults(a: AlertRow) {
    // Stamp last_notified_at so the "nieuwe" badge resets
    const now = new Date().toISOString();
    await supabase
      .from('saved_searches')
      .update({ last_notified_at: now })
      .eq('id', a.id);
    setAlerts((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, last_notified_at: now } : x)),
    );
    setNewCounts((prev) => ({ ...prev, [a.id]: 0 }));

    const params = new URLSearchParams();
    Object.entries(a.filters).forEach(([k, v]) => {
      if (v != null && v !== '')
        params.set(k, Array.isArray(v) ? v.join(',') : String(v));
    });
    navigate(`/zoeken?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Nog geen zoekalerts"
        text="Maak een zoekalert aan en ontvang automatisch nieuwe matches."
        ctaLabel="Zoekalert aanmaken"
        ctaTo="/zoeken"
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Badge variant="secondary" className="rounded-full">
          {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
        </Badge>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/zoeken">
            <SearchIcon className="h-4 w-4" />
            Nieuwe zoekalert
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => {
          const newCount = newCounts[a.id] ?? 0;
          const lastUpdate = a.last_notified_at ?? a.created_at;
          return (
            <Card key={a.id} className={a.paused ? 'opacity-70' : ''}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">{a.name}</h3>
                    {a.paused ? (
                      <Badge variant="secondary" className="gap-1">
                        <Pause className="h-3 w-3" /> Gepauzeerd
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
                        <Play className="h-3 w-3" /> Actief
                      </Badge>
                    )}
                    {!a.paused && newCount > 0 && (
                      <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Sparkles className="h-3 w-3" />
                        {newCount} nieuw{newCount === 1 ? '' : 'e'}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-normal">
                      {freqLabel(a.frequency)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 truncate text-xs text-muted-foreground">
                    {summarize(a.filters)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Laatste update:{' '}
                    {new Date(lastUpdate).toLocaleDateString('nl-NL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => openResults(a)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Bekijk resultaten
                  </Button>
                  <Select value={a.frequency} onValueChange={(v) => changeFreq(a, v)}>
                    <SelectTrigger className="h-9 w-32" aria-label="Frequentie">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Direct</SelectItem>
                      <SelectItem value="daily">Dagelijks</SelectItem>
                      <SelectItem value="weekly">Wekelijks</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => togglePause(a)}
                  >
                    {a.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {a.paused ? 'Hervat' : 'Pauzeer'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Bewerken"
                    onClick={() => {
                      setEditing(a);
                      setEditName(a.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleting(a)}
                    aria-label="Verwijder alert"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rename dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zoekalert bewerken</DialogTitle>
            <DialogDescription>
              Pas de naam van je zoekalert aan. De zoekcriteria kun je aanpassen via
              "Bekijk resultaten" en daar opnieuw opslaan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="alert-name">Naam</Label>
            <Input
              id="alert-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Bijv. Audi A4 onder €25.000"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
              }}
            />
            {editing && (
              <p className="text-xs text-muted-foreground">{summarize(editing.filters)}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuleren
            </Button>
            <Button onClick={saveName}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zoekalert verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" wordt definitief verwijderd. Je ontvangt geen meldingen
              meer voor deze zoekopdracht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

/* ---------------- Shared empty state ---------------- */

function EmptyState({
  icon: Icon,
  title,
  text,
  ctaLabel,
  ctaTo,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  ctaLabel: string;
  ctaTo: string;
}) {
  return (
    <Card className="mt-2">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
        <Button asChild className="mt-2 gap-2">
          <Link to={ctaTo}>
            <SearchIcon className="h-4 w-4" />
            {ctaLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

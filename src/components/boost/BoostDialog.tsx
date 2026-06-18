import { useEffect, useMemo, useState } from 'react';
import { Rocket, Zap, Flame, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatEUR = (cents: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

type Pkg = {
  id: string;
  code: string;
  name: string;
  duration_days: number;
  price_cents: number;
};

type Billing = {
  plan_name: string | null;
  included_turbo: number;
  included_nitro: number;
  used_turbo: number;
  used_nitro: number;
};

type ListingOpt = { id: string; title: string; price?: number | null; image?: string | null };

type BoostDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listingId?: string;
  listingTitle?: string;
  /** When true, hide listing selector (use listingId). */
  lockedListing?: boolean;
  /** Bulk mode: boost a list of listings sequentially. */
  bulkListingIds?: string[];
  onSuccess?: () => void;
};

// Run async tasks with a concurrency cap, reporting progress.
async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
  onProgress?: (done: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  let done = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i]);
      done++;
      onProgress?.(done);
    }
  });
  await Promise.all(runners);
  return results;
}

export function BoostDialog({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  lockedListing,
  bulkListingIds,
  onSuccess,
}: BoostDialogProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<string>('turbo');
  const [selectedListing, setSelectedListing] = useState<string | undefined>(listingId);
  const [ownListings, setOwnListings] = useState<ListingOpt[]>([]);
  const [bulkDetails, setBulkDetails] = useState<ListingOpt[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState<{ id: string; title: string; error: string }[]>([]);

  useEffect(() => {
    setSelectedListing(listingId);
  }, [listingId]);

  // Reset state when dialog opens/closes or target changes
  useEffect(() => {
    if (!open) {
      setExcluded(new Set());
      setFailed([]);
      setProgress(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const [{ data: pkgs }, { data: bill }] = await Promise.all([
        supabase.from('boost_packages').select('*').order('sort_order'),
        supabase.rpc('get_current_billing', { _user_id: user.id }),
      ]);
      if (pkgs) setPackages(pkgs as Pkg[]);
      if (bill) setBilling(bill as unknown as Billing);
      if (!lockedListing && !bulkListingIds) {
        const { data } = await supabase
          .from('listings')
          .select('id, title, price, images')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(100);
        setOwnListings(
          ((data ?? []) as any[]).map((d) => ({
            id: d.id,
            title: d.title,
            price: d.price,
            image: d.images?.[0] ?? null,
          })),
        );
      }
      if (bulkListingIds && bulkListingIds.length > 0) {
        const { data } = await supabase
          .from('listings')
          .select('id, title, price, images')
          .in('id', bulkListingIds);
        setBulkDetails(
          ((data ?? []) as any[]).map((d) => ({
            id: d.id,
            title: d.title,
            price: d.price,
            image: d.images?.[0] ?? null,
          })),
        );
      } else {
        setBulkDetails([]);
      }
    })();
  }, [open, user, lockedListing, bulkListingIds]);

  const remaining = useMemo(() => {
    if (!billing) return { turbo: 0, nitro: 0 };
    return {
      turbo: Math.max(0, billing.included_turbo - billing.used_turbo),
      nitro: Math.max(0, billing.included_nitro - billing.used_nitro),
    };
  }, [billing]);

  // Determine target ids (single or bulk minus excluded)
  const targets: string[] = useMemo(() => {
    if (bulkListingIds && bulkListingIds.length > 0) {
      return bulkListingIds.filter((id) => !excluded.has(id));
    }
    return selectedListing ? [selectedListing] : [];
  }, [bulkListingIds, excluded, selectedListing]);

  const activePkg = packages.find((p) => p.code === selectedPkg);

  // Cost breakdown: how many from quota vs extra
  const breakdown = useMemo(() => {
    if (!activePkg) return { fromQuota: 0, extraCount: 0, extraCents: 0 };
    const quota = activePkg.code === 'turbo' ? remaining.turbo : remaining.nitro;
    const fromQuota = Math.min(targets.length, quota);
    const extraCount = Math.max(0, targets.length - fromQuota);
    return {
      fromQuota,
      extraCount,
      extraCents: extraCount * activePkg.price_cents,
    };
  }, [activePkg, remaining, targets.length]);

  // Suggest the package that maximises free quota usage
  const bestPkg = useMemo(() => {
    if (packages.length === 0 || targets.length === 0) return null;
    let best: { code: string; free: number } | null = null;
    for (const p of packages) {
      const free = Math.min(targets.length, p.code === 'turbo' ? remaining.turbo : remaining.nitro);
      if (!best || free > best.free) best = { code: p.code, free };
    }
    return best && best.free > 0 ? best.code : null;
  }, [packages, targets.length, remaining]);

  const handleActivate = async () => {
    if (!activePkg) return;
    if (targets.length === 0) {
      toast.error('Selecteer eerst een wagen');
      return;
    }
    setLoading(true);
    setFailed([]);
    setProgress({ done: 0, total: targets.length });

    const errors: { id: string; title: string; error: string }[] = [];
    let extraSum = 0;
    let ok = 0;

    await runWithConcurrency(
      targets,
      async (id) => {
        const { data, error } = await supabase.rpc('activate_boost', {
          _listing_id: id,
          _package_code: activePkg.code,
        });
        if (error) {
          const title =
            bulkDetails.find((d) => d.id === id)?.title ?? listingTitle ?? id.slice(0, 8);
          errors.push({ id, title, error: error.message });
          return;
        }
        const res = data as { source: string; price_cents: number } | null;
        if (res) {
          extraSum += res.source === 'extra' ? res.price_cents : 0;
          ok += 1;
        }
      },
      6,
      (done) => setProgress({ done, total: targets.length }),
    );

    setLoading(false);
    setProgress(null);
    setFailed(errors);

    if (ok > 0) {
      toast.success(
        extraSum > 0
          ? `${ok} wagen(s) geboost · extra kost ${formatEUR(extraSum)} deze maand`
          : `${ok} wagen(s) geboost vanuit je abonnement`,
      );
      onSuccess?.();
      if (errors.length === 0) onOpenChange(false);
    } else if (errors.length > 0) {
      toast.error(`Boost mislukt voor ${errors.length} wagen(s)`);
    }
  };

  const isBulk = bulkListingIds && bulkListingIds.length > 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            {isBulk ? `${targets.length} wagens boosten` : 'Wagen boosten'}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? 'Controleer de selectie en kies je pakket — alles wordt tegelijk geboost.'
              : 'Verhoog je zichtbaarheid en verkoop sneller.'}
          </DialogDescription>
        </DialogHeader>

        {!lockedListing && !bulkListingIds && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Wagen</label>
            <Select value={selectedListing} onValueChange={setSelectedListing}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een wagen…" />
              </SelectTrigger>
              <SelectContent>
                {ownListings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {lockedListing && listingTitle && !isBulk && (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground text-xs">Wagen:</span>{' '}
            <span className="font-medium">{listingTitle}</span>
          </div>
        )}

        {/* Bulk: thumbnail list with deselect */}
        {isBulk && bulkDetails.length > 0 && (
          <div className="max-h-44 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/60">
            {bulkDetails.map((d) => {
              const isExcluded = excluded.has(d.id);
              return (
                <div
                  key={d.id}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 text-sm',
                    isExcluded && 'opacity-40',
                  )}
                >
                  <img
                    src={d.image || '/placeholder.svg'}
                    alt=""
                    className="h-9 w-12 rounded object-cover bg-muted shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{d.title}</div>
                    {d.price != null && (
                      <div className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat('nl-BE', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0,
                        }).format(d.price)}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExcluded((prev) => {
                        const next = new Set(prev);
                        next.has(d.id) ? next.delete(d.id) : next.add(d.id);
                        return next;
                      })
                    }
                    className="text-muted-foreground hover:text-destructive p-1"
                    aria-label={isExcluded ? 'Opnieuw toevoegen' : 'Uit selectie'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Cost summary */}
        {activePkg && targets.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm space-y-1">
            <div className="font-medium">
              {targets.length} wagen(s) · {activePkg.name} ({activePkg.duration_days} d)
            </div>
            <div className="text-xs text-muted-foreground">
              {breakdown.fromQuota > 0 && (
                <div>→ {breakdown.fromQuota} uit je abonnement (gratis)</div>
              )}
              {breakdown.extraCount > 0 && (
                <div>
                  → {breakdown.extraCount} × {formatEUR(activePkg.price_cents)} ={' '}
                  <span className="font-semibold text-foreground">
                    {formatEUR(breakdown.extraCents)} extra
                  </span>
                </div>
              )}
              {breakdown.extraCount === 0 && breakdown.fromQuota === targets.length && (
                <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Geen extra kosten
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {packages.map((p) => {
            const isActive = selectedPkg === p.code;
            const rem = p.code === 'turbo' ? remaining.turbo : remaining.nitro;
            const Icon = p.code === 'turbo' ? Zap : Flame;
            const isBest = bestPkg === p.code && !isActive;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPkg(p.code)}
                className={cn(
                  'relative rounded-xl border p-3 text-left transition-all',
                  isActive
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                    : 'border-border/60 hover:bg-muted/40',
                )}
              >
                {isBest && (
                  <span className="absolute -top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[10px] font-semibold px-1.5 py-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Beste keuze
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="mt-2 font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.duration_days} dagen</div>
                <div className="mt-2 text-base font-bold">{formatEUR(p.price_cents)}</div>
                <div className="mt-1">
                  {rem > 0 ? (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {rem} inbegrepen
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      Extra kost
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress while running */}
        {progress && (
          <div className="space-y-1.5">
            <Progress value={(progress.done / progress.total) * 100} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {progress.done} / {progress.total} geboost…
            </div>
          </div>
        )}

        {/* Failed retry block */}
        {failed.length > 0 && !progress && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {failed.length} mislukt
            </div>
            <ul className="space-y-0.5 max-h-24 overflow-y-auto">
              {failed.map((f) => (
                <li key={f.id} className="truncate">
                  • {f.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuleren
          </Button>
          <Button onClick={handleActivate} disabled={loading || targets.length === 0} className="gap-1.5">
            <Rocket className="h-4 w-4" />
            {loading
              ? 'Bezig…'
              : failed.length > 0
                ? `Probeer ${failed.length} opnieuw`
                : `Activeren${targets.length > 1 ? ` (${targets.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BoostDialog;

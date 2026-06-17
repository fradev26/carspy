import { useEffect, useMemo, useState } from 'react';
import { Rocket, Zap, Flame, Check } from 'lucide-react';
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

type ListingOpt = { id: string; title: string };

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedListing(listingId);
  }, [listingId]);

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
          .select('id, title')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(100);
        setOwnListings((data ?? []) as ListingOpt[]);
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

  const activePkg = packages.find((p) => p.code === selectedPkg);
  const willBeExtra =
    activePkg &&
    ((activePkg.code === 'turbo' && remaining.turbo <= 0) ||
      (activePkg.code === 'nitro' && remaining.nitro <= 0));

  const targets = bulkListingIds && bulkListingIds.length > 0 ? bulkListingIds : selectedListing ? [selectedListing] : [];
  const totalExtra = willBeExtra && activePkg ? activePkg.price_cents * targets.length : 0;

  const handleActivate = async () => {
    if (!activePkg) return;
    if (targets.length === 0) {
      toast.error('Selecteer eerst een wagen');
      return;
    }
    setLoading(true);
    let extraSum = 0;
    let ok = 0;
    for (const id of targets) {
      const { data, error } = await supabase.rpc('activate_boost', {
        _listing_id: id,
        _package_code: activePkg.code,
      });
      if (error) {
        toast.error(`Boost mislukt: ${error.message}`);
        continue;
      }
      const res = data as { source: string; price_cents: number } | null;
      if (res) {
        extraSum += res.source === 'extra' ? res.price_cents : 0;
        ok += 1;
      }
    }
    setLoading(false);
    if (ok > 0) {
      toast.success(
        extraSum > 0
          ? `${ok} wagen(s) geboost · extra kost ${formatEUR(extraSum)} deze maand`
          : `${ok} wagen(s) geboost vanuit je abonnement`,
      );
      onSuccess?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Wagen boosten
          </DialogTitle>
          <DialogDescription>
            {bulkListingIds && bulkListingIds.length > 1
              ? `${bulkListingIds.length} wagens worden tegelijk geboost.`
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

        {lockedListing && listingTitle && (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground text-xs">Wagen:</span>{' '}
            <span className="font-medium">{listingTitle}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {packages.map((p) => {
            const isActive = selectedPkg === p.code;
            const rem = p.code === 'turbo' ? remaining.turbo : remaining.nitro;
            const Icon = p.code === 'turbo' ? Zap : Flame;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPkg(p.code)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  isActive
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                    : 'border-border/60 hover:bg-muted/40',
                )}
              >
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

        {willBeExtra && targets.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs">
            Je quota is op. Deze boost{targets.length > 1 ? 's tellen' : ' telt'} als{' '}
            <span className="font-semibold">extra kost van {formatEUR(totalExtra)}</span> bovenop je
            abonnement deze maand.
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuleren
          </Button>
          <Button onClick={handleActivate} disabled={loading || targets.length === 0} className="gap-1.5">
            <Rocket className="h-4 w-4" />
            {loading ? 'Bezig…' : 'Activeren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BoostDialog;

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Rocket,
  Camera,
  Tag,
  Flag,
  Megaphone,
  FileText,
  Star,
  ChevronRight,
  Eye,
  Heart,
  Users,
  Sparkles,
  ExternalLink,
  Save,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Loader2,
  LucideIcon,
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { StatusBadge } from '@/modules/listings/StatusBadge';
import { BoostDialog } from '@/components/boost/BoostDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatPrice = (p: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(p);

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  views: number;
  images: string[] | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  power: number | null;
  color: string | null;
  body_type: string | null;
  is_premium: boolean | null;
  created_at: string;
  user_id: string | null;
}

type SheetKey =
  | null
  | 'photos'
  | 'price'
  | 'status'
  | 'publication'
  | 'description'
  | 'feature'
  | `spec:${string}`;

const STATUS_OPTIONS = [
  { v: 'active', label: 'Actief' },
  { v: 'draft', label: 'Concept' },
  { v: 'reserved', label: 'Gereserveerd' },
  { v: 'sold', label: 'Verkocht' },
] as const;

export default function ListingOperating() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(0);
  const [messages, setMessages] = useState(0);
  const [autoScout, setAutoScout] = useState<{ status: string; last_sync_at: string | null } | null>(null);

  const perms = usePermissions();
  const [denied, setDenied] = useState(false);
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [boostOpen, setBoostOpen] = useState(false);

  // Pending edits buffer (sticky save)
  const [pending, setPending] = useState<Partial<Listing>>({});
  const [saving, setSaving] = useState(false);
  const hasPending = Object.keys(pending).length > 0;

  const view: Listing | null = useMemo(
    () => (listing ? { ...listing, ...pending } : null),
    [listing, pending],
  );

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select(
        'id,title,description,price,status,views,images,brand,model,year,mileage,fuel_type,transmission,power,color,body_type,is_premium,created_at,user_id,company_id',
      )
      .eq('id', id)
      .maybeSingle();

    // Ownership guard: only the listing owner or a member of the owning company
    // may open the management view (defence in depth on top of RLS).
    if (data) {
      const row = data as Listing & { company_id?: string | null };
      let allowed = !!user && row.user_id === user.id;
      if (!allowed && row.company_id) {
        const { data: myCompany } = await supabase.rpc('current_company_id');
        allowed = !!myCompany && myCompany === row.company_id;
      }
      if (!allowed) {
        setDenied(true);
        setLoading(false);
        return;
      }
      setListing(row as Listing);
    }

    const sb = supabase as any;
    const [{ count: favCount }, { count: msgCount }, autoRes] = await Promise.all([
      sb.from('favorites').select('*', { count: 'exact', head: true }).eq('listing_id', id),
      sb.from('messages').select('*', { count: 'exact', head: true }).eq('listing_id', id),
      sb.from('autoscout_listings').select('status, last_sync_at').eq('listing_id', id).maybeSingle(),
    ]);
    setFavorites(favCount ?? 0);
    setMessages(msgCount ?? 0);
    if (autoRes.data) setAutoScout(autoRes.data as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const stagePending = (patch: Partial<Listing>) => setPending((p) => ({ ...p, ...patch }));

  const saveAll = async () => {
    if (!listing || !hasPending) return;
    if (!perms.canEditListings) return toast.error('Je hebt geen rechten om dit voertuig te bewerken');
    setSaving(true);
    const { error } = await supabase.from('listings').update(pending as any).eq('id', listing.id);
    setSaving(false);
    if (error) return toast.error(`Opslaan mislukt: ${error.message}`);
    setListing({ ...listing, ...pending });
    setPending({});
    toast.success('Wijzigingen opgeslagen');
  };

  // Immediate save (no buffer) — for status / publication / feature toggles
  const saveImmediate = async (patch: Partial<Listing>) => {
    if (!listing) return;
    if (!perms.canEditListings) return toast.error('Je hebt geen rechten om dit voertuig te bewerken');
    const { error } = await supabase.from('listings').update(patch as any).eq('id', listing.id);
    if (error) return toast.error(`Opslaan mislukt: ${error.message}`);
    setListing({ ...listing, ...patch });
    toast.success('Bijgewerkt');
  };

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-strong" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Je hebt geen toegang tot dit voertuig.</p>
        <Button asChild className="mt-4">
          <Link to="/zakelijk/voorraad">Terug naar voorraad</Link>
        </Button>
      </div>
    );
  }

  if (!view || !listing) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Voertuig niet gevonden.</p>
        <Button asChild className="mt-4">
          <Link to="/zakelijk/voorraad">Terug naar voorraad</Link>
        </Button>
      </div>
    );
  }

  const isConcept = view.status === 'draft';

  return (
    <div className="min-h-screen pb-32">
      <SEOHead title={`${view.title} — Beheer`} description="Voertuig beheerpagina" noindex />

      <div className="container max-w-2xl px-4 py-4 space-y-5">
        {/* Back */}
        <div className="-ml-2">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8">
            <Link to="/zakelijk/voorraad">
              <ArrowLeft className="h-4 w-4" /> Voorraad
            </Link>
          </Button>
        </div>

        {/* Vehicle header */}
        <VehicleHeader listing={view} />

        {/* Primary actions 50/50 */}
        <div className="grid grid-cols-2 gap-2">
          {perms.canEditListings && (
            <Button variant="outline" className="h-11 gap-1.5" onClick={() => setSheet('description')}>
              <Pencil className="h-4 w-4" />
              Bewerken
            </Button>
          )}
          {perms.canBoost && (
            <Button className="h-11 gap-1.5" onClick={() => setBoostOpen(true)}>
              <Rocket className="h-4 w-4" />
              Boosten
            </Button>
          )}
        </div>

        {/* Snelle acties */}
        <Section title="Snelle acties">
          <div className="grid grid-cols-2 gap-2">
            <QuickAction icon={Camera} label="Foto's" sub={`${view.images?.length ?? 0} foto's`} onClick={() => setSheet('photos')} />
            <QuickAction icon={Tag} label="Prijs" sub={formatPrice(view.price)} onClick={() => setSheet('price')} />
            <QuickAction icon={Flag} label="Status" sub={STATUS_OPTIONS.find((s) => s.v === view.status)?.label ?? '—'} onClick={() => setSheet('status')} />
            <QuickAction icon={Megaphone} label="Publicatie" sub={autoScout ? 'AutoScout24 actief' : 'Niet gekoppeld'} onClick={() => setSheet('publication')} />
            <QuickAction icon={FileText} label="Verkooptekst" sub={view.description ? 'Aanwezig' : 'Ontbreekt'} onClick={() => setSheet('description')} />
            <QuickAction icon={Star} label="Uitlichten" sub={view.is_premium ? 'Premium' : 'Standaard'} highlighted={!!view.is_premium} onClick={() => setSheet('feature')} />
          </div>
        </Section>

        {/* Voertuiggegevens */}
        <Section title="Voertuiggegevens">
          <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60">
            <SpecRow label="Merk" value={view.brand} onClick={() => setSheet('spec:brand')} />
            <SpecRow label="Model" value={view.model} onClick={() => setSheet('spec:model')} />
            <SpecRow label="Bouwjaar" value={view.year?.toString()} onClick={() => setSheet('spec:year')} />
            <SpecRow label="Kilometerstand" value={view.mileage ? `${view.mileage.toLocaleString('nl-NL')} km` : null} onClick={() => setSheet('spec:mileage')} />
            <SpecRow label="Brandstof" value={view.fuel_type} onClick={() => setSheet('spec:fuel_type')} />
            <SpecRow label="Transmissie" value={view.transmission} onClick={() => setSheet('spec:transmission')} />
            <SpecRow label="Kleur" value={view.color} onClick={() => setSheet('spec:color')} />
          </div>
        </Section>

        {/* Verkooptekst */}
        <Section title="Verkooptekst">
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <p className={cn('text-sm leading-relaxed line-clamp-3', !view.description && 'text-muted-foreground italic')}>
              {view.description || 'Nog geen verkooptekst toegevoegd.'}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSheet('description')}
                className="text-xs font-medium text-primary-strong inline-flex items-center gap-1 hover:underline"
              >
                Bewerken <ChevronRight className="h-3 w-3" />
              </button>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setSheet('description')}>
                <Sparkles className="h-3.5 w-3.5 text-primary-strong" /> Herschrijven met AI
              </Button>
            </div>
          </div>
        </Section>

        {/* Publicaties */}
        <Section title="Publicaties">
          <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60">
            <PlatformRow
              label="AutoScout24"
              status={autoScout?.status === 'active' || autoScout?.status === 'synced' ? 'green' : autoScout ? 'yellow' : 'gray'}
              hint={autoScout?.last_sync_at ? `Gesynchroniseerd ${new Date(autoScout.last_sync_at).toLocaleDateString('nl-BE')}` : 'Niet gekoppeld'}
              onClick={() => setSheet('publication')}
            />
            <PlatformRow label="Gaspedaal" status="gray" hint="Niet gekoppeld" onClick={() => setSheet('publication')} />
            <PlatformRow label="Facebook" status="gray" hint="Niet gekoppeld" onClick={() => setSheet('publication')} />
            <PlatformRow label="Marktplaats" status="gray" hint="Niet gekoppeld" onClick={() => setSheet('publication')} />
          </div>
        </Section>

        {/* Prestaties */}
        <Section title="Prestaties">
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Eye} label="Weergaven" value={view.views} />
            <StatCard icon={Heart} label="Favorieten" value={favorites} />
            <StatCard icon={Users} label="Leads" value={messages} />
          </div>
        </Section>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container max-w-2xl px-4 py-3 flex items-center gap-2">
          <Button asChild variant="outline" className="flex-1 h-11 gap-1.5">
            <Link to={`/auto/${view.id}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Preview
            </Link>
          </Button>
          <Button
            className="flex-1 h-11 gap-1.5"
            disabled={!hasPending || saving}
            onClick={saveAll}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isConcept ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isConcept ? 'Publiceren' : hasPending ? 'Opslaan' : 'Opgeslagen'}
          </Button>
        </div>
      </div>

      {/* Sheets */}
      <PhotosSheet
        open={sheet === 'photos'}
        onClose={() => setSheet(null)}
        listingId={view.id}
        userId={view.user_id ?? user?.id ?? null}
        images={view.images ?? []}
        onChange={(images) => {
          saveImmediate({ images } as any);
        }}
      />

      <PriceSheet
        open={sheet === 'price'}
        onClose={() => setSheet(null)}
        value={view.price}
        onSave={(p) => {
          stagePending({ price: p } as any);
          setSheet(null);
        }}
      />

      <StatusSheet
        open={sheet === 'status'}
        onClose={() => setSheet(null)}
        value={view.status}
        onSave={(s) => {
          saveImmediate({ status: s });
          setSheet(null);
        }}
      />

      <PublicationSheet
        open={sheet === 'publication'}
        onClose={() => setSheet(null)}
        autoScoutActive={!!autoScout}
      />

      <DescriptionSheet
        open={sheet === 'description'}
        onClose={() => setSheet(null)}
        value={view.description ?? ''}
        listing={view}
        onSave={(d) => {
          stagePending({ description: d } as any);
          setSheet(null);
        }}
      />

      <FeatureSheet
        open={sheet === 'feature'}
        onClose={() => setSheet(null)}
        isPremium={!!view.is_premium}
        onToggle={(v) => saveImmediate({ is_premium: v } as any)}
      />

      {sheet?.startsWith('spec:') && (
        <SpecSheet
          field={sheet.slice(5) as keyof Listing}
          listing={view}
          onClose={() => setSheet(null)}
          onSave={(patch) => {
            stagePending(patch);
            setSheet(null);
          }}
        />
      )}

      <BoostDialog
        open={boostOpen}
        onOpenChange={setBoostOpen}
        listingId={view.id}
        listingTitle={view.title}
        lockedListing
      />
    </div>
  );
}

// ─── Building blocks ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function VehicleHeader({ listing: l }: { listing: Listing }) {
  const cover = l.images?.[0];
  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 bg-card">
      <div className="relative aspect-[16/10] bg-muted">
        {cover ? (
          <img src={cover} alt={l.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Camera className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-semibold leading-tight line-clamp-1">{l.title}</p>
            <p className="text-lg font-bold text-foreground">{formatPrice(l.price)}</p>
          </div>
          <StatusBadge status={l.status} />
        </div>
      </div>
      <div className="px-4 py-2.5 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
        {l.year && <span>{l.year}</span>}
        {l.mileage != null && <><span>·</span><span>{l.mileage.toLocaleString('nl-NL')} km</span></>}
        {l.fuel_type && <><span>·</span><span className="capitalize">{l.fuel_type}</span></>}
        {l.transmission && <><span>·</span><span className="capitalize">{l.transmission}</span></>}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  sub,
  onClick,
  highlighted,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  onClick: () => void;
  highlighted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60 min-h-[64px]',
        highlighted ? 'border-primary/60' : 'border-border/60',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', highlighted ? 'text-primary-strong' : 'text-muted-foreground')} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
    </button>
  );
}

function SpecRow({ label, value, onClick }: { label: string; value: string | null | undefined; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 h-14 px-4 transition-colors hover:bg-muted/40 active:bg-muted/60 text-left"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 min-w-0">
        <span className={cn('text-sm font-medium truncate', !value && 'text-muted-foreground italic')}>
          {value || '—'}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </span>
    </button>
  );
}

function PlatformRow({
  label,
  status,
  hint,
  onClick,
}: {
  label: string;
  status: 'green' | 'yellow' | 'red' | 'gray';
  hint: string;
  onClick: () => void;
}) {
  const dot = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-destructive',
    gray: 'bg-muted-foreground/40',
  }[status];
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 h-14 px-4 transition-colors hover:bg-muted/40 active:bg-muted/60 text-left"
    >
      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{hint}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
      <Icon className="h-4 w-4 text-muted-foreground mx-auto" />
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Sheets ──────────────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-4 space-y-4">{children}</div>
        {footer && <SheetFooter className="mt-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}

function PhotosSheet({
  open,
  onClose,
  listingId,
  userId,
  images,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  userId: string | null;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const remove = (idx: number) => {
    if (!confirm('Foto verwijderen?')) return;
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
  };

  const upload = async (files: FileList | null) => {
    if (!files || !userId) return;
    setBusy(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(path, file, { upsert: false });
      if (error) {
        toast.error(`Upload mislukt: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    setBusy(false);
    if (uploaded.length) onChange([...images, ...uploaded]);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Foto's beheren" description="Eerste foto is de hoofdfoto.">
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <div key={url + i} className="relative aspect-square rounded-lg overflow-hidden border border-border/60 bg-muted group">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <Badge className="absolute top-1 left-1 text-[9px] h-4 px-1">Hoofd</Badge>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-background/80 backdrop-blur">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30">
                <ArrowUp className="h-3 w-3" />
              </button>
              <button onClick={() => remove(i)} className="p-1 text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === images.length - 1} className="p-1 disabled:opacity-30">
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        <label className="aspect-square rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/40 transition-colors">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
          <span className="text-[10px] text-muted-foreground">Toevoegen</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
    </BottomSheet>
  );
}

function PriceSheet({
  open,
  onClose,
  value,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  value: number;
  onSave: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value, open]);
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Prijs aanpassen"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuleren</Button>
          <Button className="flex-1" onClick={() => onSave(parseInt(local) || value)}>Bewaren</Button>
        </div>
      }
    >
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
        <Input
          type="number"
          inputMode="numeric"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="h-12 pl-8 text-lg font-semibold"
        />
      </div>
    </BottomSheet>
  );
}

function StatusSheet({
  open,
  onClose,
  value,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value, open]);
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Status wijzigen"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuleren</Button>
          <Button className="flex-1" onClick={() => onSave(local)}>Toepassen</Button>
        </div>
      }
    >
      <RadioGroup value={local} onValueChange={setLocal} className="space-y-1">
        {STATUS_OPTIONS.map((s) => (
          <Label key={s.v} htmlFor={`st-${s.v}`} className="flex items-center gap-3 h-12 px-3 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/40">
            <RadioGroupItem value={s.v} id={`st-${s.v}`} />
            <span className="text-sm font-medium">{s.label}</span>
          </Label>
        ))}
      </RadioGroup>
    </BottomSheet>
  );
}

function PublicationSheet({
  open,
  onClose,
  autoScoutActive,
}: {
  open: boolean;
  onClose: () => void;
  autoScoutActive: boolean;
}) {
  const platforms = [
    { code: 'autoscout', label: 'AutoScout24', enabled: autoScoutActive, available: true },
    { code: 'gaspedaal', label: 'Gaspedaal', enabled: false, available: false },
    { code: 'facebook', label: 'Facebook', enabled: false, available: false },
    { code: 'marktplaats', label: 'Marktplaats', enabled: false, available: false },
  ];
  return (
    <BottomSheet open={open} onClose={onClose} title="Publicaties" description="Beheer waar deze wagen getoond wordt.">
      <div className="space-y-2">
        {platforms.map((p) => (
          <div key={p.code} className="flex items-center justify-between gap-3 h-14 px-4 rounded-lg border border-border/60 bg-card">
            <div className="min-w-0">
              <p className="text-sm font-medium">{p.label}</p>
              {!p.available && <p className="text-[11px] text-muted-foreground">Binnenkort beschikbaar</p>}
            </div>
            <Switch checked={p.enabled} disabled={!p.available} />
          </div>
        ))}
        {!autoScoutActive && (
          <Button asChild variant="outline" className="w-full mt-2">
            <Link to="/zakelijk/instellingen">AutoScout24 koppelen</Link>
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}

function DescriptionSheet({
  open,
  onClose,
  value,
  listing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  listing: Listing;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const [aiLoading, setAiLoading] = useState(false);
  useEffect(() => { setLocal(value); }, [value, open]);

  const rewriteAI = async () => {
    if (!listing.brand || !listing.model || !listing.year || listing.mileage == null || !listing.fuel_type || !listing.transmission) {
      toast.error('Vul eerst merk, model, jaar, km, brandstof en transmissie in.');
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-listing', {
        body: {
          brand: listing.brand,
          model: listing.model,
          year: listing.year,
          mileage: listing.mileage,
          fuelType: listing.fuel_type,
          transmission: listing.transmission,
          bodyType: listing.body_type ?? 'auto',
          color: listing.color,
          power: listing.power,
        },
      });
      if (error) throw error;
      if (data?.description) setLocal(data.description);
      else toast.error('Geen AI-tekst ontvangen');
    } catch {
      toast.error('AI-herschrijven mislukt');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Verkooptekst"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuleren</Button>
          <Button className="flex-1" onClick={() => onSave(local)}>Bewaren</Button>
        </div>
      }
    >
      <Textarea value={local} onChange={(e) => setLocal(e.target.value)} rows={10} className="resize-none" />
      <Button variant="outline" className="w-full gap-1.5" onClick={rewriteAI} disabled={aiLoading}>
        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary-strong" />}
        Herschrijven met AI
      </Button>
    </BottomSheet>
  );
}

function FeatureSheet({
  open,
  onClose,
  isPremium,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Uitlichten" description="Toon deze wagen bovenaan met een premium-badge.">
      <div className="flex items-center justify-between gap-3 h-14 px-4 rounded-lg border border-border/60 bg-card">
        <div className="min-w-0">
          <p className="text-sm font-medium">Premium uitlichten</p>
          <p className="text-[11px] text-muted-foreground">Gouden badge + prioriteit in zoekresultaten</p>
        </div>
        <Switch checked={isPremium} onCheckedChange={onToggle} />
      </div>
    </BottomSheet>
  );
}

const SPEC_META: Record<string, { label: string; type: 'text' | 'number'; column: keyof Listing }> = {
  brand: { label: 'Merk', type: 'text', column: 'brand' },
  model: { label: 'Model', type: 'text', column: 'model' },
  year: { label: 'Bouwjaar', type: 'number', column: 'year' },
  mileage: { label: 'Kilometerstand', type: 'number', column: 'mileage' },
  fuel_type: { label: 'Brandstof', type: 'text', column: 'fuel_type' },
  transmission: { label: 'Transmissie', type: 'text', column: 'transmission' },
  color: { label: 'Kleur', type: 'text', column: 'color' },
};

function SpecSheet({
  field,
  listing,
  onClose,
  onSave,
}: {
  field: keyof Listing;
  listing: Listing;
  onClose: () => void;
  onSave: (patch: Partial<Listing>) => void;
}) {
  const meta = SPEC_META[field as string];
  const current = (listing[field] as string | number | null) ?? '';
  const [local, setLocal] = useState(String(current));
  useEffect(() => { setLocal(String(current)); /* eslint-disable-next-line */ }, [field]);

  if (!meta) return null;

  const handle = () => {
    const v = meta.type === 'number' ? (local === '' ? null : parseInt(local)) : local;
    onSave({ [meta.column]: v } as Partial<Listing>);
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={meta.label}
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Annuleren
          </Button>
          <Button className="flex-1" onClick={handle}>
            <Check className="h-4 w-4 mr-1" /> Bewaren
          </Button>
        </div>
      }
    >
      <Input
        type={meta.type === 'number' ? 'number' : 'text'}
        inputMode={meta.type === 'number' ? 'numeric' : undefined}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="h-12"
        autoFocus
      />
    </BottomSheet>
  );
}

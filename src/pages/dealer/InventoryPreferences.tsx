import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  RefreshCw,
  FilePlus,
  ShoppingCart,
  BellRing,
  Repeat,
  Clock,
  Layers,
  Wrench,
  ArrowRight,
  Download,
  Upload,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  PreferenceCard,
  PreferenceRow,
  PreferenceBlock,
} from '@/components/inventory/PreferenceCard';
import { InventoryPreview } from '@/components/inventory/InventoryPreview';
import { StickySaveBar } from '@/components/inventory/StickySaveBar';
import {
  BulkActionDialog,
  type BulkAction,
} from '@/components/inventory/BulkActionDialog';
import {
  useInventoryPreferences,
  useActiveListingsCount,
} from '@/hooks/useInventoryPreferences';
import {
  DEFAULT_INVENTORY_PREFS,
  InventoryPrefs,
  SYNC_INTERVAL_OPTIONS,
} from '@/lib/inventoryPrefsSchema';
import { cn } from '@/lib/utils';

const isEqual = (a: InventoryPrefs, b: InventoryPrefs) => JSON.stringify(a) === JSON.stringify(b);

export default function InventoryPreferences() {
  const { preferences, isLoading, save, isSaving } = useInventoryPreferences();
  const { data: activeCount = 0 } = useActiveListingsCount();
  const [draft, setDraft] = useState<InventoryPrefs>(DEFAULT_INVENTORY_PREFS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);

  useEffect(() => {
    if (!isLoading) setDraft(preferences);
  }, [preferences, isLoading]);

  const dirty = useMemo(() => !isEqual(draft, preferences), [draft, preferences]);

  const set = <K extends keyof InventoryPrefs>(key: K, value: InventoryPrefs[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    try {
      await save(draft);
    } catch {
      /* toast handled in hook */
    }
  };

  const handleCancel = () => setDraft(preferences);

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Voorraadvoorkeuren — VATUUR. Zakelijk"
        description="Stel je voorraadbeheer, reserveringen en automatische acties in."
        noindex
      />

      <div className={cn('container max-w-6xl py-6 md:py-10 space-y-6', dirty && 'pb-32 md:pb-32')}>
        {/* Header */}
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <SettingsIcon className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Zakelijk</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Voorraadvoorkeuren</h1>
          <p className="text-sm text-muted-foreground">
            Slimme defaults voor je volledige voorraad. Wijzig wat je nodig hebt — de rest werkt automatisch.
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Wizard cards */}
          <div className="space-y-5 min-w-0">
            {/* 1. Overzicht */}
            <Card className="border-border/60 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/15 text-primary p-2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold">Voorraadbeheer actief</h2>
                      <Badge className="text-[10px] uppercase tracking-wider bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                        Aan
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Je hebt nu <span className="font-medium text-foreground">{activeCount}</span> actieve advertenties.
                    </p>
                  </div>
                </div>
                <PreferenceRow
                  label="Automatisch voorraad bijwerken"
                  description="Bij wijzigingen van status (verkocht, gereserveerd, gepauzeerd) wordt je voorraad direct ververst."
                  control={
                    <Switch
                      checked={draft.auto_update_enabled}
                      onCheckedChange={(v) => set('auto_update_enabled', v)}
                      aria-label="Automatisch voorraad bijwerken"
                    />
                  }
                />
                <PreferenceBlock
                  label="Methode"
                  description="Bepaal of je voorraad handmatig beheert of automatisch synchroniseert met AutoScout24."
                >
                  <RadioGroup
                    value={draft.update_method}
                    onValueChange={(v) => set('update_method', v as InventoryPrefs['update_method'])}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    <RadioOption value="manual" current={draft.update_method} icon={<RefreshCw className="h-4 w-4" />} label="Handmatig" sub="Je beheert alles zelf vanuit je dashboard." />
                    <RadioOption value="autoscout" current={draft.update_method} icon={<Sparkles className="h-4 w-4" />} label="Automatisch" sub="Sync met AutoScout24 via je gekoppelde account." />
                  </RadioGroup>
                </PreferenceBlock>
              </CardContent>
            </Card>

            {/* 2. Nieuwe advertenties */}
            <PreferenceCard
              icon={<FilePlus className="h-5 w-5" />}
              title="Bij nieuwe advertenties"
              description="Wat moet er gebeuren wanneer je een nieuwe wagen toevoegt?"
            >
              <PreferenceBlock label="Standaard status" description="Nieuwe advertenties krijgen automatisch deze status.">
                <RadioGroup
                  value={draft.default_listing_status}
                  onValueChange={(v) => set('default_listing_status', v as InventoryPrefs['default_listing_status'])}
                  className="grid grid-cols-2 gap-2"
                >
                  <RadioOption value="active" current={draft.default_listing_status} icon={<PlayCircle className="h-4 w-4" />} label="Actief" sub="Meteen online en zichtbaar." />
                  <RadioOption value="draft" current={draft.default_listing_status} icon={<PauseCircle className="h-4 w-4" />} label="Concept" sub="Eerst nakijken voor publicatie." />
                </RadioGroup>
              </PreferenceBlock>
            </PreferenceCard>

            {/* 3. Bij verkoop */}
            <PreferenceCard
              icon={<ShoppingCart className="h-5 w-5" />}
              title="Wanneer een wagen verkocht is"
              description="Bepaal wat er na de verkoop met de advertentie gebeurt."
            >
              <PreferenceRow
                label="Automatisch markeren als verkocht"
                description="Na bevestiging in messaging wordt de status meteen aangepast."
                control={
                  <Switch
                    checked={draft.auto_mark_sold}
                    onCheckedChange={(v) => set('auto_mark_sold', v)}
                  />
                }
              />
              <PreferenceBlock label="Daarna" description="Kies hoe een verkochte advertentie verder zichtbaar blijft.">
                <RadioGroup
                  value={draft.on_sold_action}
                  onValueChange={(v) => set('on_sold_action', v as InventoryPrefs['on_sold_action'])}
                  className="grid grid-cols-1 gap-2"
                >
                  <RadioOption value="keep_visible" current={draft.on_sold_action} icon={<CheckCircle2 className="h-4 w-4" />} label="Blijf zichtbaar als Verkocht" sub="Goed voor referenties en SEO." />
                  <RadioOption value="hide" current={draft.on_sold_action} icon={<PauseCircle className="h-4 w-4" />} label="Verbergen uit zoekresultaten" sub="Wagen blijft in je dashboard maar niet publiek." />
                  <RadioOption value="archive_after_days" current={draft.on_sold_action} icon={<Layers className="h-4 w-4" />} label="Archiveer na enkele dagen" sub={`Automatisch archiveren na ${draft.archive_after_days} dagen.`} />
                </RadioGroup>
                {draft.on_sold_action === 'archive_after_days' && (
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={draft.archive_after_days}
                      onChange={(e) =>
                        set('archive_after_days', Math.max(1, Math.min(365, Number(e.target.value) || 1)))
                      }
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">dagen na verkoop</span>
                  </div>
                )}
              </PreferenceBlock>
            </PreferenceCard>

            {/* 4. Lage voorraad */}
            <PreferenceCard
              icon={<BellRing className="h-5 w-5" />}
              title="Lage voorraad"
              description="Krijg een waarschuwing wanneer je actief aanbod onder de drempel zakt."
            >
              <PreferenceBlock
                label="Waarschuw mij vanaf"
                description={`Op dit moment heb je ${activeCount} actieve advertenties.`}
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={draft.low_stock_threshold}
                    onChange={(e) =>
                      set('low_stock_threshold', Math.max(0, Math.min(1000, Number(e.target.value) || 0)))
                    }
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">advertenties of minder</span>
                </div>
              </PreferenceBlock>
              <PreferenceRow
                label="Pushmelding"
                description="Ontvang een push in de browser of op je toestel."
                control={
                  <Switch
                    checked={draft.low_stock_push}
                    onCheckedChange={(v) => set('low_stock_push', v)}
                  />
                }
              />
              <PreferenceRow
                label="E-mail"
                description="Stuur een mail naar het adres van je dealeraccount."
                control={
                  <Switch
                    checked={draft.low_stock_email}
                    onCheckedChange={(v) => set('low_stock_email', v)}
                  />
                }
              />
            </PreferenceCard>

            {/* 5. Automatisch heractiveren */}
            <PreferenceCard
              icon={<Repeat className="h-5 w-5" />}
              title="Automatisch heractiveren"
              description="Handig wanneer een reservatie vervalt of een koper afhaakt."
            >
              <PreferenceRow
                label="Heractiveer automatisch bij annulering"
                description="Zet de advertentie terug op Actief zodra de reservatie vervalt."
                control={
                  <Switch
                    checked={draft.auto_relist_on_cancel}
                    onCheckedChange={(v) => set('auto_relist_on_cancel', v)}
                  />
                }
              />
              {draft.auto_relist_on_cancel && (
                <PreferenceBlock label="Vertraging" description="Wachttijd voor automatische heractivering.">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={1440}
                      value={draft.relist_delay_minutes}
                      onChange={(e) =>
                        set('relist_delay_minutes', Math.max(0, Math.min(1440, Number(e.target.value) || 0)))
                      }
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">minuten</span>
                  </div>
                </PreferenceBlock>
              )}
            </PreferenceCard>

            {/* 6. Reserveringen */}
            <PreferenceCard
              icon={<Clock className="h-5 w-5" />}
              title="Reserveringen tijdens gesprek"
              description="Voorkom dubbele verkopen door advertenties tijdelijk te blokkeren."
            >
              <PreferenceRow
                label="Reserveer wagen tijdens contact"
                description="Bij het eerste bericht van een koper wordt de wagen kort gereserveerd."
                control={
                  <Switch
                    checked={draft.reservation_enabled}
                    onCheckedChange={(v) => set('reservation_enabled', v)}
                  />
                }
              />
              {draft.reservation_enabled && (
                <PreferenceBlock label="Reservatie vervalt na" description="Andere kopers kunnen daarna opnieuw contact opnemen.">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={5}
                      max={1440}
                      value={draft.reservation_minutes}
                      onChange={(e) =>
                        set('reservation_minutes', Math.max(5, Math.min(1440, Number(e.target.value) || 5)))
                      }
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">minuten</span>
                  </div>
                </PreferenceBlock>
              )}
            </PreferenceCard>

            {/* 7. Bulkacties */}
            <PreferenceCard
              icon={<Layers className="h-5 w-5" />}
              title="Bulkacties"
              description="Werk meerdere advertenties tegelijk bij."
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <BulkButton icon={<PauseCircle className="h-4 w-4" />} label="Pauzeren" onClick={() => setBulkAction('pause')} />
                <BulkButton icon={<PlayCircle className="h-4 w-4" />} label="Heractiveren" onClick={() => setBulkAction('reactivate')} />
                <BulkButton icon={<CheckCircle2 className="h-4 w-4" />} label="Markeer verkocht" onClick={() => setBulkAction('sold')} />
                <BulkButton icon={<Upload className="h-4 w-4" />} label="CSV importeren" asLink to="/zakelijk/import" />
                <BulkButton icon={<Download className="h-4 w-4" />} label="CSV exporteren" onClick={() => exportCSV()} />
              </div>
            </PreferenceCard>

            {/* 8. Geavanceerd */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <Card className="border-border/60">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-5 text-left focus-ring rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-muted text-muted-foreground p-2">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold">Geavanceerd</h3>
                          <Badge variant="outline" className="text-[10px]">Power user</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Negatieve voorraad, backorders, VIN-referenties en sync-interval.
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', advancedOpen && 'rotate-180')} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-5 px-5 space-y-4 border-t border-border/40">
                    <PreferenceRow
                      label="Negatieve voorraad toestaan"
                      description="Sta toe dat een advertentie blijft staan ook al is de wagen al weg."
                      control={
                        <Switch
                          checked={draft.allow_negative_stock}
                          onCheckedChange={(v) => set('allow_negative_stock', v)}
                        />
                      }
                    />
                    <PreferenceRow
                      label="Backorders"
                      description="Kopers kunnen interesse tonen in wagens die nog niet in stock zijn."
                      control={
                        <Switch
                          checked={draft.allow_backorders}
                          onCheckedChange={(v) => set('allow_backorders', v)}
                        />
                      }
                    />
                    <PreferenceRow
                      label="VIN-referentie automatisch genereren"
                      description="Maak een interne referentie aan als er geen VIN is ingevuld."
                      control={
                        <Switch
                          checked={draft.auto_generate_vin_ref}
                          onCheckedChange={(v) => set('auto_generate_vin_ref', v)}
                        />
                      }
                    />
                    <PreferenceBlock
                      label="Synchronisatie-interval"
                      description={`Elke ${draft.sync_interval_minutes} minuten data uitwisselen met AutoScout24.`}
                    >
                      <Slider
                        value={[SYNC_INTERVAL_OPTIONS.indexOf(draft.sync_interval_minutes as never)]}
                        onValueChange={(v) =>
                          set('sync_interval_minutes', SYNC_INTERVAL_OPTIONS[v[0]] as InventoryPrefs['sync_interval_minutes'])
                        }
                        min={0}
                        max={SYNC_INTERVAL_OPTIONS.length - 1}
                        step={1}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                        {SYNC_INTERVAL_OPTIONS.map((v) => (
                          <span key={v} className={draft.sync_interval_minutes === v ? 'text-primary font-semibold' : ''}>
                            {v < 60 ? `${v}m` : `${v / 60}u`}
                          </span>
                        ))}
                      </div>
                    </PreferenceBlock>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Desktop preview */}
          <aside className="hidden lg:block">
            <InventoryPreview prefs={draft} activeCount={activeCount} />
          </aside>
        </div>
      </div>

      <BulkActionDialog
        open={!!bulkAction}
        onOpenChange={(v) => !v && setBulkAction(null)}
        action={bulkAction}
      />

      <StickySaveBar
        visible={dirty}
        saving={isSaving}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </>
  );
}

function RadioOption({
  value,
  current,
  icon,
  label,
  sub,
}: {
  value: string;
  current: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  const active = value === current;
  return (
    <Label
      htmlFor={`opt-${value}`}
      className={cn(
        'flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer transition-colors hover:bg-muted/40',
        active && 'border-primary/60 bg-primary/5 ring-1 ring-primary/30',
      )}
    >
      <RadioGroupItem id={`opt-${value}`} value={value} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium inline-flex items-center gap-1.5">
          <span className="text-primary">{icon}</span> {label}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sub}</p>
      </div>
    </Label>
  );
}

function BulkButton({
  icon,
  label,
  onClick,
  asLink,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  asLink?: boolean;
  to?: string;
}) {
  if (asLink && to) {
    return (
      <Button asChild variant="outline" className="min-h-12 justify-start gap-2 font-medium">
        <Link to={to}>
          <span className="text-primary">{icon}</span>
          {label}
          <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-50" />
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      className="min-h-12 justify-start gap-2 font-medium"
      onClick={onClick}
    >
      <span className="text-primary">{icon}</span>
      {label}
    </Button>
  );
}

async function exportCSV() {
  const { supabase } = await import('@/integrations/supabase/client');
  const { toast } = await import('sonner');
  const { data, error } = await supabase
    .from('listings')
    .select('id,title,brand,model,year,price,mileage,status,created_at')
    .order('created_at', { ascending: false });
  if (error) {
    toast.error('Export mislukt');
    return;
  }
  const headers = ['id', 'title', 'brand', 'model', 'year', 'price', 'mileage', 'status', 'created_at'];
  const rows = (data ?? []).map((r) =>
    headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? '')).join(','),
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vatuur-voorraad-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`${rows.length} advertenties geëxporteerd`);
}

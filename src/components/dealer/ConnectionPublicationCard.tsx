import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PublicationSettings {
  auto_publish: boolean;
  sync_direction: 'import_only' | 'export_only' | 'both';
  publish_new_vehicles: boolean;
  sync_price: boolean;
  sync_photos: boolean;
  sync_description: boolean;
  sync_specs: boolean;
  remove_on_sold: boolean;
  sync_stock: boolean;
  draft_mode: boolean;
  sync_schedule: 'manual' | '15min' | 'hourly' | 'daily';
  sync_priority: 'low' | 'normal' | 'high';
}

export const DEFAULT_PUBLICATION_SETTINGS: PublicationSettings = {
  auto_publish: false,
  sync_direction: 'import_only',
  publish_new_vehicles: false,
  sync_price: true,
  sync_photos: true,
  sync_description: true,
  sync_specs: true,
  remove_on_sold: true,
  sync_stock: true,
  draft_mode: false,
  sync_schedule: 'manual',
  sync_priority: 'normal',
};

interface Props {
  value: PublicationSettings;
  onChange: (next: PublicationSettings) => void;
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

function statusInfo(v: PublicationSettings) {
  if (!v.auto_publish) return { color: 'bg-muted text-foreground/70', dot: 'bg-muted-foreground', label: 'Uitgeschakeld' };
  if (v.sync_direction === 'import_only')
    return { color: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200', dot: 'bg-amber-500', label: 'Alleen import' };
  if (v.sync_direction === 'export_only')
    return { color: 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200', dot: 'bg-blue-500', label: 'Alleen export' };
  return { color: 'bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-200', dot: 'bg-green-500', label: 'Actief' };
}

function ToggleRow({
  id, label, description, checked, onCheckedChange, disabled,
}: { id: string; label: string; description: string; checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="space-y-0.5 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

function SummaryItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok
        ? <Check className="h-4 w-4 text-green-600 shrink-0" />
        : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
      <span className={ok ? '' : 'text-muted-foreground line-through'}>{label}</span>
    </li>
  );
}

const SCHEDULE_LABEL: Record<PublicationSettings['sync_schedule'], string> = {
  manual: 'Handmatig',
  '15min': 'Elke 15 minuten',
  hourly: 'Elk uur',
  daily: 'Dagelijks',
};

const DIRECTION_LABEL: Record<PublicationSettings['sync_direction'], string> = {
  import_only: 'Eenrichting — alleen importeren',
  export_only: 'Eenrichting — alleen exporteren',
  both: 'Tweeweg synchronisatie',
};

export default function ConnectionPublicationCard({
  value, onChange, onSave, saving, disabled, disabledMessage,
}: Props) {
  const set = <K extends keyof PublicationSettings>(key: K, v: PublicationSettings[K]) =>
    onChange({ ...value, [key]: v });
  const status = statusInfo(value);

  return (
    <Card className={cn('border-border/60', disabled && 'opacity-90')}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Publicatie-instellingen</CardTitle>
          <span className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium', status.color)}>
            <span className={cn('h-2 w-2 rounded-full', status.dot)} />
            {status.label}
          </span>
        </div>
        <CardDescription>
          Bepaal volledig zelf hoe deze koppeling jouw voorraad publiceert en synchroniseert.
        </CardDescription>
        {disabled && disabledMessage && (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {disabledMessage}
          </div>
        )}
      </CardHeader>

      <CardContent className={cn('space-y-6', disabled && 'pointer-events-none select-none')}>
        {/* Publicatie inschakelen */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Publicatie inschakelen</h3>
          <div className="divide-y divide-border/60">
            <ToggleRow
              id="pub-auto"
              label="Automatisch publiceren via deze koppeling"
              description="Zet aan om gepland synchroniseren te activeren. Bij uit blijft alleen handmatig synchroniseren werken."
              checked={value.auto_publish}
              onCheckedChange={(v) => set('auto_publish', v)}
              disabled={disabled}
            />
          </div>
        </section>

        {/* Richting */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Synchronisatierichting</h3>
          <RadioGroup
            value={value.sync_direction}
            onValueChange={(v) => set('sync_direction', v as PublicationSettings['sync_direction'])}
            className="space-y-2"
            disabled={disabled}
          >
            {[
              { v: 'import_only', label: 'Alleen importeren', desc: 'Haal voorraad op vanuit deze koppeling. Niets terugsturen.' },
              { v: 'export_only', label: 'Alleen exporteren', desc: 'Stuur VATUUR-voorraad naar deze koppeling. Niets ophalen.' },
              { v: 'both', label: 'Importeren én exporteren', desc: 'Tweeweg-synchronisatie. Wijzigingen langs beide kanten lopen door.' },
            ].map((opt) => (
              <label key={opt.v} htmlFor={`dir-${opt.v}`} className="flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/40">
                <RadioGroupItem id={`dir-${opt.v}`} value={opt.v} className="mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">{opt.label}</div>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </section>

        {/* Nieuwe voertuigen */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Gedrag bij nieuwe voertuigen</h3>
          <div className="divide-y divide-border/60">
            <ToggleRow
              id="pub-new"
              label="Nieuwe voertuigen automatisch publiceren"
              description="Zodra een nieuw voertuig opduikt via deze koppeling, wordt het direct gepubliceerd."
              checked={value.publish_new_vehicles}
              onCheckedChange={(v) => set('publish_new_vehicles', v)}
              disabled={disabled}
            />
            <ToggleRow
              id="pub-draft"
              label="Nieuwe advertenties eerst als concept aanmaken"
              description="Standaard belanden nieuwe voertuigen in concept zodat je ze nog kunt nakijken voor publicatie."
              checked={value.draft_mode}
              onCheckedChange={(v) => set('draft_mode', v)}
              disabled={disabled}
            />
          </div>
        </section>

        {/* Wijzigingen */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Gedrag bij wijzigingen</h3>
          <div className="divide-y divide-border/60">
            <ToggleRow id="pub-price" label="Prijs automatisch bijwerken"
              description="Prijswijzigingen langs deze koppeling worden gesynchroniseerd."
              checked={value.sync_price} onCheckedChange={(v) => set('sync_price', v)} disabled={disabled} />
            <ToggleRow id="pub-photos" label="Foto's automatisch synchroniseren"
              description="Beelden worden in sync gehouden bij elke run."
              checked={value.sync_photos} onCheckedChange={(v) => set('sync_photos', v)} disabled={disabled} />
            <ToggleRow id="pub-desc" label="Omschrijving synchroniseren"
              description="De verkooptekst wordt overgenomen of overschreven volgens de richting."
              checked={value.sync_description} onCheckedChange={(v) => set('sync_description', v)} disabled={disabled} />
            <ToggleRow id="pub-specs" label="Specificaties synchroniseren"
              description="Bouwjaar, brandstof, opties en technische specs worden bijgewerkt."
              checked={value.sync_specs} onCheckedChange={(v) => set('sync_specs', v)} disabled={disabled} />
          </div>
        </section>

        {/* Verkoop */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Gedrag bij verkoop</h3>
          <div className="divide-y divide-border/60">
            <ToggleRow id="pub-rm-sold" label="Advertentie automatisch verwijderen bij verkoop"
              description="Verkochte voertuigen worden via deze koppeling offline gehaald."
              checked={value.remove_on_sold} onCheckedChange={(v) => set('remove_on_sold', v)} disabled={disabled} />
            <ToggleRow id="pub-stock" label="Voorraad synchroniseren"
              description="Houd voorraad-aantal en beschikbaarheid in lijn met deze koppeling."
              checked={value.sync_stock} onCheckedChange={(v) => set('sync_stock', v)} disabled={disabled} />
          </div>
        </section>

        {/* Planning */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Planning</h3>
          <RadioGroup
            value={value.sync_schedule}
            onValueChange={(v) => set('sync_schedule', v as PublicationSettings['sync_schedule'])}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            disabled={disabled}
          >
            {(['manual', '15min', 'hourly', 'daily'] as const).map((v) => (
              <label key={v} htmlFor={`sch-${v}`} className={cn(
                'flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 cursor-pointer text-sm hover:bg-muted/40',
                value.sync_schedule === v && 'border-primary/60 bg-primary/5',
              )}>
                <RadioGroupItem id={`sch-${v}`} value={v} />
                {SCHEDULE_LABEL[v]}
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-2">
            Handmatig betekent dat synchronisatie enkel start als jij op "Sync nu" klikt.
          </p>
        </section>

        {/* Prioriteit */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Prioriteit</h3>
          <RadioGroup
            value={value.sync_priority}
            onValueChange={(v) => set('sync_priority', v as PublicationSettings['sync_priority'])}
            className="grid grid-cols-3 gap-2"
            disabled={disabled}
          >
            {(['low', 'normal', 'high'] as const).map((v) => (
              <label key={v} htmlFor={`prio-${v}`} className={cn(
                'flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 cursor-pointer text-sm hover:bg-muted/40',
                value.sync_priority === v && 'border-primary/60 bg-primary/5',
              )}>
                <RadioGroupItem id={`prio-${v}`} value={v} className="sr-only" />
                {v === 'low' ? 'Laag' : v === 'normal' ? 'Normaal' : 'Hoog'}
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-2">
            Hoge prioriteit krijgt voorrang wanneer meerdere koppelingen tegelijk syncen.
          </p>
        </section>

        {/* Live samenvatting */}
        <section className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Deze koppeling zal:</h3>
          <ul className="space-y-1.5">
            <SummaryItem ok={value.auto_publish} label="Automatisch synchroniseren volgens planning" />
            <SummaryItem ok={value.publish_new_vehicles} label="Nieuwe voertuigen publiceren" />
            <SummaryItem ok={value.sync_price} label="Prijzen synchroniseren" />
            <SummaryItem ok={value.sync_photos} label="Foto's synchroniseren" />
            <SummaryItem ok={value.sync_description} label="Omschrijvingen synchroniseren" />
            <SummaryItem ok={value.sync_specs} label="Specificaties synchroniseren" />
            <SummaryItem ok={value.remove_on_sold} label="Verkochte advertenties offline halen" />
            <SummaryItem ok={value.sync_stock} label="Voorraad synchroniseren" />
            <SummaryItem ok={value.draft_mode} label="Nieuwe voertuigen eerst als concept klaarzetten" />
            <li className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="text-[10px] h-5">{DIRECTION_LABEL[value.sync_direction]}</Badge>
              <Badge variant="outline" className="text-[10px] h-5">{SCHEDULE_LABEL[value.sync_schedule]}</Badge>
            </li>
          </ul>
        </section>

        {onSave && !disabled && (
          <div className="flex justify-end pt-2">
            <Button onClick={() => onSave()} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Opslaan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

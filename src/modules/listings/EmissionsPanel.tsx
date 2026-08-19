import { Leaf, CircleCheck, CircleAlert, CircleX, CircleHelp, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { resolveEuroNorm, evaluateLez, co2Band, type LezStatus } from '@/lib/emissions';

interface EmissionsPanelProps {
  fuelType?: string | null;
  emissionClass?: string | null;
  firstRegistrationDate?: string | null;
  year?: number | null;
  co2Emissions?: number | null;
  co2EmissionsUnit?: string | null;
}

const STATUS_STYLES: Record<LezStatus, { icon: typeof CircleCheck; className: string; label: string }> = {
  toegelaten: { icon: CircleCheck, className: 'text-success', label: 'Toegelaten' },
  voorwaardelijk: { icon: CircleAlert, className: 'text-warning', label: 'Voorwaardelijk' },
  'niet-toegelaten': { icon: CircleX, className: 'text-destructive', label: 'Niet toegelaten' },
  onbekend: { icon: CircleHelp, className: 'text-muted-foreground', label: 'Onbekend' },
};

/** Expliciete Euronorm-, CO₂- en LEZ-weergave op de advertentiepagina (A2.2). */
export function EmissionsPanel({
  fuelType,
  emissionClass,
  firstRegistrationDate,
  year,
  co2Emissions,
  co2EmissionsUnit,
}: EmissionsPanelProps) {
  const euro = resolveEuroNorm({ fuelType, emissionClass, firstRegistrationDate, year });
  const zones = evaluateLez({ fuelType, emissionClass, firstRegistrationDate, year });
  const band = co2Band(co2Emissions);

  return (
    <Card className="border-border/60 shadow-card">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Leaf className="h-5 w-5 text-success" />
          Milieu &amp; lage-emissiezones
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Euronorm</p>
            <p className="mt-1 text-xl font-semibold">{euro.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {euro.origin === 'declared' && 'Opgegeven door de verkoper.'}
              {euro.origin === 'estimated' && 'Afgeleid uit de eerste inschrijving — vraag na bij de verkoper.'}
              {euro.origin === 'zero-emission' && 'Volledig emissievrij voertuig.'}
              {euro.origin === 'unknown' && 'Niet ingevuld door de verkoper.'}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">CO₂-uitstoot</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold">
              {co2Emissions != null ? `${co2Emissions} ${co2EmissionsUnit ?? 'g/km'}` : 'Onbekend'}
              {band && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-medium',
                    band.tone === 'good' && 'border-success/40 text-success',
                    band.tone === 'medium' && 'border-warning/40 text-warning',
                    band.tone === 'high' && 'border-destructive/40 text-destructive',
                  )}
                >
                  {band.label}
                </Badge>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bepaalt mee de verkeersbelasting en de belasting op inverkeerstelling.
            </p>
          </div>
        </div>

        <ul className="mt-4 divide-y divide-border/60 rounded-xl border border-border/60">
          {zones.map((zone) => {
            const style = STATUS_STYLES[zone.status];
            const Icon = style.icon;
            return (
              <li key={zone.zone} className="flex items-start gap-3 p-4">
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.className)} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    LEZ {zone.zone}: <span className={style.className}>{style.label}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{zone.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Indicatief. LEZ-voorwaarden wijzigen regelmatig — controleer altijd de officiële zone-website
          vóór je een wagen koopt of een stad binnenrijdt.
        </p>
      </CardContent>
    </Card>
  );
}

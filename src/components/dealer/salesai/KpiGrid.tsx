import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DealerSummary } from '@/hooks/useDealerSummary';
import { cn } from '@/lib/utils';

function fmtEur(n: number) {
  return n ? `€${n.toLocaleString('nl-BE')}` : '€0';
}

type Kpi = {
  label: string;
  value: string;
  hint?: string;
  delta?: number; // percent
};

export function KpiGrid({ summary }: { summary: DealerSummary }) {
  const k = summary.kpis;
  const monthDelta = k.revenue_prev_month
    ? Math.round(((k.revenue_month - k.revenue_prev_month) / k.revenue_prev_month) * 100)
    : null;

  const kpis: Kpi[] = [
    { label: 'Omzet deze maand', value: fmtEur(k.revenue_month), delta: monthDelta ?? undefined, hint: 'vs. vorige 30d' },
    { label: 'Brutowinst', value: fmtEur(k.gross_profit_month), hint: `marge ${k.avg_margin_pct}%` },
    { label: 'Verkocht (30d)', value: String(k.sold_month_count), hint: `gem. ${fmtEur(k.avg_sale_price)}` },
    { label: 'Actieve leads', value: String(k.active_leads), hint: `${k.active_listings} in voorraad` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-border/60 bg-card p-3"
        >
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{kpi.label}</p>
          <p className="mt-1 text-lg font-bold text-foreground leading-tight">{kpi.value}</p>
          <div className="mt-1 flex items-center gap-1">
            {typeof kpi.delta === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-[10px] font-semibold',
                  kpi.delta > 0 ? 'text-emerald-600' : kpi.delta < 0 ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {kpi.delta > 0 ? <TrendingUp className="h-3 w-3" /> : kpi.delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {kpi.delta > 0 ? '+' : ''}{kpi.delta}%
              </span>
            )}
            {kpi.hint && <span className="text-[10px] text-muted-foreground">{kpi.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

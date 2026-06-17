import type { DealerSummary } from '@/hooks/useDealerSummary';

export function InsightList({ summary }: { summary: DealerSummary }) {
  if (!summary.insights.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <p className="text-xs font-semibold text-foreground mb-2">📊 Inzichten vandaag</p>
      <ul className="space-y-1.5">
        {summary.insights.map((i, idx) => (
          <li key={idx} className="text-xs leading-snug text-foreground/80">{i}</li>
        ))}
      </ul>
    </div>
  );
}

import type { DealerSummary } from '@/hooks/useDealerSummary';
import { BarChart3 } from 'lucide-react';

export function InsightList({ summary }: { summary: DealerSummary }) {
  if (!summary.insights.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        Inzichten vandaag
      </p>
      <ul className="space-y-1.5">
        {summary.insights.map((i, idx) => (
          <li key={idx} className="text-xs leading-snug text-foreground/80">{i}</li>
        ))}
      </ul>
    </div>
  );
}

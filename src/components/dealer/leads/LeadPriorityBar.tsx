import { Inbox, Clock, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeadFocus } from '@/hooks/useDealerLeads';

export interface PriorityCounts {
  new: number;
  waiting: number;
  followups: number;
}

/**
 * Compacte prioriteitsbalk boven de leadslijst. Elk item is klikbaar en
 * activeert het overeenkomstige focusfilter.
 */
export function LeadPriorityBar({
  counts,
  active,
  onSelect,
}: {
  counts: PriorityCounts;
  active: LeadFocus;
  onSelect: (focus: LeadFocus) => void;
}) {
  const items: { key: Exclude<LeadFocus, ''>; label: string; count: number; icon: typeof Inbox; urgent?: boolean }[] = [
    { key: 'new', label: counts.new === 1 ? 'nieuwe lead' : 'nieuwe leads', count: counts.new, icon: Inbox },
    {
      key: 'waiting',
      label: counts.waiting === 1 ? 'lead wacht langer dan 24 u' : 'leads wachten langer dan 24 u',
      count: counts.waiting,
      icon: Clock,
      urgent: counts.waiting > 0,
    },
    {
      key: 'followups',
      label: counts.followups === 1 ? 'opvolging vandaag' : 'opvolgingen vandaag',
      count: counts.followups,
      icon: CalendarClock,
      urgent: counts.followups > 0,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Prioriteiten">
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? '' : item.key)}
            className={cn(
              'inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus-ring',
              isActive
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20',
            )}
          >
            <item.icon className={cn('h-4 w-4', item.urgent && !isActive && 'text-warning')} />
            <span className="font-semibold text-foreground">{item.count}</span> {item.label}
          </button>
        );
      })}
    </div>
  );
}

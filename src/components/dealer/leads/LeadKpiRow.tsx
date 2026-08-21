import { MessageSquare, Inbox, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DealerLead } from '@/hooks/useDealerLeads';

function countBy(leads: DealerLead[], status: DealerLead['status']) {
  return leads.filter((l) => l.status === status).length;
}

export function LeadKpiRow({ leads }: { leads: DealerLead[] }) {
  const stats = [
    { label: 'Nieuw', value: countBy(leads, 'new'), icon: Inbox, tone: 'text-primary-strong' },
    { label: 'Opgevolgd', value: countBy(leads, 'contacted'), icon: MessageSquare, tone: 'text-accent' },
    { label: 'Gewonnen', value: countBy(leads, 'won'), icon: CheckCircle2, tone: 'text-success' },
    { label: 'Verloren', value: countBy(leads, 'lost'), icon: XCircle, tone: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <s.icon className={cn('h-5 w-5 shrink-0', s.tone)} />
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

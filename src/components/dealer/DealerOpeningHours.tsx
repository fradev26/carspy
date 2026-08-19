import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDealerHours, WEEKDAYS, formatDay, isOpenNow } from '@/hooks/useDealerHours';

/** Publieke openingsuren op /dealer/:slug (A2.4). */
export function DealerOpeningHours({ dealerUserId }: { dealerUserId?: string }) {
  const { data: rows, isLoading } = useDealerHours(dealerUserId);
  const todayIndex = (new Date().getDay() + 6) % 7;

  if (isLoading) {
    return (
      <Card className="border-border/60 shadow-card">
        <CardContent className="space-y-2 p-5">
          <Skeleton className="h-5 w-40" />
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!rows || rows.length === 0) return null;
  const open = isOpenNow(rows);

  return (
    <Card className="border-border/60 shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Openingsuren
          </h2>
          {open !== null && (
            <Badge
              variant="outline"
              className={cn(open ? 'border-success/40 text-success' : 'border-border text-muted-foreground')}
            >
              {open ? 'Nu open' : 'Nu gesloten'}
            </Badge>
          )}
        </div>

        <dl className="mt-3 space-y-1.5 text-sm">
          {rows.map((row) => (
            <div
              key={row.weekday}
              className={cn(
                'flex items-baseline justify-between gap-4',
                row.weekday === todayIndex && 'font-semibold text-foreground',
              )}
            >
              <dt className="text-muted-foreground">{WEEKDAYS[row.weekday]}</dt>
              <dd className={cn(row.closed ? 'text-muted-foreground' : 'text-foreground')}>{formatDay(row)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

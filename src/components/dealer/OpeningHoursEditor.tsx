import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  useDealerHours,
  useSaveDealerHours,
  emptyWeek,
  WEEKDAYS,
  type OpeningHourRow,
} from '@/hooks/useDealerHours';

/** Beheer van openingsuren die op de publieke dealerpagina verschijnen. */
export default function OpeningHoursEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading } = useDealerHours(user?.id);
  const save = useSaveDealerHours(user?.id);
  const [rows, setRows] = useState<OpeningHourRow[]>(emptyWeek());

  useEffect(() => {
    if (!data) return;
    setRows(data.length > 0 ? emptyWeek().map((d) => data.find((r) => r.weekday === d.weekday) ?? d) : emptyWeek());
  }, [data]);

  const update = (weekday: number, patch: Partial<OpeningHourRow>) =>
    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));

  const handleSave = async () => {
    try {
      await save.mutateAsync(rows);
      toast({ title: 'Openingsuren opgeslagen' });
    } catch (err) {
      toast({
        title: 'Opslaan mislukt',
        description: err instanceof Error ? err.message : 'Probeer het later opnieuw.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Deze uren tonen we op je publieke dealerpagina, samen met een “nu open”-indicator.
      </p>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.weekday} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-3">
            <span className="w-24 text-sm font-medium">{WEEKDAYS[row.weekday]}</span>
            <div className="flex items-center gap-2">
              <Switch
                id={`open-${row.weekday}`}
                checked={!row.closed}
                onCheckedChange={(v) => update(row.weekday, { closed: !v })}
                aria-label={`${WEEKDAYS[row.weekday]} geopend`}
              />
              <label htmlFor={`open-${row.weekday}`} className="text-xs text-muted-foreground">
                {row.closed ? 'Gesloten' : 'Open'}
              </label>
            </div>
            {!row.closed && (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="w-28"
                  value={row.opens?.slice(0, 5) ?? ''}
                  onChange={(e) => update(row.weekday, { opens: e.target.value })}
                  aria-label={`Openingsuur ${WEEKDAYS[row.weekday]}`}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  className="w-28"
                  value={row.closes?.slice(0, 5) ?? ''}
                  onChange={(e) => update(row.weekday, { closes: e.target.value })}
                  aria-label={`Sluitingsuur ${WEEKDAYS[row.weekday]}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? 'Opslaan…' : 'Openingsuren opslaan'}
      </Button>
    </div>
  );
}

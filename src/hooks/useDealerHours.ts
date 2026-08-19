import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OpeningHourRow {
  weekday: number; // 0 = maandag ... 6 = zondag
  closed: boolean;
  opens: string | null;
  closes: string | null;
  break_start: string | null;
  break_end: string | null;
}

export const WEEKDAYS = [
  'Maandag',
  'Dinsdag',
  'Woensdag',
  'Donderdag',
  'Vrijdag',
  'Zaterdag',
  'Zondag',
] as const;

/** schema.org-codes in dezelfde volgorde als WEEKDAYS. */
export const SCHEMA_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export function emptyWeek(): OpeningHourRow[] {
  return WEEKDAYS.map((_, weekday) => ({
    weekday,
    closed: weekday === 6,
    opens: weekday === 6 ? null : '09:00',
    closes: weekday === 6 ? null : '18:00',
    break_start: null,
    break_end: null,
  }));
}

/** Kort formaat "09:00 – 18:00" (met eventuele middagpauze). */
export function formatDay(row: OpeningHourRow): string {
  if (row.closed || !row.opens || !row.closes) return 'Gesloten';
  const t = (v: string) => v.slice(0, 5);
  if (row.break_start && row.break_end) {
    return `${t(row.opens)} – ${t(row.break_start)} · ${t(row.break_end)} – ${t(row.closes)}`;
  }
  return `${t(row.opens)} – ${t(row.closes)}`;
}

export function isOpenNow(rows: OpeningHourRow[], now = new Date()): boolean | null {
  if (rows.length === 0) return null;
  const weekday = (now.getDay() + 6) % 7; // JS: zondag = 0 → onze index 6
  const row = rows.find((r) => r.weekday === weekday);
  if (!row || row.closed || !row.opens || !row.closes) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  if (minutes < toMin(row.opens) || minutes >= toMin(row.closes)) return false;
  if (row.break_start && row.break_end && minutes >= toMin(row.break_start) && minutes < toMin(row.break_end)) {
    return false;
  }
  return true;
}

export function useDealerHours(dealerUserId?: string) {
  return useQuery<OpeningHourRow[]>({
    queryKey: ['dealer-hours', dealerUserId],
    enabled: !!dealerUserId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dealer_opening_hours' as any)
        .select('weekday, closed, opens, closes, break_start, break_end')
        .eq('user_id', dealerUserId!)
        .order('weekday');
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as OpeningHourRow[];
    },
  });
}

export function useSaveDealerHours(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: OpeningHourRow[]) => {
      if (!userId) throw new Error('Niet ingelogd');
      const payload = rows.map((r) => ({
        user_id: userId,
        weekday: r.weekday,
        closed: r.closed,
        opens: r.closed ? null : r.opens,
        closes: r.closed ? null : r.closes,
        break_start: r.closed ? null : r.break_start,
        break_end: r.closed ? null : r.break_end,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('dealer_opening_hours' as any)
        .upsert(payload as any, { onConflict: 'user_id,weekday' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dealer-hours', userId] }),
  });
}

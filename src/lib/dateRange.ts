/** Gedeelde datumbereik-logica voor de analytics-pagina's. */

export type RangePreset = 7 | 30 | 90 | 'custom';

export interface AnalyticsRange {
  preset: RangePreset;
  /** Inclusieve startdag, YYYY-MM-DD (UTC). */
  from: string;
  /** Inclusieve einddag, YYYY-MM-DD (UTC). */
  to: string;
}

/** Dagsleutel op basis van de lokale kalenderdag (niet UTC). */
export const toDayKey = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Lokale middernacht voor een dagsleutel, zodat toDayKey(fromDayKey(k)) === k. */
export const fromDayKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

/** Aantal dagen in het bereik (inclusief begin- en einddag). */
export function rangeDays(range: { from: string; to: string }): number {
  const diff = fromDayKey(range.to).getTime() - fromDayKey(range.from).getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

/** Bereik van de laatste `days` dagen, eindigend vandaag. */
export function presetRange(days: 7 | 30 | 90): AnalyticsRange {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  return { preset: days, from: toDayKey(from), to: toDayKey(to) };
}

export function customRange(from: Date, to: Date): AnalyticsRange {
  const [a, b] = from.getTime() <= to.getTime() ? [from, to] : [to, from];
  return { preset: 'custom', from: toDayKey(a), to: toDayKey(b) };
}

export const DEFAULT_RANGE = (): AnalyticsRange => presetRange(30);

export function formatRangeLabel(range: AnalyticsRange): string {
  if (range.preset !== 'custom') return `Laatste ${range.preset} dagen`;
  const fmt = (k: string) =>
    fromDayKey(k).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: '2-digit' });
  return `${fmt(range.from)} – ${fmt(range.to)}`;
}

/** Valt een ISO-timestamp of dagsleutel binnen het bereik? */
export function inRange(value: string, range: { from: string; to: string }): boolean {
  const day = value.slice(0, 10);
  return day >= range.from && day <= range.to;
}

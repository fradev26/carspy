/**
 * Unit-aware formatters for the VATUUR listing datacontract.
 * Always render values together with the unit stored in the DB.
 */

const nl = new Intl.NumberFormat('nl-NL');
const nl1 = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function kwToPk(kw: number): number {
  return Math.round(kw * 1.36);
}

/** Render power as "120 kW · 163 pk" (assuming unit is kW). */
export function formatPower(value?: number | null, unit: string = 'kW'): string | null {
  if (value == null) return null;
  if (unit.toLowerCase() === 'kw') {
    return `${nl.format(value)} kW · ${nl.format(kwToPk(value))} pk`;
  }
  return `${nl.format(value)} ${unit}`;
}

export function formatMileage(value?: number | null, unit: string = 'km'): string | null {
  if (value == null) return null;
  return `${nl.format(value)} ${unit}`;
}

export function formatConsumption(value?: number | null, unit: string = 'l/100km'): string | null {
  if (value == null) return null;
  return `${nl1.format(value)} ${unit.replace('l/100km', 'l/100 km')}`;
}

export function formatNumberWithUnit(value?: number | null, unit?: string | null): string | null {
  if (value == null) return null;
  return unit ? `${nl.format(value)} ${unit}` : nl.format(value);
}

export function formatPrice(price?: number | null): string {
  if (price == null) return '—';
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}

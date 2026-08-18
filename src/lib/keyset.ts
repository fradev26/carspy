/**
 * Cursor-based (keyset) pagination helpers.
 *
 * Shared contract between the consumer search feed (/zoeken) and the dealer
 * inventory feed (/zakelijk/voorraad) so a future native/Capacitor client can
 * reuse the exact same request/response shape:
 *
 *   request : { cursor: string | null, limit: number, ...filters }
 *   response: { items: T[], nextCursor: string | null, total: number | null }
 *
 * A cursor encodes the *values* of every ordering key of the last row of the
 * previous batch (including the created_at + id tie-breakers), so results stay
 * stable when rows are inserted or removed while the user scrolls.
 */

export type SortDir = 'asc' | 'desc';

export interface KeysetKey {
  column: string;
  dir: SortDir;
}

export type KeysetValue = string | number | boolean | null;

export const DEFAULT_PAGE_SIZE = 20;

/** Ordering keys per sort option. created_at + id tie-breakers are appended. */
export function searchSortKeys(sort: string): KeysetKey[] {
  const head: KeysetKey[] = [
    { column: 'is_premium', dir: 'desc' },
    { column: 'is_boosted', dir: 'desc' },
  ];
  const main: KeysetKey[] = (() => {
    switch (sort) {
      case 'price-asc':
        return [{ column: 'price', dir: 'asc' as SortDir }];
      case 'price-desc':
        return [{ column: 'price', dir: 'desc' as SortDir }];
      case 'mileage-asc':
        return [{ column: 'mileage', dir: 'asc' as SortDir }];
      case 'year-desc':
        return [{ column: 'year', dir: 'desc' as SortDir }];
      // 'newest' / 'relevance' and anything unknown fall back to recency
      default:
        return [];
    }
  })();
  return [...head, ...main, { column: 'created_at', dir: 'desc' }, { column: 'id', dir: 'desc' }];
}

/** Ordering keys for the dealer inventory feed. */
export function inventorySortKeys(): KeysetKey[] {
  return [
    { column: 'created_at', dir: 'desc' },
    { column: 'id', dir: 'desc' },
  ];
}

function b64encode(input: string): string {
  if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(input)));
  // Node / edge runtime fallback
  return Buffer.from(input, 'utf-8').toString('base64');
}

function b64decode(input: string): string {
  if (typeof atob === 'function') return decodeURIComponent(escape(atob(input)));
  return Buffer.from(input, 'base64').toString('utf-8');
}

export function encodeCursor(values: KeysetValue[]): string {
  return b64encode(JSON.stringify(values));
}

export function decodeCursor(cursor: string | null | undefined): KeysetValue[] | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(b64decode(cursor));
    return Array.isArray(parsed) ? (parsed as KeysetValue[]) : null;
  } catch {
    return null;
  }
}

/** Build the cursor for the last row of a batch. */
export function cursorFromRow(row: Record<string, unknown>, keys: KeysetKey[]): string {
  return encodeCursor(keys.map((k) => (row[k.column] ?? null) as KeysetValue));
}

function fmt(value: KeysetValue): string {
  if (typeof value === 'string') return `"${value.replace(/"/g, '')}"`;
  return String(value);
}

function eqTerm(key: KeysetKey, value: KeysetValue): string {
  return value === null ? `${key.column}.is.null` : `${key.column}.eq.${fmt(value)}`;
}

/**
 * Build a PostgREST `.or()` expression that selects every row strictly *after*
 * the cursor row in the given ordering. NULLs are always ordered last
 * (matching `.order(col, { nullsFirst: false })`).
 */
export function buildKeysetFilter(keys: KeysetKey[], values: KeysetValue[]): string | null {
  if (!keys.length || keys.length !== values.length) return null;

  const branches: string[] = [];

  for (let i = 0; i < keys.length; i++) {
    const prefix = keys.slice(0, i).map((k, j) => eqTerm(k, values[j]));
    const key = keys[i];
    const value = values[i];

    const comparisons: string[] = [];
    if (value === null) {
      // Everything after a NULL (nulls last) is also NULL on this key.
      comparisons.push(`${key.column}.is.null`);
    } else {
      comparisons.push(`${key.column}.${key.dir === 'asc' ? 'gt' : 'lt'}.${fmt(value)}`);
      // NULLs sort last in both directions, so they come after any value.
      comparisons.push(`${key.column}.is.null`);
    }

    for (const cmp of comparisons) {
      const terms = [...prefix, cmp];
      branches.push(terms.length === 1 ? terms[0] : `and(${terms.join(',')})`);
    }
  }

  return branches.join(',');
}

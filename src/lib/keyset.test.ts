import { describe, it, expect } from 'vitest';
import {
  buildKeysetFilter,
  cursorFromRow,
  decodeCursor,
  encodeCursor,
  searchSortKeys,
} from './keyset';

describe('keyset cursors', () => {
  it('round-trips cursor values', () => {
    const values = [true, false, 12500, '2026-08-01T10:00:00Z', 'id-1'];
    expect(decodeCursor(encodeCursor(values))).toEqual(values);
  });

  it('returns null for empty or malformed cursors', () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor('not-base64!!')).toBeNull();
  });

  it('builds a cursor from the last row of a batch', () => {
    const keys = searchSortKeys('newest');
    const row = { is_premium: false, is_boosted: false, created_at: 'T', id: 'x' };
    expect(decodeCursor(cursorFromRow(row, keys))).toEqual([false, false, 'T', 'x']);
  });

  it('always ends the ordering keys with created_at + id tie-breakers', () => {
    for (const sort of ['newest', 'price-asc', 'price-desc', 'mileage-asc', 'year-desc', 'relevance']) {
      const keys = searchSortKeys(sort);
      expect(keys.slice(-2).map((k) => k.column)).toEqual(['created_at', 'id']);
    }
  });

  it('builds a strict "after cursor" predicate honouring sort direction', () => {
    const expr = buildKeysetFilter(
      [
        { column: 'price', dir: 'asc' },
        { column: 'id', dir: 'desc' },
      ],
      [10000, 'abc'],
    );
    expect(expr).toContain('price.gt.10000');
    expect(expr).toContain('and(price.eq.10000,id.lt."abc")');
  });

  it('treats NULLs as ordered last', () => {
    const expr = buildKeysetFilter([{ column: 'price', dir: 'desc' }], [null]);
    expect(expr).toBe('price.is.null');
  });

  it('returns null when keys and values do not match', () => {
    expect(buildKeysetFilter([{ column: 'id', dir: 'asc' }], [])).toBeNull();
  });
});

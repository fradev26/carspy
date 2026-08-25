import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FilterPanel } from './FilterPanel';

describe('FilterPanel — unieke ids per instantie', () => {
  it('geeft elke instantie eigen checkbox-ids zodat labels de juiste checkbox raken', () => {
    const { container } = render(
      <>
        <FilterPanel filters={{}} onFiltersChange={() => {}} />
        <FilterPanel filters={{}} onFiltersChange={() => {}} />
      </>
    );

    const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it('geeft elke checkbox een toegankelijke naam', () => {
    const { container } = render(<FilterPanel filters={{}} onFiltersChange={() => {}} />);
    const boxes = Array.from(container.querySelectorAll('button[role="checkbox"]'));
    expect(boxes.length).toBeGreaterThan(0);
    expect(boxes.every((b) => (b.getAttribute('aria-label') ?? '').length > 0)).toBe(true);
  });
});

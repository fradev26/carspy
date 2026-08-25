import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterPanel } from './FilterPanel';

function renderPanels(count: number) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      {Array.from({ length: count }, (_, i) => (
        <FilterPanel key={i} filters={{}} onFiltersChange={() => {}} />
      ))}
    </QueryClientProvider>
  );
}

describe('FilterPanel — unieke ids per instantie', () => {
  it('geeft elke instantie eigen checkbox-ids zodat labels de juiste checkbox raken', () => {
    const { container } = renderPanels(2);
    const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it('geeft elke checkbox een toegankelijke naam', () => {
    const { container } = renderPanels(1);
    const boxes = Array.from(container.querySelectorAll('button[role="checkbox"]'));
    expect(boxes.length).toBeGreaterThan(0);
    expect(boxes.every((b) => (b.getAttribute('aria-label') ?? '').length > 0)).toBe(true);
  });
});

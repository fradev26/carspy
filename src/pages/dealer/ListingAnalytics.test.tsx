import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ListingAnalytics from './ListingAnalytics';
import type { ListingDrilldown } from '@/hooks/useListingAnalytics';

const state: { data: ListingDrilldown | null; error: string | null } = { data: null, error: null };

vi.mock('@/hooks/useListingAnalytics', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useListingAnalytics')>(
    '@/hooks/useListingAnalytics',
  );
  return {
    ...actual,
    useListingAnalytics: () => ({ data: state.data, loading: false, error: state.error, refresh: vi.fn() }),
  };
});

vi.mock('@/components/boost/BoostDialog', () => ({ BoostDialog: () => null }));

function buildData(views: number): ListingDrilldown {
  return {
    listing: {
      id: 'l1', title: 'BMW 320d', brand: 'BMW', model: '320d', year: 2020, mileage: 50000,
      fuelType: 'diesel', price: 25000, status: 'active', image: null,
      createdAt: new Date().toISOString(), isPremium: false, boostUntil: null, daysLive: 10,
    },
    totals: { views, favorites: 2, conversations: 1, messages: 3 },
    period: { days: 30, views, favorites: 2, conversations: 1, messages: 3 },
    series: [{ date: '2026-08-18', views, favorites: 2, conversations: 1, messages: 3, leads: 3 }],
    benchmark: { peerCount: 2, ownViewsPerDay: 1, peerAvgViewsPerDay: 2 },
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/zakelijk/analytics/l1']}>
      <Routes>
        <Route path="/zakelijk/analytics/:id" element={<ListingAnalytics />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ListingAnalytics', () => {
  beforeEach(() => {
    state.data = null;
    state.error = null;
  });

  it('toont de kerncijfers van het voertuig', () => {
    state.data = buildData(40);
    renderPage();
    expect(screen.getByRole('heading', { name: 'BMW 320d' })).toBeInTheDocument();
    expect(screen.getAllByText('Weergaven').length).toBeGreaterThan(0);
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });

  it('toont een lege staat wanneer er nog geen meetdata is', () => {
    const empty = buildData(0);
    empty.totals = { views: 0, favorites: 0, conversations: 0, messages: 0 };
    empty.series = [{ date: '2026-08-18', views: 0, favorites: 0, conversations: 0, messages: 0, leads: 0 }];
    state.data = empty;
    renderPage();
    expect(screen.getByText(/Nog geen meetdata/i)).toBeInTheDocument();
  });

  it('toont een foutmelding wanneer laden mislukt', () => {
    state.error = 'Kon statistieken voor dit voertuig niet laden';
    renderPage();
    expect(screen.getByText(/Kon statistieken/i)).toBeInTheDocument();
  });
});

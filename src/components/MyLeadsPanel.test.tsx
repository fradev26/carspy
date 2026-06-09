import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyLeadsPanel from './MyLeadsPanel';

// --- Mocks ---
vi.mock('@/hooks/useAuth', () => {
  const user = { id: 'user-1' };
  return { useAuth: () => ({ user }) };
});
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/hooks/useMarketingEvents', () => ({
  useMarketingEvents: () => ({ trackEvent: vi.fn() }),
}));

const leadsMock = vi.fn();
const updateMock = vi.fn();
const eqUpdateMock = vi.fn();
const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      fromMock(table);
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: (...args: unknown[]) => leadsMock(...args),
            }),
          }),
        }),
        update: (payload: unknown) => {
          updateMock(payload);
          return { eq: (col: string, val: unknown) => { eqUpdateMock(col, val); return Promise.resolve({ error: null }); } };
        },
      };
    },
  },
}));

type Listing = {
  id: string;
  status: string;
  boost_until: string | null;
  created_at: string;
  views: number;
  images: string[] | null;
};

function makeLead(opts: {
  status: 'analyzed' | 'account_created' | 'listed' | 'offered_to_dealers' | 'sold';
  listing?: Partial<Listing> | null;
  listingId?: string | null;
}) {
  const listingId = opts.listingId === undefined ? (opts.listing ? 'listing-1' : null) : opts.listingId;
  return {
    id: 'lead-1',
    brand: 'BMW',
    model: '320d',
    year: 2020,
    mileage: 80000,
    estimated_price: 22000,
    status: opts.status,
    created_at: new Date().toISOString(),
    offer_eligible_at: null,
    listing_id: listingId,
    listings: opts.listing
      ? {
          id: listingId ?? 'listing-1',
          status: 'active',
          boost_until: null,
          created_at: new Date().toISOString(),
          views: 0,
          images: ['/p.jpg'],
          ...opts.listing,
        }
      : null,
  };
}

async function renderWith(lead: ReturnType<typeof makeLead>) {
  leadsMock.mockResolvedValue({ data: [lead] });
  render(
    <MemoryRouter>
      <MyLeadsPanel />
    </MemoryRouter>,
  );
  // wait for loading spinner gone (no testid; just wait for known text)
  await screen.findByText('Mijn verkoopstatus');
}

beforeEach(() => {
  leadsMock.mockReset();
});

describe('MyLeadsPanel — contextual actions per status', () => {
  it('no listing yet → only "Plaats advertentie"', async () => {
    await renderWith(makeLead({ status: 'analyzed', listing: null, listingId: null }));
    expect(screen.getByRole('link', { name: /Plaats advertentie/i })).toBeInTheDocument();
    expect(screen.queryByText(/Verder met advertentie/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bekijk advertentie/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Boost/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dealer-favoriet/i)).not.toBeInTheDocument();
  });

  it('draft → "Verder met advertentie" + "Foto\'s uploaden", no boost/dealer', async () => {
    await renderWith(makeLead({ status: 'listed', listing: { status: 'draft', images: [] } }));
    expect(screen.getByRole('link', { name: /Verder met advertentie/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Foto's uploaden/i })).toBeInTheDocument();
    expect(screen.queryByText(/Boost/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dealer-favoriet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Bekijk advertentie/i })).not.toBeInTheDocument();
  });

  it('active without photos → Bekijk + Foto\'s uploaden + Boost activeren + dealer-favoriet', async () => {
    await renderWith(makeLead({ status: 'listed', listing: { status: 'active', images: [] } }));
    expect(screen.getByRole('link', { name: /Bekijk advertentie/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Foto's uploaden/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Boost activeren/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vraag dealer-favoriet aan/i })).toBeInTheDocument();
    expect(screen.queryByText(/Verder met advertentie/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Boost opnieuw aanvragen/i)).not.toBeInTheDocument();
  });

  it('active with expired boost → "Boost opnieuw aanvragen", not "Boost activeren"', async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    await renderWith(makeLead({ status: 'listed', listing: { status: 'active', boost_until: past, images: ['/p.jpg'] } }));
    expect(screen.getByRole('link', { name: /Boost opnieuw aanvragen/i })).toBeInTheDocument();
    expect(screen.queryByText(/Boost activeren/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Foto's uploaden/i })).not.toBeInTheDocument();
  });

  it('active with active boost → no boost CTA shown', async () => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString();
    await renderWith(makeLead({ status: 'listed', listing: { status: 'active', boost_until: future, images: ['/p.jpg'] } }));
    expect(screen.queryByText(/Boost activeren/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Boost opnieuw aanvragen/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vraag dealer-favoriet aan/i })).toBeInTheDocument();
  });

  it('offered_to_dealers → Bekijk advertentie + dealerberichten, no dealer-favoriet/boost', async () => {
    await renderWith(makeLead({ status: 'offered_to_dealers', listing: { status: 'active' } }));
    expect(screen.getByRole('link', { name: /Bekijk advertentie/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bekijk dealerberichten/i })).toBeInTheDocument();
    expect(screen.queryByText(/dealer-favoriet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Boost/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Foto's uploaden/i)).not.toBeInTheDocument();
  });

  it('sold → only "Nieuwe advertentie plaatsen"', async () => {
    await renderWith(makeLead({ status: 'sold', listing: { status: 'active' } }));
    expect(screen.getByRole('link', { name: /Nieuwe advertentie plaatsen/i })).toBeInTheDocument();
    expect(screen.queryByText(/dealer-favoriet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Boost/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bekijk dealerberichten/i)).not.toBeInTheDocument();
  });
});

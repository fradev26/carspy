import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LeadDetail from './LeadDetail';
import type { LeadDetailData } from '@/hooks/useLeadDetail';

const mockUseLeadDetail = vi.fn();
const mockUpdateLeadStatus = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/hooks/useLeadDetail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useLeadDetail')>();
  return {
    ...actual,
    useLeadDetail: (...args: unknown[]) => mockUseLeadDetail(...args),
    updateLeadStatus: (...args: unknown[]) => mockUpdateLeadStatus(...args),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const contactDetail: LeadDetailData = {
  lead: {
    id: 'lead-1',
    type: 'contactaanvraag',
    name: 'Nadia Bakker',
    email: 'nadia@example.com',
    phone: '+31 6 2211 8834',
    company: null,
    listingTitle: 'Tesla Model 3 Long Range',
    listingId: 'listing-1',
    snippet: 'Kan de Tesla geleverd worden?',
    status: 'in_progress',
    createdAt: '2026-08-20T08:00:00Z',
  },
  vehicle: {
    id: 'listing-1',
    title: 'Tesla Model 3 Long Range',
    brand: 'Tesla',
    model: 'Model 3',
    year: 2023,
    price: 32900,
    image: null,
  },
  events: [
    { id: 'audit-1', kind: 'status', at: '2026-08-20T10:00:00Z', fromStatus: 'new', toStatus: 'in_progress' },
    { id: 'created', kind: 'created', at: '2026-08-20T08:00:00Z', content: 'Contactaanvraag ontvangen' },
  ],
};

const convDetail: LeadDetailData = {
  ...contactDetail,
  lead: {
    ...contactDetail.lead,
    id: 'conv-1',
    type: 'bericht',
    name: 'Thomas Vancoillie',
    email: null,
    phone: null,
    conversationId: 'conv-1',
  },
  events: [
    { id: 'msg-1', kind: 'message', at: '2026-08-20T09:00:00Z', content: 'Kan de Tesla met trekhaak?', senderName: 'Thomas Vancoillie', senderIsDealer: false },
    { id: 'created', kind: 'created', at: '2026-08-20T08:00:00Z', content: 'Gesprek gestart' },
  ],
};

function renderPage(id = 'lead-1') {
  return render(
    <MemoryRouter initialEntries={[`/zakelijk/leads/${id}`]}>
      <Routes>
        <Route path="/zakelijk/leads/:id" element={<LeadDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LeadDetail', () => {
  beforeEach(() => {
    mockUseLeadDetail.mockReset();
    mockUpdateLeadStatus.mockClear();
  });

  it('toont contactgegevens, voertuig en timeline voor een contactaanvraag', () => {
    mockUseLeadDetail.mockReturnValue({ data: contactDetail, isLoading: false, refetch: vi.fn() });
    renderPage('lead-1');

    expect(screen.getByRole('heading', { name: 'Nadia Bakker' })).toBeInTheDocument();
    expect(screen.getByText('Contactaanvraag')).toBeInTheDocument();
    expect(screen.getByText('nadia@example.com')).toBeInTheDocument();
    expect(screen.getByText('Tesla Model 3 Long Range')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tesla Model 3 Long Range/ })).toHaveAttribute('href', '/auto/listing-1');
    expect(screen.getByText(/Status gewijzigd/)).toBeInTheDocument();
    expect(screen.getByText('Contactaanvraag ontvangen')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terug naar leads/ })).toHaveAttribute('href', '/zakelijk/leads');
  });

  it('toont berichten in de timeline en een antwoordknop voor gespreksleads', () => {
    mockUseLeadDetail.mockReturnValue({ data: convDetail, isLoading: false, refetch: vi.fn() });
    renderPage('conv-1');

    expect(screen.getByText('Kan de Tesla met trekhaak?')).toBeInTheDocument();
    expect(screen.getByText('Gesprek gestart')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Antwoorden/ })).toHaveAttribute('href', '/berichten');
    expect(screen.queryByText('nadia@example.com')).not.toBeInTheDocument();
  });

  it('toont een lege staat als de lead niet bestaat', () => {
    mockUseLeadDetail.mockReturnValue({ data: null, isLoading: false, refetch: vi.fn() });
    renderPage('onbekend');
    expect(screen.getByText(/niet gevonden/)).toBeInTheDocument();
  });
});

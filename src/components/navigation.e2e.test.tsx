import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/* ---------- hook mocks: één plek voor rol/sessie ---------- */

const state = {
  user: { id: 'u1' } as { id: string } | null,
  isDealer: false,
  canViewLeads: false,
  unread: 0,
  newLeads: 0,
};

const openChat = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: state.user, session: state.user ? {} : null, loading: false, signOut: vi.fn() }),
}));
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: state.user ? { id: 'u1', is_dealer: state.isDealer } : null, loading: false, isDealer: state.isDealer }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    role: state.isDealer ? 'owner' : null,
    isMember: state.isDealer,
    isOwner: state.isDealer,
    canManageUsers: state.isDealer,
    canManageBilling: state.isDealer,
    canEditCompany: state.isDealer,
    canEditListings: state.isDealer,
    canDeleteListings: state.isDealer,
    canBoost: state.isDealer,
    canViewLeads: state.canViewLeads,
    loading: false,
  }),
}));
vi.mock('@/hooks/useUnreadMessages', () => ({ useUnreadMessages: () => ({ count: state.unread }) }));
vi.mock('@/hooks/useNewLeadsCount', () => ({ useNewLeadsCount: () => ({ count: state.newLeads }) }));
vi.mock('@/context/AIChatContext', () => ({
  useAIChat: () => ({ open: false, openChat, closeChat: vi.fn() }),
  AIChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { renderBottomNav, renderDesktopNav, renderHeader } from '@/test/navigationHarness';

function setRole(role: 'guest' | 'private' | 'dealer') {
  state.user = role === 'guest' ? null : { id: 'u1' };
  state.isDealer = role === 'dealer';
  state.canViewLeads = role === 'dealer';
}

const screenPath = () => screen.getByTestId('screen').textContent;

beforeEach(() => {
  openChat.mockClear();
  state.unread = 0;
  state.newLeads = 0;
  setRole('private');
});

/* ---------- mobiele bottomnav ---------- */

describe('E2E — mobiele bottomnav (particulier)', () => {
  it.each([
    ['Home', '/'],
    ['Zoeken', '/zoeken'],
    ['Favorieten', '/favorieten'],
    ['Verkopen', '/verkopen'],
  ])('navigeert via "%s" naar %s', async (label, path) => {
    setRole('private');
    renderBottomNav('/');
    await userEvent.click(screen.getByRole('link', { name: label }));
    await waitFor(() => expect(screenPath()).toBe(path));
  });

  it('stuurt een uitgelogde bezoeker vanaf Verkopen naar /auth', async () => {
    setRole('guest');
    renderBottomNav('/');
    await userEvent.click(screen.getByRole('link', { name: 'Verkopen' }));
    await waitFor(() => expect(screenPath()).toBe('/auth'));
  });

  it('opent de AI-assistent in plaats van te navigeren', async () => {
    setRole('private');
    renderBottomNav('/zoeken');
    await userEvent.click(screen.getByRole('button', { name: 'Open AI assistent' }));
    expect(openChat).toHaveBeenCalledTimes(1);
    expect(screenPath()).toBe('/zoeken');
  });
});

describe('E2E — mobiele bottomnav (dealer)', () => {
  it.each([
    ['Zoeken', '/zoeken'],
    ['Voorraad', '/zakelijk/voorraad'],
    ['Sales AI', '/zakelijk'],
    ['Favorieten', '/favorieten'],
    ['Analytics', '/zakelijk/analytics'],
  ])('navigeert via "%s" naar %s', async (label, path) => {
    setRole('dealer');
    renderBottomNav('/');
    await userEvent.click(screen.getByRole('link', { name: label }));
    await waitFor(() => expect(screenPath()).toBe(path));
  });

  it('toont exact de vijf zakelijke tabs en geen Verkopen-tab', () => {
    setRole('dealer');
    renderBottomNav('/');
    const labels = screen.getAllByRole('link').map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Zoeken', 'Voorraad', 'Sales AI', 'Favorieten', 'Analytics']);
  });

  it('markeert Sales AI enkel op /zakelijk zelf, niet op subroutes', async () => {
    setRole('dealer');
    const { unmount } = renderBottomNav('/zakelijk');
    expect(screen.getByRole('link', { name: 'Sales AI' })).toHaveAttribute('aria-current', 'page');
    unmount();

    renderBottomNav('/zakelijk/voorraad');
    expect(screen.getByRole('link', { name: 'Sales AI' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Voorraad' })).toHaveAttribute('aria-current', 'page');
  });
});

/* ---------- desktopnavigatie ---------- */

describe('E2E — desktopnavigatie (particulier)', () => {
  it.each([
    ['Home', '/'],
    ['Zoeken', '/zoeken'],
    ['Favorieten', '/favorieten'],
    ['Verkopen', '/verkopen'],
  ])('navigeert via "%s" naar %s', async (label, path) => {
    setRole('private');
    renderDesktopNav('/');
    await userEvent.click(screen.getByRole('link', { name: label }));
    await waitFor(() => expect(screenPath()).toBe(path));
  });
});

describe('E2E — desktopnavigatie (dealer)', () => {
  it.each([
    ['Sales AI', '/zakelijk'],
    ['Voorraad', '/zakelijk/voorraad'],
    ['Leads', '/zakelijk/leads'],
    ['Analytics', '/zakelijk/analytics'],
  ])('navigeert via "%s" naar %s', async (label, path) => {
    setRole('dealer');
    renderDesktopNav('/');
    await userEvent.click(screen.getByRole('link', { name: label }));
    await waitFor(() => expect(screenPath()).toBe(path));
  });

  it('verbergt Leads voor een dealer zonder leadrechten', () => {
    setRole('dealer');
    state.canViewLeads = false;
    renderDesktopNav('/');
    expect(screen.queryByRole('link', { name: 'Leads' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Voorraad' })).toBeInTheDocument();
  });
});

/* ---------- leads / berichten via het inbox-icoon ---------- */

describe('E2E — inbox-icoon (leads/berichten)', () => {
  it('stuurt een particulier naar /berichten', async () => {
    setRole('private');
    state.unread = 2;
    renderHeader('/');
    const links = screen.getAllByRole('link', { name: /Berichten \(2 ongelezen\)/ });
    await userEvent.click(links[0]);
    await waitFor(() => expect(screenPath()).toBe('/berichten'));
  });

  it('stuurt een dealer met leadrechten naar /zakelijk/leads', async () => {
    setRole('dealer');
    state.unread = 1;
    state.newLeads = 3;
    renderHeader('/');
    const links = screen.getAllByRole('link', { name: /Leads en berichten \(4 ongelezen\)/ });
    await userEvent.click(links[0]);
    await waitFor(() => expect(screenPath()).toBe('/zakelijk/leads'));
  });
});

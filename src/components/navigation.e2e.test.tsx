import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/react';
import { createNavState, dealerInbox, emptyInbox, privateInbox, totalInbox } from '@/test/fixtures';

/* ---------- hook mocks: één plek voor rol/sessie ---------- */

const nav = createNavState('private');
const state = {
  get user() { return nav.current.user; },
  get isDealer() { return nav.current.isDealer; },
  get canViewLeads() { return nav.current.canViewLeads; },
  get unread() { return nav.current.inbox.unread; },
  get newLeads() { return nav.current.inbox.newLeads; },
};

const openChat = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: state.user, session: state.user ? {} : null, loading: false, signOut: vi.fn() }),
}));
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: state.user ? { id: state.user.id, is_dealer: state.isDealer } : null, loading: false, isDealer: state.isDealer }),
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
vi.mock('@/hooks/useNewLeadsCount', () => ({
  // Respecteert de `enabled`-vlag net als de echte hook (0 zonder leadrechten).
  useNewLeadsCount: (enabled?: boolean) => ({ count: enabled ? state.newLeads : 0 }),
}));
vi.mock('@/context/AIChatContext', () => ({
  useAIChat: () => ({ open: false, openChat, closeChat: vi.fn() }),
  AIChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { renderBottomNav, renderDesktopNav, renderHeader } from '@/test/navigationHarness';

function setRole(role: 'guest' | 'private' | 'dealer') {
  nav.setRole(role);
  nav.setInbox({ unread: 0, newLeads: 0 });
}

const screenPath = () => screen.getByTestId('screen').textContent;

beforeEach(() => {
  openChat.mockClear();
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
    nav.setCanViewLeads(false);
    renderDesktopNav('/');
    expect(screen.queryByRole('link', { name: 'Leads' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Voorraad' })).toBeInTheDocument();
  });
});

/* ---------- leads / berichten via het inbox-icoon ---------- */

describe('E2E — inbox-icoon (leads/berichten)', () => {
  it('stuurt een particulier naar /berichten', async () => {
    setRole('private');
    nav.setInbox(privateInbox);
    renderHeader('/');
    const links = screen.getAllByRole('link', {
      name: new RegExp(`Berichten \\(${totalInbox(privateInbox)} ongelezen\\)`),
    });
    await userEvent.click(links[0]);
    await waitFor(() => expect(screenPath()).toBe('/berichten'));
  });

  it('stuurt een dealer met leadrechten naar /zakelijk/leads', async () => {
    setRole('dealer');
    nav.setInbox(dealerInbox);
    renderHeader('/');
    const links = screen.getAllByRole('link', {
      name: new RegExp(`Leads en berichten \\(${totalInbox(dealerInbox)} ongelezen\\)`),
    });
    await userEvent.click(links[0]);
    await waitFor(() => expect(screenPath()).toBe('/zakelijk/leads'));
  });
});

/* ---------- badge-telling per accounttype ---------- */

/** Alle inbox-links (mobiel + desktop) van de header. */
const inboxLinks = () =>
  screen.getAllByRole('link', { name: /^(Berichten|Leads en berichten)/ });

const badgeTexts = () =>
  inboxLinks().map((link) => within(link).queryByTestId('inbox-badge')?.textContent ?? null);

describe('E2E — inbox-badge telling per accounttype', () => {
  it('toont geen badge wanneer er niets ongelezen is (particulier)', () => {
    setRole('private');
    nav.setInbox(emptyInbox);
    renderHeader('/');
    inboxLinks().forEach((link) => {
      expect(link).toHaveAccessibleName('Berichten');
      expect(within(link).queryByTestId('inbox-badge')).toBeNull();
    });
  });

  it('telt voor een particulier enkel ongelezen berichten', () => {
    setRole('private');
    nav.setInbox({ unread: 2, newLeads: 5 });
    renderHeader('/');
    inboxLinks().forEach((link) => {
      expect(link).toHaveAccessibleName('Berichten (2 ongelezen)');
      expect(within(link).getByTestId('inbox-badge')).toHaveTextContent('2');
      expect(link).toHaveAttribute('href', '/berichten');
    });
  });

  it('telt voor een dealer berichten + nieuwe leads samen', () => {
    setRole('dealer');
    nav.setInbox(dealerInbox);
    renderHeader('/');
    const total = totalInbox(dealerInbox);
    inboxLinks().forEach((link) => {
      expect(link).toHaveAccessibleName(`Leads en berichten (${total} ongelezen)`);
      expect(within(link).getByTestId('inbox-badge')).toHaveTextContent(String(total));
      expect(link).toHaveAttribute('href', '/zakelijk/leads');
    });
  });

  it('kapt de badge af op 9+ bij meer dan negen items', () => {
    setRole('dealer');
    nav.setInbox({ unread: 6, newLeads: 7 });
    renderHeader('/');
    expect(badgeTexts().every((t) => t === '9+')).toBe(true);
    inboxLinks().forEach((link) => expect(link).toHaveAccessibleName('Leads en berichten (13 ongelezen)'));
  });

  it('negeert leads voor een dealer zonder leadrechten en routeert naar /berichten', async () => {
    setRole('dealer');
    nav.setCanViewLeads(false);
    nav.setInbox({ unread: 1, newLeads: 4 });
    renderHeader('/');
    const links = inboxLinks();
    links.forEach((link) => {
      expect(link).toHaveAccessibleName('Berichten (1 ongelezen)');
      expect(within(link).getByTestId('inbox-badge')).toHaveTextContent('1');
    });
    await userEvent.click(links[0]);
    await waitFor(() => expect(screenPath()).toBe('/berichten'));
  });

  it('toont geen inbox-icoon voor een uitgelogde bezoeker', () => {
    setRole('guest');
    renderHeader('/');
    expect(screen.queryByRole('link', { name: /^(Berichten|Leads en berichten)/ })).toBeNull();
  });
});

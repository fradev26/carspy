import { demoDealerListings, demoPrivateListings } from './listings';
import { dealerInbox, emptyInbox, privateInbox, type InboxCounts } from './leads';
import type { Listing } from '@/types/listing';

export type NavRole = 'guest' | 'private' | 'dealer';

export interface NavFixture {
  user: { id: string } | null;
  isDealer: boolean;
  canViewLeads: boolean;
  listings: Listing[];
  inbox: InboxCounts;
}

/** Rolpresets met bijhorende demo-listings en teller-fixtures. */
export const navFixtures: Record<NavRole, NavFixture> = {
  guest: { user: null, isDealer: false, canViewLeads: false, listings: [], inbox: emptyInbox },
  private: {
    user: { id: 'user-private' },
    isDealer: false,
    canViewLeads: false,
    listings: demoPrivateListings,
    inbox: privateInbox,
  },
  dealer: {
    user: { id: 'user-dealer' },
    isDealer: true,
    canViewLeads: true,
    listings: demoDealerListings,
    inbox: dealerInbox,
  },
};

/** Muteerbare state die de hook-mocks in de navigatie-E2E's uitlezen. */
export function createNavState(role: NavRole = 'private') {
  const state = { ...navFixtures[role], inbox: { ...navFixtures[role].inbox } };

  return {
    get current() {
      return state;
    },
    setRole(next: NavRole) {
      Object.assign(state, navFixtures[next], { inbox: { ...navFixtures[next].inbox } });
      return state;
    },
    setInbox(counts: Partial<InboxCounts>) {
      Object.assign(state.inbox, counts);
      return state;
    },
    setCanViewLeads(value: boolean) {
      state.canViewLeads = value;
      return state;
    },
  };
}

export type NavState = ReturnType<typeof createNavState>;

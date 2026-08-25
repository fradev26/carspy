/** Teller-fixtures voor het inbox-icoon (ongelezen berichten + nieuwe leads). */
export interface InboxCounts {
  unread: number;
  newLeads: number;
}

export const emptyInbox: InboxCounts = { unread: 0, newLeads: 0 };

/** Particulier: enkel ongelezen berichten. */
export const privateInbox: InboxCounts = { unread: 2, newLeads: 0 };

/** Dealer: berichten + nieuwe leads; badge toont de som (4). */
export const dealerInbox: InboxCounts = { unread: 1, newLeads: 3 };

export const totalInbox = (counts: InboxCounts) => counts.unread + counts.newLeads;

/** Minimale leadrecords die overeenkomen met de dealer-inbox hierboven. */
export interface DemoLead {
  id: string;
  name: string;
  email: string;
  status: 'new' | 'contacted' | 'won' | 'lost';
  source: string;
  listing_id: string | null;
  created_at: string;
}

export function makeLead(overrides: Partial<DemoLead> = {}): DemoLead {
  return {
    id: 'lead-0',
    name: 'Sofie Janssens',
    email: 'sofie@example.com',
    status: 'new',
    source: 'contact_form',
    listing_id: 'listing-1',
    created_at: '2026-02-01T09:00:00.000Z',
    ...overrides,
  };
}

/** Drie nieuwe leads, consistent met `dealerInbox.newLeads`. */
export const demoNewLeads: DemoLead[] = Array.from({ length: dealerInbox.newLeads }, (_, i) =>
  makeLead({
    id: `lead-${i + 1}`,
    name: `Demo Lead ${i + 1}`,
    email: `lead${i + 1}@example.com`,
    listing_id: `listing-${i + 1}`,
    created_at: `2026-02-0${i + 1}T09:00:00.000Z`,
  })
);

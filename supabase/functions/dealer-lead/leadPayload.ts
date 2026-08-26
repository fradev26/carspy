export interface DealerLeadInput {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  vat_number?: string | null;
  message?: string | null;
}

/**
 * Public /dealers requests are internal VATUUR leads. Dealer ownership is
 * deliberately absent; only a listing-backed flow may assign it in the DB.
 */
export function buildInternalDealerLead(input: DealerLeadInput) {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    company: input.company ?? null,
    vat_number: input.vat_number ?? null,
    message: input.message ?? null,
    source: "dealers_page_ai",
    listing_id: null,
    dealer_user_id: null,
    company_id: null,
  };
}
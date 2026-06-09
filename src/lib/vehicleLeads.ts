import { supabase } from '@/integrations/supabase/client';

export interface LeadDraft {
  brand: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  estimatedPrice?: number;
  priceMin?: number;
  priceMax?: number;
  email?: string;
  sessionId?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export async function insertVehicleLead(d: LeadDraft, userId?: string | null) {
  const { data, error } = await supabase
    .from('vehicle_leads')
    .insert({
      user_id: userId ?? null,
      email: d.email ?? null,
      brand: d.brand,
      model: d.model ?? null,
      year: d.year ?? null,
      mileage: d.mileage ?? null,
      fuel_type: d.fuelType ?? null,
      transmission: d.transmission ?? null,
      estimated_price: d.estimatedPrice ?? null,
      price_min: d.priceMin ?? null,
      price_max: d.priceMax ?? null,
      session_id: d.sessionId ?? null,
      utm_source: d.utmSource ?? null,
      utm_medium: d.utmMedium ?? null,
      utm_campaign: d.utmCampaign ?? null,
      status: 'analyzed',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export interface DraftListingInput {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType?: string;
  transmission?: string;
  suggestedPrice?: number;
}

export async function createDraftListing(userId: string, input: DraftListingInput) {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: userId,
      title: `${input.brand} ${input.model}`.trim(),
      brand: input.brand,
      model: input.model || input.brand,
      year: input.year,
      mileage: input.mileage,
      price: input.suggestedPrice ?? 0,
      fuel_type: input.fuelType || 'benzine',
      transmission: input.transmission || 'handgeschakeld',
      body_type: 'sedan',
      status: 'draft',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function attachListingToLead(leadId: string, listingId: string) {
  await supabase
    .from('vehicle_leads')
    .update({ listing_id: listingId, status: 'listed' })
    .eq('id', leadId);
}

export async function attachUserToLead(leadId: string, userId: string) {
  await supabase
    .from('vehicle_leads')
    .update({ user_id: userId, status: 'account_created' })
    .eq('id', leadId);
}

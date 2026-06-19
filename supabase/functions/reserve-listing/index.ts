// Reserve a listing for the authenticated buyer based on the seller's preferences.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  listing_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    const buyer = userData?.user;
    if (!buyer) {
      return new Response(JSON.stringify({ error: 'unauthenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: listing, error: lErr } = await admin
      .from('listings')
      .select('id, user_id, reserved_by, reserved_until')
      .eq('id', parsed.data.listing_id)
      .maybeSingle();
    if (lErr || !listing) {
      return new Response(JSON.stringify({ error: 'listing not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (listing.user_id === buyer.id) {
      return new Response(JSON.stringify({ skipped: 'own listing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Active reservation by someone else still blocks
    if (
      listing.reserved_by &&
      listing.reserved_by !== buyer.id &&
      listing.reserved_until &&
      new Date(listing.reserved_until).getTime() > Date.now()
    ) {
      return new Response(
        JSON.stringify({ reserved: true, reserved_by_other: true, until: listing.reserved_until }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Seller prefs
    const { data: prefs } = await admin
      .from('dealer_inventory_preferences')
      .select('reservation_enabled, reservation_minutes')
      .eq('user_id', listing.user_id)
      .maybeSingle();
    if (!prefs?.reservation_enabled) {
      return new Response(JSON.stringify({ reserved: false, reason: 'disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const until = new Date(Date.now() + prefs.reservation_minutes * 60_000).toISOString();
    const { error: uErr } = await admin
      .from('listings')
      .update({ reserved_by: buyer.id, reserved_until: until })
      .eq('id', listing.id);
    if (uErr) throw uErr;

    return new Response(
      JSON.stringify({ reserved: true, until, minutes: prefs.reservation_minutes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

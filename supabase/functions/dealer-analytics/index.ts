import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, jsonResponse, requireAuth, rateLimit } from "../_shared/ai-guard.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const id = await requireAuth(req);
    if (id instanceof Response) return id;
    if (!(await rateLimit(id, "dealer-analytics", 30, 60))) {
      return jsonResponse({ error: "Te veel verzoeken." }, 429);
    }
    const user = { id: id.userId! };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role to aggregate data across tables
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get user's listings (incl. fields used by AI price analysis on dashboard)
    const { data: listings, error: listingsError } = await adminClient
      .from("listings")
      .select("id, title, brand, model, year, mileage, fuel_type, transmission, power, features, equipment, price, status, views, images, created_at, is_premium, boost_until")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (listingsError) throw listingsError;
    if (!listings || listings.length === 0) {
      return new Response(JSON.stringify({
        overview: { totalViews: 0, totalFavorites: 0, totalMessages: 0, totalListings: 0, activeListings: 0 },
        listings: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const listingIds = listings.map((l) => l.id);

    // 2. Favorites count per listing
    const { data: favCounts } = await adminClient
      .from("favorites")
      .select("listing_id")
      .in("listing_id", listingIds);

    const favMap: Record<string, number> = {};
    (favCounts || []).forEach((f) => {
      favMap[f.listing_id] = (favMap[f.listing_id] || 0) + 1;
    });

    // 3. Conversations & messages count per listing
    const { data: conversations } = await adminClient
      .from("conversations")
      .select("id, listing_id")
      .in("listing_id", listingIds);

    const convMap: Record<string, number> = {};
    const convIds: string[] = [];
    (conversations || []).forEach((c) => {
      convMap[c.listing_id] = (convMap[c.listing_id] || 0) + 1;
      convIds.push(c.id);
    });

    let msgMap: Record<string, number> = {};
    if (convIds.length > 0) {
      const { data: messages } = await adminClient
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds);

      // Map conversation_id -> listing_id
      const convToListing: Record<string, string> = {};
      (conversations || []).forEach((c) => { convToListing[c.id] = c.listing_id; });

      (messages || []).forEach((m) => {
        const lid = convToListing[m.conversation_id];
        if (lid) msgMap[lid] = (msgMap[lid] || 0) + 1;
      });
    }

    // 4. Build per-listing analytics
    const listingAnalytics = listings.map((l: any) => ({
      id: l.id,
      title: l.title,
      brand: l.brand,
      model: l.model,
      year: l.year,
      mileage: l.mileage,
      fuelType: l.fuel_type,
      transmission: l.transmission,
      power: l.power,
      features: l.equipment ?? l.features ?? [],
      price: l.price,
      status: l.status,
      views: l.views,
      image: l.images?.[0] || null,
      createdAt: l.created_at,
      favorites: favMap[l.id] || 0,
      conversations: convMap[l.id] || 0,
      messages: msgMap[l.id] || 0,
      isPremium: l.is_premium || false,
      boostUntil: l.boost_until || null,
    }));

    const totalViews = listingAnalytics.reduce((s, l) => s + l.views, 0);
    const totalFavorites = listingAnalytics.reduce((s, l) => s + l.favorites, 0);
    const totalMessages = listingAnalytics.reduce((s, l) => s + l.messages, 0);
    const activeListings = listingAnalytics.filter((l) => l.status === "active").length;

    return new Response(JSON.stringify({
      overview: {
        totalViews,
        totalFavorites,
        totalMessages,
        totalListings: listings.length,
        activeListings,
      },
      listings: listingAnalytics,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("dealer-analytics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, jsonResponse, requireAuth, rateLimit } from "../_shared/ai-guard.ts";

const LISTING_FIELDS =
  "id, title, brand, model, year, mileage, fuel_type, transmission, power, features, equipment, price, status, views, images, created_at, is_premium, boost_until";

// ── Keyset helpers (mirror of src/lib/keyset.ts) ───────────────────────────
function decodeCursor(cursor: string | null): unknown[] | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(atob(cursor));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function encodeCursor(values: unknown[]): string {
  return btoa(JSON.stringify(values));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const id = await requireAuth(req);
    if (id instanceof Response) return id;
    if (!(await rateLimit(id, "dealer-analytics", 60, 60))) {
      return jsonResponse({ error: "Te veel verzoeken." }, 429);
    }
    const user = { id: id.userId! };

    // Optional cursor-based request body. When `limit` is omitted the function
    // keeps its legacy behaviour (all listings in one response).
    let body: {
      cursor?: string | null;
      limit?: number;
      query?: string;
      statuses?: string[];
      listingId?: string;
      days?: number;
    } = {};
    if (req.method === "POST") {
      try {
        body = (await req.json()) ?? {};
      } catch {
        body = {};
      }
    }
    const paginated = typeof body.limit === "number" && body.limit > 0;
    const limit = paginated ? Math.min(Math.max(body.limit!, 1), 100) : null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ── Per-voertuig drilldown ────────────────────────────────────────────
    if (typeof body.listingId === "string" && body.listingId) {
      return await listingDrilldown(adminClient, user.id, body.listingId, body.days ?? 30);
    }



    // 1a. Lightweight roll-up over the dealer's full inventory (counts stay
    // correct even when only one batch of rows is returned).
    const { data: allRows, error: rollupError } = await adminClient
      .from("listings")
      .select("id, status, views, boost_until")
      .eq("user_id", user.id);
    if (rollupError) throw rollupError;

    const allIds = (allRows ?? []).map((l: any) => l.id);
    const statusCounts: Record<string, number> = {};
    (allRows ?? []).forEach((l: any) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });
    const boostableCount = (allRows ?? []).filter(
      (l: any) =>
        l.status === "active" && (!l.boost_until || new Date(l.boost_until).getTime() <= Date.now()),
    ).length;

    // 1b. Page of listings (keyset on created_at + id, both descending).
    let listingsQuery = adminClient
      .from("listings")
      .select(LISTING_FIELDS)
      .eq("user_id", user.id);

    if (paginated) {
      if (body.statuses?.length) listingsQuery = listingsQuery.in("status", body.statuses);
      const term = body.query?.trim();
      if (term) {
        const safe = term.replace(/[,%()]/g, " ").slice(0, 80);
        listingsQuery = listingsQuery.or(
          `title.ilike.%${safe}%,brand.ilike.%${safe}%,model.ilike.%${safe}%`,
        );
      }
      const cursorValues = decodeCursor(body.cursor ?? null);
      if (cursorValues && cursorValues.length === 2) {
        const [createdAt, lastId] = cursorValues as [string, string];
        listingsQuery = listingsQuery.or(
          `created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${lastId}")`,
        );
      }
    }

    listingsQuery = listingsQuery
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (limit) listingsQuery = listingsQuery.limit(limit);

    const { data: listings, error: listingsError } = await listingsQuery;
    if (listingsError) throw listingsError;

    const rows = listings ?? [];

    if (rows.length === 0) {
      return jsonResponse({
        overview: {
          totalViews: (allRows ?? []).reduce((s: number, l: any) => s + (l.views ?? 0), 0),
          totalFavorites: 0,
          totalMessages: 0,
          totalListings: allIds.length,
          activeListings: statusCounts["active"] ?? 0,
        },
        statusCounts: { ...statusCounts, boostable: boostableCount },
        listings: [],
        nextCursor: null,
        total: allIds.length,
      });
    }

    const listingIds = rows.map((l: any) => l.id);

    // 2. Favorites per listing in this batch
    const { data: favCounts } = await adminClient
      .from("favorites")
      .select("listing_id")
      .in("listing_id", listingIds);

    const favMap: Record<string, number> = {};
    (favCounts || []).forEach((f: any) => {
      favMap[f.listing_id] = (favMap[f.listing_id] || 0) + 1;
    });

    // 3. Conversations & messages per listing in this batch
    const { data: conversations } = await adminClient
      .from("conversations")
      .select("id, listing_id")
      .in("listing_id", listingIds);

    const convMap: Record<string, number> = {};
    const convIds: string[] = [];
    (conversations || []).forEach((c: any) => {
      convMap[c.listing_id] = (convMap[c.listing_id] || 0) + 1;
      convIds.push(c.id);
    });

    const msgMap: Record<string, number> = {};
    if (convIds.length > 0) {
      const { data: messages } = await adminClient
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds);

      const convToListing: Record<string, string> = {};
      (conversations || []).forEach((c: any) => {
        convToListing[c.id] = c.listing_id;
      });
      (messages || []).forEach((m: any) => {
        const lid = convToListing[m.conversation_id];
        if (lid) msgMap[lid] = (msgMap[lid] || 0) + 1;
      });
    }

    // 4. Per-listing analytics for this batch
    const listingAnalytics = rows.map((l: any) => ({
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

    const lastRow = rows[rows.length - 1] as any;
    const nextCursor =
      limit && rows.length === limit ? encodeCursor([lastRow.created_at, lastRow.id]) : null;

    return jsonResponse({
      overview: {
        totalViews: (allRows ?? []).reduce((s: number, l: any) => s + (l.views ?? 0), 0),
        totalFavorites: listingAnalytics.reduce((s, l) => s + l.favorites, 0),
        totalMessages: listingAnalytics.reduce((s, l) => s + l.messages, 0),
        totalListings: allIds.length,
        activeListings: statusCounts["active"] ?? 0,
      },
      statusCounts: { ...statusCounts, boostable: boostableCount },
      listings: listingAnalytics,
      nextCursor,
      total: allIds.length,
    });
  } catch (e) {
    console.error("dealer-analytics error:", e);
    return jsonResponse({ error: "Kon analytics niet laden" }, 500);
  }
});

// ── Drilldown helpers ───────────────────────────────────────────────────────

function dayKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

/** Bouwt een reeks van `days` dagen (oud → nieuw) met nullen voor lege dagen. */
function buildSeries(
  days: number,
  buckets: Record<string, { views: number; favorites: number; conversations: number; messages: number }>,
) {
  const out: Array<{ date: string; views: number; favorites: number; conversations: number; messages: number; leads: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const b = buckets[key] ?? { views: 0, favorites: 0, conversations: 0, messages: 0 };
    out.push({ date: key, ...b, leads: b.favorites + b.conversations });
  }
  return out;
}

async function listingDrilldown(
  admin: ReturnType<typeof createClient>,
  userId: string,
  listingId: string,
  daysInput: number,
): Promise<Response> {
  const days = [7, 30, 90].includes(daysInput) ? daysInput : 30;

  const { data: listing } = await admin
    .from("listings")
    .select(
      "id, title, brand, model, year, mileage, fuel_type, price, status, views, images, created_at, is_premium, boost_until, user_id, company_id",
    )
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return jsonResponse({ error: "Advertentie niet gevonden" }, 404);

  // Toegang: eigenaar, of een actief lid van hetzelfde bedrijf.
  let allowed = listing.user_id === userId;
  if (!allowed && listing.company_id) {
    const { data: member } = await admin
      .from("company_members")
      .select("id")
      .eq("user_id", userId)
      .eq("company_id", listing.company_id)
      .eq("status", "active")
      .maybeSingle();
    allowed = !!member;
  }
  if (!allowed) return jsonResponse({ error: "Geen toegang tot dit voertuig" }, 403);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const sinceIso = since.toISOString();
  const sinceDay = sinceIso.slice(0, 10);

  const [viewsRes, favRes, convRes] = await Promise.all([
    admin.from("listing_view_events").select("day").eq("listing_id", listingId).gte("day", sinceDay),
    admin.from("favorites").select("created_at").eq("listing_id", listingId).gte("created_at", sinceIso),
    admin.from("conversations").select("id, created_at").eq("listing_id", listingId),
  ]);

  const buckets: Record<string, { views: number; favorites: number; conversations: number; messages: number }> = {};
  const bump = (key: string, field: "views" | "favorites" | "conversations" | "messages") => {
    buckets[key] ??= { views: 0, favorites: 0, conversations: 0, messages: 0 };
    buckets[key][field] += 1;
  };

  (viewsRes.data ?? []).forEach((r: any) => bump(dayKey(r.day), "views"));
  (favRes.data ?? []).forEach((r: any) => bump(dayKey(r.created_at), "favorites"));
  (convRes.data ?? [])
    .filter((c: any) => c.created_at >= sinceIso)
    .forEach((c: any) => bump(dayKey(c.created_at), "conversations"));

  const convIds = (convRes.data ?? []).map((c: any) => c.id);
  let messagesInPeriod = 0;
  let totalMessages = 0;
  if (convIds.length > 0) {
    const { data: messages } = await admin
      .from("messages")
      .select("created_at")
      .in("conversation_id", convIds);
    (messages ?? []).forEach((m: any) => {
      totalMessages += 1;
      if (m.created_at >= sinceIso) {
        messagesInPeriod += 1;
        bump(dayKey(m.created_at), "messages");
      }
    });
  }

  const series = buildSeries(days, buckets);

  // Totalen over de volledige looptijd (niet enkel de periode).
  const [{ count: totalViews }, { count: totalFavorites }] = await Promise.all([
    admin.from("listing_view_events").select("id", { count: "exact", head: true }).eq("listing_id", listingId),
    admin.from("favorites").select("id", { count: "exact", head: true }).eq("listing_id", listingId),
  ]);

  // Vergelijking met eigen voorraad in hetzelfde prijssegment (±25%).
  const ownerFilter = listing.company_id
    ? { column: "company_id", value: listing.company_id }
    : { column: "user_id", value: listing.user_id };
  const { data: peers } = await admin
    .from("listings")
    .select("id, views, created_at")
    .eq(ownerFilter.column, ownerFilter.value)
    .gte("price", Math.round(listing.price * 0.75))
    .lte("price", Math.round(listing.price * 1.25))
    .neq("id", listingId);

  const peerRows = peers ?? [];
  const nowMs = Date.now();
  const daysLive = Math.max(1, Math.round((nowMs - new Date(listing.created_at).getTime()) / 86400000));
  const peerAvgViewsPerDay =
    peerRows.length > 0
      ? peerRows.reduce((s: number, p: any) => {
          const d = Math.max(1, (nowMs - new Date(p.created_at).getTime()) / 86400000);
          return s + (p.views ?? 0) / d;
        }, 0) / peerRows.length
      : null;
  const ownViewsPerDay = (totalViews ?? 0) / daysLive;

  return jsonResponse({
    listing: {
      id: listing.id,
      title: listing.title,
      brand: listing.brand,
      model: listing.model,
      year: listing.year,
      mileage: listing.mileage,
      fuelType: listing.fuel_type,
      price: listing.price,
      status: listing.status,
      image: listing.images?.[0] ?? null,
      createdAt: listing.created_at,
      isPremium: listing.is_premium ?? false,
      boostUntil: listing.boost_until ?? null,
      daysLive,
    },
    totals: {
      views: totalViews ?? 0,
      favorites: totalFavorites ?? 0,
      conversations: convIds.length,
      messages: totalMessages,
    },
    period: {
      days,
      views: series.reduce((s, d) => s + d.views, 0),
      favorites: series.reduce((s, d) => s + d.favorites, 0),
      conversations: series.reduce((s, d) => s + d.conversations, 0),
      messages: messagesInPeriod,
    },
    series,
    benchmark: {
      peerCount: peerRows.length,
      ownViewsPerDay,
      peerAvgViewsPerDay,
    },
  });
}

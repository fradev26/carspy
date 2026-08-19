// Publieke view-tracker: registreert maximaal één weergave per bezoeker,
// per advertentie, per dag. Inserts gebeuren met de service role zodat
// bezoekers de tabel nooit rechtstreeks kunnen schrijven.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, jsonResponse, identify, rateLimit, originGuard } from "../_shared/ai-guard.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCES = new Set(["detail", "search", "dealer", "other"]);

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const blocked = originGuard(req);
  if (blocked) return blocked;

  try {
    const body = await req.json().catch(() => ({}));
    const listingId = typeof body?.listingId === "string" ? body.listingId : "";
    const source = SOURCES.has(body?.source) ? body.source : "detail";
    const clientSession = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 100) : "";

    if (!UUID_RE.test(listingId)) {
      return jsonResponse({ error: "Ongeldige advertentie" }, 400);
    }

    const identity = await identify(req);
    // Ruime bovengrens tegen scripted spam; normale bezoekers halen dit nooit.
    if (!(await rateLimit(identity, "track-listing-view", 120, 60))) {
      return jsonResponse({ ok: false, reason: "rate_limited" }, 429);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Geanonimiseerde sessiesleutel: nooit het ruwe IP of sessie-ID opslaan.
    const sessionHash = await sha256(
      `${identity.userId ?? ""}|${clientSession}|${identity.ip}|${listingId}`,
    );
    const day = new Date().toISOString().slice(0, 10);

    // Eigen weergaven van de eigenaar tellen niet mee.
    const { data: listing } = await admin
      .from("listings")
      .select("id, user_id")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing) return jsonResponse({ error: "Advertentie niet gevonden" }, 404);
    if (identity.userId && identity.userId === listing.user_id) {
      return jsonResponse({ ok: true, counted: false, reason: "owner" });
    }

    const { error: insertError } = await admin
      .from("listing_view_events")
      .insert({ listing_id: listingId, day, session_hash: sessionHash, source });

    if (insertError) {
      // 23505 = al geteld vandaag voor deze bezoeker.
      if ((insertError as { code?: string }).code === "23505") {
        return jsonResponse({ ok: true, counted: false, reason: "duplicate" });
      }
      throw insertError;
    }

    // Houd de teller op listings in sync met de events.
    const { count } = await admin
      .from("listing_view_events")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId);
    await admin.from("listings").update({ views: count ?? 0 }).eq("id", listingId);

    return jsonResponse({ ok: true, counted: true });
  } catch (e) {
    console.error("track-listing-view error:", e);
    return jsonResponse({ error: "Kon weergave niet registreren" }, 500);
  }
});

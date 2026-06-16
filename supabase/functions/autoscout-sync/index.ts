// Deploy as: supabase/functions/autoscout-sync/index.ts on VATUUR project.
// Calls the AutoScout24 Listing Creation API and syncs vehicles into the
// internal `listings` table.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const AS24_BASE = "https://listing-creation.api.autoscout24.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function basicAuth(username: string, password: string) {
  return "Basic " + btoa(`${username}:${password}`);
}

// ---------- AutoScout24 client ----------
async function as24Fetch(
  path: string,
  creds: { username: string; password: string },
): Promise<unknown> {
  const r = await fetch(`${AS24_BASE}${path}`, {
    headers: {
      Authorization: basicAuth(creds.username, creds.password),
      Accept: "application/json",
    },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`AutoScout24 ${r.status}: ${text.slice(0, 300)}`);
  }
  return r.json();
}

async function fetchAllListings(customerId: string, creds: { username: string; password: string }) {
  // The API supports paging via ?page & ?size. We loop until an empty page.
  const out: any[] = [];
  let page = 0;
  const size = 100;
  while (true) {
    const res: any = await as24Fetch(
      `/customers/${encodeURIComponent(customerId)}/listings?page=${page}&size=${size}`,
      creds,
    );
    const items: any[] = Array.isArray(res) ? res : (res.content ?? res.items ?? res.listings ?? []);
    out.push(...items);
    if (!items.length || items.length < size) break;
    page++;
    if (page > 50) break; // safety cap = 5000 listings
  }
  return out;
}

// ---------- Mapping: zie ./mapping.ts (geïnlined voor Deno) ----------
// Bij wijzigingen: synchroniseer met src/lib/autoscout/mapping.ts
import { mapAs24ToListing } from "./mapping.ts";

function mapListing(raw: any, dealerUserId: string) {
  const { scalars, specs, raw: r } = mapAs24ToListing(raw, dealerUserId);
  const internal = { ...scalars, specs, raw_autoscout: r };
  const images = (scalars.images as string[]) ?? [];
  const hashSrc = JSON.stringify({ ...scalars, images: images.slice().sort() });
  return { internal, hashSrc };
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Sync core ----------
type SvcClient = ReturnType<typeof createClient>;

async function resolvePassword(svc: SvcClient, secretId: string | null | undefined): Promise<string> {
  if (!secretId) throw new Error("Geen wachtwoord opgeslagen voor deze dealer.");
  const { data, error } = await svc.rpc("autoscout_get_password", { _secret_id: secretId });
  if (error) throw new Error(`Wachtwoord ophalen mislukt: ${error.message}`);
  if (!data) throw new Error("Wachtwoord-secret niet gevonden in Vault.");
  return data as string;
}

async function syncDealer(svc: SvcClient, dealerUserId: string, trigger: "manual" | "cron") {
  const { data: cred, error: credErr } = await svc
    .from("autoscout_credentials")
    .select("customer_id, username, password_secret_id")
    .eq("user_id", dealerUserId)
    .maybeSingle();
  if (credErr) throw new Error(credErr.message);
  if (!cred) throw new Error("Geen AutoScout24 credentials voor deze dealer.");

  const password = await resolvePassword(svc, cred.password_secret_id as string | null);

  const { data: runRow, error: runErr } = await svc
    .from("autoscout_sync_runs")
    .insert({ user_id: dealerUserId, trigger, status: "running" })
    .select("id")
    .single();
  if (runErr) throw new Error(runErr.message);
  const runId = runRow.id as string;

  const totals = { total: 0, new: 0, changed: 0, unchanged: 0, errors: 0 };
  try {
    const listings = await fetchAllListings(cred.customer_id as string, {
      username: cred.username as string,
      password,
    });
    totals.total = listings.length;

    for (const raw of listings) {
      const asId = String(raw.id ?? raw.listingId ?? raw.uuid ?? "");
      if (!asId) { totals.errors++; continue; }
      try {
        // Detail-fetch voor de volledige payload (lijst geeft vaak afgekorte versie).
        let detail: any = raw;
        try {
          detail = await as24Fetch(
            `/customers/${encodeURIComponent(cred.customer_id as string)}/listings/${encodeURIComponent(asId)}`,
            { username: cred.username as string, password },
          );
        } catch (_) {
          // Fall back to list-row data when detail-fetch fails.
        }
        const { internal, hashSrc } = mapListing(detail, dealerUserId);
        const hash = await sha256(hashSrc);

        const { data: mirror } = await svc
          .from("autoscout_listings")
          .select("id, internal_listing_id, content_hash")
          .eq("user_id", dealerUserId)
          .eq("autoscout_listing_id", asId)
          .maybeSingle();

        let internalId = mirror?.internal_listing_id as string | null | undefined;
        let changed = false;
        let isNew = false;

        if (!internalId) {
          // Create as draft.
          isNew = true;
          const { data: created, error: insErr } = await svc
            .from("listings")
            .insert({ ...internal, status: "draft" })
            .select("id")
            .single();
          if (insErr) throw new Error(insErr.message);
          internalId = created.id as string;
        } else if (mirror!.content_hash !== hash) {
          changed = true;
          const { error: updErr } = await svc
            .from("listings")
            .update(internal) // keep status as-is
            .eq("id", internalId);
          if (updErr) throw new Error(updErr.message);
        }

        const syncStatus = isNew ? "new" : changed ? "changed" : "imported";
        await svc.from("autoscout_listings").upsert(
          {
            user_id: dealerUserId,
            autoscout_listing_id: asId,
            internal_listing_id: internalId!,
            content_hash: hash,
            raw_data: detail,
            publication_status: (detail?.publication?.status ?? detail?.publicationStatus ?? detail?.status ?? null) as string | null,
            sync_status: syncStatus,
            sync_error: null,
            last_seen_at: new Date().toISOString(),
            ...(isNew || changed ? { last_changed_at: new Date().toISOString() } : {}),
          },
          { onConflict: "user_id,autoscout_listing_id" },
        );

        if (isNew) totals.new++;
        else if (changed) totals.changed++;
        else totals.unchanged++;
      } catch (e: any) {
        totals.errors++;
        await svc.from("autoscout_listings").upsert(
          {
            user_id: dealerUserId,
            autoscout_listing_id: asId,
            content_hash: "",
            raw_data: raw,
            sync_status: "error",
            sync_error: String(e?.message ?? e).slice(0, 500),
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "user_id,autoscout_listing_id" },
        );
      }
    }

    await svc
      .from("autoscout_sync_runs")
      .update({ status: "success", totals, finished_at: new Date().toISOString() })
      .eq("id", runId);
    await svc
      .from("autoscout_credentials")
      .update({ last_sync_at: new Date().toISOString(), last_sync_status: "success", last_sync_error: null })
      .eq("user_id", dealerUserId);

    return totals;
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    await svc
      .from("autoscout_sync_runs")
      .update({ status: "error", totals, error_message: msg, finished_at: new Date().toISOString() })
      .eq("id", runId);
    await svc
      .from("autoscout_credentials")
      .update({ last_sync_at: new Date().toISOString(), last_sync_status: "error", last_sync_error: msg })
      .eq("user_id", dealerUserId);
    throw e;
  }
}

// ---------- Auth helpers ----------
async function getCaller(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { kind: "none" as const };
  if (token === SERVICE_ROLE) return { kind: "service" as const };
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return { kind: "none" as const };
  // Check role
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roles } = await svc.from("user_roles").select("role").eq("user_id", data.user.id);
  const r = (roles ?? []).map((x: any) => x.role);
  const isAdmin = r.includes("admin");
  const isStockManager = r.includes("stock_manager");
  if (!isAdmin && !isStockManager) return { kind: "none" as const };
  return { kind: "user" as const, userId: data.user.id, isAdmin };
}

// ---------- HTTP entry ----------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const action = String(body?.action ?? "");
  const caller = await getCaller(req);
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    switch (action) {
      case "save_credentials": {
        if (caller.kind !== "user") return json({ error: "Unauthorized" }, 401);
        const { dealer_user_id, customer_id, username, password } = body;
        if (!dealer_user_id || !customer_id || !username) return json({ error: "Verplichte velden ontbreken" }, 400);

        // Find existing credentials to know whether a password is mandatory.
        const { data: existing } = await svc
          .from("autoscout_credentials")
          .select("password_secret_id")
          .eq("user_id", dealer_user_id)
          .maybeSingle();

        let secretId: string | null = (existing?.password_secret_id as string | null) ?? null;

        if (password) {
          const { data: savedId, error: vErr } = await svc.rpc("autoscout_save_password", {
            _user_id: dealer_user_id,
            _password: String(password),
          });
          if (vErr) return json({ error: `Vault opslaan mislukt: ${vErr.message}` }, 500);
          secretId = savedId as string;
        }

        if (!secretId) return json({ error: "Wachtwoord verplicht bij eerste registratie" }, 400);

        const { error } = await svc.from("autoscout_credentials").upsert(
          {
            user_id: dealer_user_id,
            customer_id: String(customer_id).trim(),
            username: String(username).trim(),
            password_secret_id: secretId,
          },
          { onConflict: "user_id" },
        );
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "test_connection": {
        if (caller.kind !== "user") return json({ error: "Unauthorized" }, 401);
        const { dealer_user_id } = body;
        const { data: cred } = await svc
          .from("autoscout_credentials")
          .select("customer_id, username, password_secret_id")
          .eq("user_id", dealer_user_id)
          .maybeSingle();
        if (!cred) return json({ error: "Geen credentials gevonden" }, 404);
        try {
          const password = await resolvePassword(svc, cred.password_secret_id as string | null);
          await as24Fetch(`/customers/${encodeURIComponent(cred.customer_id as string)}`, {
            username: cred.username as string,
            password,
          });
          return json({ ok: true });
        } catch (e: any) {
          return json({ ok: false, error: String(e?.message ?? e) }, 200);
        }
      }

      case "sync": {
        if (caller.kind !== "user") return json({ error: "Unauthorized" }, 401);
        const { dealer_user_id, trigger } = body;
        const totals = await syncDealer(svc, dealer_user_id, trigger === "cron" ? "cron" : "manual");
        return json({ ok: true, totals });
      }

      case "publish": {
        if (caller.kind !== "user") return json({ error: "Unauthorized" }, 401);
        const { internal_listing_id } = body;
        if (!internal_listing_id) return json({ error: "internal_listing_id verplicht" }, 400);
        const { error } = await svc.from("listings").update({ status: "active" }).eq("id", internal_listing_id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "cron_sync_all": {
        if (caller.kind !== "service") return json({ error: "Unauthorized" }, 401);
        const { data: creds } = await svc.from("autoscout_credentials").select("user_id");
        const results: any[] = [];
        for (const c of creds ?? []) {
          try {
            const totals = await syncDealer(svc, c.user_id as string, "cron");
            results.push({ user_id: c.user_id, ok: true, totals });
          } catch (e: any) {
            results.push({ user_id: c.user_id, ok: false, error: String(e?.message ?? e) });
          }
        }
        return json({ ok: true, results });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
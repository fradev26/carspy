// Deploy op het VATUUR-project als: supabase/functions/admin-bulk-import/index.ts
// Vereist secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (auto-aanwezig in Lovable Cloud).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FUEL = new Set(["benzine", "diesel", "elektrisch", "hybride", "plug-in hybride", "lpg"]);
const TRANS = new Set(["handgeschakeld", "automaat", "semi-automaat"]);
const BODY = new Set(["sedan", "hatchback", "stationwagon", "suv", "cabrio", "coupe", "mpv", "bestelwagen"]);
const PROVINCES = new Set([
  "Antwerpen", "Oost-Vlaanderen", "West-Vlaanderen", "Vlaams-Brabant",
  "Limburg", "Henegouwen", "Luik", "Luxemburg", "Namen", "Waals-Brabant", "Brussel",
]);

type RawRow = Record<string, string>;
type RowResult = { row_number: number; status: "success" | "failed" | "skipped"; error?: string; listing_id?: string };

function bool(v: unknown): boolean {
  return /^(true|1|ja|yes)$/i.test(String(v ?? "").trim());
}

function intInRange(v: string, min: number, max: number): number | null {
  const n = Number(String(v).replace(/[^\d-]/g, ""));
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

function validateAndMap(raw: RawRow): { error?: string; out?: Record<string, unknown>; owner: { email: string; full_name?: string; is_dealer?: boolean; dealer_name?: string } } {
  const owner = {
    email: String(raw.owner_email ?? "").trim().toLowerCase(),
    full_name: raw.owner_full_name ? String(raw.owner_full_name).trim() : undefined,
    is_dealer: raw.owner_is_dealer !== undefined && raw.owner_is_dealer !== "" ? bool(raw.owner_is_dealer) : undefined,
    dealer_name: raw.owner_dealer_name ? String(raw.owner_dealer_name).trim() : undefined,
  };

  const required = ["owner_email", "title", "brand", "model", "year", "price", "mileage", "fuel_type", "transmission"];
  for (const c of required) {
    if (!raw[c] || !String(raw[c]).trim()) return { error: `${c} is verplicht`, owner };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)) return { error: "ongeldig e-mailadres", owner };

  const out: Record<string, unknown> = {};
  const title = String(raw.title).trim();
  if (title.length < 3 || title.length > 140) return { error: "title moet 3–140 tekens zijn", owner };
  out.title = title;

  out.brand = String(raw.brand).trim();
  out.model = String(raw.model).trim().slice(0, 60);

  const year = intInRange(raw.year, 1950, new Date().getFullYear() + 1);
  if (year === null) return { error: "year ongeldig", owner };
  out.year = year;

  const price = intInRange(raw.price, 0, 10_000_000);
  if (price === null) return { error: "price ongeldig", owner };
  out.price = price;

  const mileage = intInRange(raw.mileage, 0, 2_000_000);
  if (mileage === null) return { error: "mileage ongeldig", owner };
  out.mileage = mileage;

  const fuel = String(raw.fuel_type).trim().toLowerCase();
  if (!FUEL.has(fuel)) return { error: `fuel_type "${fuel}" ongeldig`, owner };
  out.fuel_type = fuel;

  const trans = String(raw.transmission).trim().toLowerCase();
  if (!TRANS.has(trans)) return { error: `transmission "${trans}" ongeldig`, owner };
  out.transmission = trans;

  if (raw.body_type) {
    const b = String(raw.body_type).trim().toLowerCase();
    if (!BODY.has(b)) return { error: `body_type "${b}" ongeldig`, owner };
    out.body_type = b;
  }
  if (raw.color) out.color = String(raw.color).trim().slice(0, 40);
  if (raw.power) {
    const p = intInRange(raw.power, 0, 2000);
    if (p === null) return { error: "power ongeldig", owner };
    out.power = p;
  }
  if (raw.description) {
    if (String(raw.description).length > 4000) return { error: "description te lang", owner };
    out.description = String(raw.description);
  }
  if (raw.city) out.city = String(raw.city).trim().slice(0, 80);
  if (raw.province) {
    if (!PROVINCES.has(raw.province.trim())) return { error: `province "${raw.province}" ongeldig`, owner };
    out.province = raw.province.trim();
  }
  if (raw.images) {
    const urls = String(raw.images).split("|").map((s) => s.trim()).filter(Boolean);
    if (urls.length > 15) return { error: "max 15 afbeeldingen", owner };
    for (const u of urls) {
      if (!/^https:\/\/.+/i.test(u) || u.length > 500) return { error: `image url ongeldig: ${u}`, owner };
    }
    out.images = urls;
  }
  if (raw.status) {
    const s = String(raw.status).trim().toLowerCase();
    if (!["draft", "active"].includes(s)) return { error: 'status moet "draft" of "active" zijn', owner };
    out.status = s;
  } else {
    out.status = "draft";
  }
  if (raw.is_premium !== undefined && raw.is_premium !== "") out.is_premium = bool(raw.is_premium);
  if (raw.external_ref) out.external_ref = String(raw.external_ref).trim().slice(0, 120);

  return { out, owner };
}

async function checkImageUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return `HTTP ${res.status}`;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return `content-type ${ct}`;
    const len = Number(res.headers.get("content-length") ?? "0");
    if (len && len > 8 * 1024 * 1024) return "te groot (>8MB)";
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: CORS });

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: CORS });
  }

  // Verify admin
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: CORS });
  }
  const [{ data: isAdmin }, { data: isStockManager }] = await Promise.all([
    userClient.rpc("has_role", { _user_id: userData.user.id, _role: "admin" }),
    userClient.rpc("has_role", { _user_id: userData.user.id, _role: "stock_manager" }),
  ]);
  if (!isAdmin && !isStockManager) {
    return Response.json({ error: "forbidden" }, { status: 403, headers: CORS });
  }

  const adminId = userData.user.id;
  // Stock_managers automatically stamp onboarded_by on every imported listing.
  const onboardedBy: string | null = isStockManager && !isAdmin ? adminId : (isStockManager ? adminId : null);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  let body: { rows?: RawRow[]; mode?: "insert" | "upsert"; dry_run?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400, headers: CORS });
  }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const mode = body.mode === "upsert" ? "upsert" : "insert";
  const dryRun = !!body.dry_run;
  if (rows.length === 0) return Response.json({ error: "no rows" }, { status: 400, headers: CORS });
  if (rows.length > 2000) return Response.json({ error: "max 2000 rows" }, { status: 400, headers: CORS });

  // Create job
  const { data: jobRow, error: jobErr } = await admin
    .from("import_jobs")
    .insert({ created_by: adminId, source: "csv", status: "running", total: rows.length })
    .select("id")
    .single();
  if (jobErr || !jobRow) {
    return Response.json({ error: `job create failed: ${jobErr?.message}` }, { status: 500, headers: CORS });
  }
  const jobId = jobRow.id as string;

  // Cache profiles by email
  const emailToUserId = new Map<string, string>();
  const results: RowResult[] = [];
  const BATCH = 50;

  for (let start = 0; start < rows.length; start += BATCH) {
    const slice = rows.slice(start, start + BATCH);
    await Promise.all(
      slice.map(async (raw, j) => {
        const rowNumber = start + j + 1;
        const { error: vErr, out, owner } = validateAndMap(raw);
        if (vErr || !out) {
          results.push({ row_number: rowNumber, status: "failed", error: vErr });
          return;
        }

        // Owner resolve
        let userId = emailToUserId.get(owner.email);
        if (!userId) {
          const { data: prof } = await admin
            .from("profiles")
            .select("id")
            .eq("email", owner.email)
            .maybeSingle();
          if (prof?.id) userId = prof.id as string;
        }
        if (!userId) {
          // Invite
          if (dryRun) {
            // mark would-invite as success in dry-run
            results.push({ row_number: rowNumber, status: "success" });
            return;
          }
          const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(
            owner.email,
            { data: owner.full_name ? { full_name: owner.full_name } : {} },
          );
          if (invErr || !inv?.user) {
            results.push({ row_number: rowNumber, status: "failed", error: `invite mislukt: ${invErr?.message}` });
            return;
          }
          userId = inv.user.id;
          // Patch profile
          const patch: Record<string, unknown> = {};
          if (owner.full_name) patch.full_name = owner.full_name;
          if (owner.is_dealer !== undefined) patch.is_dealer = owner.is_dealer;
          if (owner.dealer_name) patch.dealer_name = owner.dealer_name;
          if (Object.keys(patch).length > 0) {
            await admin.from("profiles").update(patch).eq("id", userId);
          }
          await admin.from("admin_actions").insert({
            admin_id: adminId,
            action: "user.invited",
            target_type: "user",
            target_id: userId,
            details: { via: "bulk_import", job_id: jobId, email: owner.email },
          });
        }
        emailToUserId.set(owner.email, userId);

        // Validate images (only if not dry-run; saves bandwidth)
        if (Array.isArray(out.images) && (out.images as string[]).length > 0) {
          const bad: string[] = [];
          for (const u of out.images as string[]) {
            const err = await checkImageUrl(u);
            if (err) bad.push(`${u} (${err})`);
          }
          if (bad.length > 0) {
            results.push({ row_number: rowNumber, status: "failed", error: `image urls: ${bad.join("; ")}` });
            return;
          }
        }

        if (dryRun) {
          results.push({ row_number: rowNumber, status: "success" });
          return;
        }

        const record = { ...out, user_id: userId };
        // external_ref is not a real column on listings — strip before insert
        const extRef = (record as Record<string, unknown>).external_ref as string | undefined;
        delete (record as Record<string, unknown>).external_ref;

        let listingId: string | undefined;
        if (mode === "upsert" && extRef) {
          // Match on user_id + (title equals "EXT:" marker)? We have no column, so emulate:
          // We use description-prefixed marker is fragile. Simpler: skip upsert when no real key.
          // To keep correctness: use external_ref stored in description JSON-marker is too implicit.
          // For this version we fall back to insert if no existing matching listing is found by title+user.
          const { data: existing } = await admin
            .from("listings")
            .select("id")
            .eq("user_id", userId)
            .eq("title", record.title as string)
            .limit(1)
            .maybeSingle();
          if (existing?.id) {
            const { error: upErr } = await admin.from("listings").update(record).eq("id", existing.id);
            if (upErr) {
              results.push({ row_number: rowNumber, status: "failed", error: `update: ${upErr.message}` });
              return;
            }
            listingId = existing.id as string;
          }
        }
        if (!listingId) {
          const record2 = onboardedBy ? { ...record, onboarded_by: onboardedBy } : record;
          const { data: ins, error: insErr } = await admin
            .from("listings")
            .insert(record2)
            .select("id")
            .single();
          if (insErr || !ins) {
            results.push({ row_number: rowNumber, status: "failed", error: `insert: ${insErr?.message}` });
            return;
          }
          listingId = ins.id as string;
        }
        results.push({ row_number: rowNumber, status: "success", listing_id: listingId });
      }),
    );
  }

  // Persist per-row results
  const rowsToInsert = results.map((r) => ({
    job_id: jobId,
    row_number: r.row_number,
    status: r.status,
    listing_id: r.listing_id ?? null,
    user_id: emailToUserId.get(String(rows[r.row_number - 1]?.owner_email ?? "").toLowerCase()) ?? null,
    error: r.error ?? null,
    raw: rows[r.row_number - 1] ?? {},
  }));
  // Chunk insert (avoid >1000 rows per call)
  for (let i = 0; i < rowsToInsert.length; i += 500) {
    await admin.from("import_job_rows").insert(rowsToInsert.slice(i, i + 500));
  }

  const succeeded = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "failed").length;
  await admin
    .from("import_jobs")
    .update({ status: failed === results.length ? "failed" : "done", succeeded, failed })
    .eq("id", jobId);
  await admin.from("admin_actions").insert({
    admin_id: adminId,
    action: "bulk_import.completed",
    target_type: "import_job",
    target_id: jobId,
    details: { total: results.length, succeeded, failed, mode, dry_run: dryRun },
  });

  results.sort((a, b) => a.row_number - b.row_number);
  return Response.json(
    { job_id: jobId, total: results.length, succeeded, failed, rows: results },
    { headers: CORS },
  );
});
// Shared guard utilities for AI edge functions.
// Provides: CORS, auth identification, IP-aware rate limiting, JSON validation.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.23.8";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export interface Identity {
  userId: string | null;
  ip: string;
  key: string; // "u:<uuid>" or "ip:<addr>"
  isAuth: boolean;
}

export async function identify(req: Request): Promise<Identity> {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const auth = req.headers.get("Authorization");
  let userId: string | null = null;
  if (auth?.startsWith("Bearer ")) {
    try {
      const { data } = await adminClient().auth.getUser(auth.slice(7));
      userId = data.user?.id ?? null;
    } catch { /* ignore */ }
  }
  return {
    userId,
    ip,
    key: userId ? `u:${userId}` : `ip:${ip}`,
    isAuth: !!userId,
  };
}

export async function requireAuth(req: Request): Promise<Identity | Response> {
  const id = await identify(req);
  if (!id.userId) return jsonResponse({ error: "Niet ingelogd" }, 401);
  return id;
}

/**
 * Sliding-window rate limit. Limits per (identity, endpoint).
 * Returns true when allowed; false when exceeded.
 */
export async function rateLimit(
  identity: Identity,
  endpoint: string,
  max: number,
  windowSeconds = 60,
): Promise<boolean> {
  try {
    const admin = adminClient();
    const windowMs = windowSeconds * 1000;
    const windowStart = new Date(
      Math.floor(Date.now() / windowMs) * windowMs,
    ).toISOString();

    const { data: existing } = await admin
      .from("rate_limits")
      .select("id, request_count")
      .eq("key", identity.key)
      .eq("endpoint", endpoint)
      .eq("window_start", windowStart)
      .maybeSingle();

    if (existing) {
      if (existing.request_count >= max) return false;
      await admin
        .from("rate_limits")
        .update({ request_count: existing.request_count + 1 })
        .eq("id", existing.id);
    } else {
      await admin.from("rate_limits").insert({
        key: identity.key,
        endpoint,
        window_start: windowStart,
        request_count: 1,
      });
    }
    return true;
  } catch (e) {
    console.error("rateLimit error:", e);
    return true; // fail-open on storage error to avoid breaking UX
  }
}

export async function parseJson<T>(
  req: Request,
  schema: z.ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: jsonResponse({ error: "Ongeldige JSON" }, 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonResponse(
        { error: "Validatie mislukt", details: parsed.error.flatten() },
        400,
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

export { z };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, rateLimit, parseJson, z, type Identity } from "../_shared/ai-guard.ts";
import { buildInternalDealerLead } from "./leadPayload.ts";

const InputSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(50).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  vat_number: z.string().trim().max(50).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
}).strict();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("dealer-lead missing backend configuration");
      return jsonResponse({ error: "Dienst tijdelijk niet beschikbaar." }, 503);
    }

    const authorization = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authorization) {
      if (!authorization.startsWith("Bearer ")) {
        return jsonResponse({ error: "Ongeldige autorisatie" }, 401);
      }
      const admin = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await admin.auth.getUser(authorization.slice(7));
      if (error || !data.user) {
        return jsonResponse({ error: "Ongeldige autorisatie" }, 401);
      }
      userId = data.user.id;
    }

    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = req.headers.get("cf-connecting-ip") ?? forwardedFor ?? req.headers.get("x-real-ip") ?? "unknown";
    const id: Identity = {
      userId,
      ip,
      key: userId ? `u:${userId}` : `ip:${ip}`,
      isAuth: userId !== null,
    };
    if (!(await rateLimit(id, "dealer-lead", 5, 60))) {
      return jsonResponse({ error: "Te veel aanvragen, probeer het later opnieuw." }, 429);
    }
    const v = await parseJson(req, InputSchema);
    if (!v.ok) return v.response;

    // Use the requester's validated JWT for the database mutation. This lets
    // auth.uid() in the ownership trigger reflect the real requester.
    const supabase = createClient(supabaseUrl, anonKey, authorization
      ? { global: { headers: { Authorization: authorization } } }
      : undefined);

    const { data, error } = await supabase
      .from("dealer_leads")
      .insert(buildInternalDealerLead(v.data))
      .select("id")
      .single();

    if (error) {
      console.error("dealer-lead insert error:", error);
      return jsonResponse({ error: "Kon lead niet opslaan." }, 500);
    }

    return jsonResponse({ ok: true, id: data.id });
  } catch (e) {
    console.error("dealer-lead error:", e);
    // Never leak internal error details to unauthenticated callers.
    return jsonResponse({ error: "Onbekende fout" }, 500);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, identify, rateLimit, parseJson, z } from "../_shared/ai-guard.ts";

const InputSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(50).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  vat_number: z.string().trim().max(50).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  source: z.string().max(100).optional().default("dealers_page_ai"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const id = await identify(req);
    if (!(await rateLimit(id, "dealer-lead", 5, 60))) {
      return jsonResponse({ error: "Te veel aanvragen, probeer het later opnieuw." }, 429);
    }
    const v = await parseJson(req, InputSchema);
    if (!v.ok) return v.response;
    const { name, email, phone, company, vat_number, message, source } = v.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("dealer_leads")
      .insert({
        name,
        email,
        phone: phone ?? null,
        company: company ?? null,
        vat_number: vat_number ?? null,
        message: message ?? null,
        source,
        user_id: id.userId,
      })
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

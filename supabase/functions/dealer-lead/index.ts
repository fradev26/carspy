import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 200);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
    const phone = body.phone ? String(body.phone).trim().slice(0, 50) : null;
    const company = body.company ? String(body.company).trim().slice(0, 200) : null;
    const vat_number = body.vat_number ? String(body.vat_number).trim().slice(0, 50) : null;
    const message = body.message ? String(body.message).trim().slice(0, 2000) : null;
    const source = body.source ? String(body.source).slice(0, 100) : "dealers_page_ai";

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ error: "Naam is verplicht." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: "Ongeldig e-mailadres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Best-effort: associate with logged-in user if Authorization is a user JWT
    let user_id: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const { data } = await supabase.auth.getUser(token);
        user_id = data.user?.id ?? null;
      } catch { /* ignore */ }
    }

    const { data, error } = await supabase
      .from("dealer_leads")
      .insert({ name, email, phone, company, vat_number, message, source, user_id })
      .select("id")
      .single();

    if (error) {
      console.error("dealer-lead insert error:", error);
      return new Response(JSON.stringify({ error: "Kon lead niet opslaan." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dealer-lead error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

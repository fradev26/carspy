import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { listing } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Je bent VATUUR. AI, een top auto-expert voor de Belgische en Nederlandse markt. Analyseer het volgende voertuig uitgebreid.

Auto:
- ${listing.title}
- Merk: ${listing.brand}, Model: ${listing.model}
- Bouwjaar: ${listing.year}
- Kilometerstand: ${listing.mileage} km
- Brandstof: ${listing.fuelType}
- Transmissie: ${listing.transmission}
- Vermogen: ${listing.power || 'onbekend'} pk
- Carrosserie: ${listing.bodyType}
- Uitrusting: ${listing.features?.join(', ') || 'niet opgegeven'}
- Vraagprijs: €${listing.price}

Geef een uitgebreide analyse in exact dit JSON-formaat (geen markdown, puur JSON):
{
  "reliability": "Score 1-10 en korte uitleg over betrouwbaarheid van dit merk/model/bouwjaar (max 100 tekens)",
  "commonIssues": ["probleem1", "probleem2", "probleem3"],
  "maintenanceCost": "Inschatting jaarlijkse onderhoudskosten en uitleg (max 80 tekens)",
  "suitability": ["doelgroep1 met korte uitleg", "doelgroep2 met korte uitleg"],
  "verdict": "Eindoordeel in 2-3 zinnen: is dit een goede koop en voor wie?"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-tegoed op." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI niet beschikbaar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    let parsed;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { verdict: content, reliability: "N/A", commonIssues: [], maintenanceCost: "N/A", suitability: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vehicle-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

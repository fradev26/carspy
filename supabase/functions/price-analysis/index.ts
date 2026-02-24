import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { listing, analysis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Je bent een Nederlandse auto-expert en marktanalist. Analyseer de volgende auto en geef een kort, helder prijsadvies in het Nederlands.

Auto:
- ${listing.title}
- Bouwjaar: ${listing.year}
- Kilometerstand: ${listing.mileage} km
- Brandstof: ${listing.fuelType}
- Transmissie: ${listing.transmission}
- Vermogen: ${listing.power || 'onbekend'} pk
- Uitrusting: ${listing.features?.join(', ') || 'niet opgegeven'}

Marktanalyse:
- Vraagprijs: €${listing.price}
- Gemiddelde marktprijs: €${analysis.averagePrice}
- Laagste vergelijkbare: €${analysis.minPrice}
- Hoogste vergelijkbare: €${analysis.maxPrice}
- Aantal vergelijkbare auto's: ${analysis.comparableCount}
- Beoordeling: ${analysis.rating === 'good' ? 'Onder marktprijs' : analysis.rating === 'fair' ? 'Marktconform' : 'Boven marktprijs'}

Geef een analyse in exact dit JSON-formaat (geen markdown, puur JSON):
{
  "summary": "Eén zin samenvatting van het prijsoordeel (max 80 tekens)",
  "details": "2-3 zinnen die uitleggen waarom dit een goede/redelijke/hoge prijs is, rekening houdend met kilometerstand, bouwjaar, uitrusting en markttrends.",
  "tips": ["tip1", "tip2"]
}

De tips zijn korte onderhandelingstips voor de koper (max 2 tips, elk max 60 tekens).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Tegoed op, voeg credits toe." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analyse niet beschikbaar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let parsed;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { summary: "AI-analyse niet beschikbaar", details: content, tips: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("price-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

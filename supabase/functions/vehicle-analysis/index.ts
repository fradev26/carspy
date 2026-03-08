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

    const priceContext = listing.price
      ? `- Vraagprijs: €${listing.price}`
      : `- Vraagprijs: niet opgegeven (geef zelf een prijsvoorstel)`;

    const prompt = `Je bent VATUUR. AI, een ervaren auto-expert voor de Belgische tweedehandsmarkt.

Schrijf in modern, natuurlijk Vlaams Nederlands zoals gebruikt wordt op autoplatformen in Vlaanderen in 2026.

Taalregels:
- Gebruik Vlaams Nederlands, GEEN Nederlands uit Nederland
- VERMIJD: "uitstekende koop", "kilometerstand", "voertuig", "rijden op de snelweg"
- GEBRUIK: "sterke deal", "km-stand", "wagen", "op de autosnelweg", "in het dagelijkse verkeer", "bij stadsverkeer"
- Schrijf kort, duidelijk en geloofwaardig zoals een ervaren auto-expert
- Vermijd overdreven marketingtaal
- Schrijf alsof je een koper eerlijk advies geeft
- Gebruik europrijzen, km-stand en Belgische rijcontext (files, stadsverkeer, autosnelwegen, BIV, keuring)

Analyseer deze wagen:
- ${listing.title}
- Merk: ${listing.brand}, Model: ${listing.model}
- Bouwjaar: ${listing.year}
- Km-stand: ${listing.mileage} km
- Brandstof: ${listing.fuelType}
- Transmissie: ${listing.transmission}
- Vermogen: ${listing.power || 'onbekend'} pk
- Carrosserie: ${listing.bodyType}
- Uitrusting: ${listing.features?.join(', ') || 'niet opgegeven'}
${priceContext}

Geef een analyse in exact dit JSON-formaat (geen markdown, puur JSON):
{
  "reliability": "Score op 10 + korte uitleg over betrouwbaarheid gebaseerd op motor, transmissie en reputatie van dit merk/model (max 100 tekens)",
  "commonIssues": ["aandachtspunt 1", "aandachtspunt 2", "aandachtspunt 3"],
  "maintenanceCost": "Indicatie jaarlijkse onderhoudskosten in euro met korte uitleg (max 80 tekens)",
  "suitability": ["doelgroep 1 met korte uitleg", "doelgroep 2 met korte uitleg"],
  "suggestedPrice": 25000,
  "priceRange": { "min": 22000, "max": 28000 },
  "priceExplanation": "Korte uitleg (2-3 zinnen) waarom dit een eerlijke vraagprijs is voor deze wagen op de Belgische markt, rekening houdend met km-stand, bouwjaar en uitrusting.",
  "estimatedSellTime": "Geschatte verkooptijd in weken/maanden, bv. '2-4 weken' of '1-2 maanden', met korte uitleg waarom (populariteit, vraag/aanbod, seizoen).",
  "verdict": "Korte conclusie in 2-3 zinnen: is dit een sterke deal voor de vraagprijs en voor wie is deze wagen geschikt?"
}

Belangrijk:
- "commonIssues": mogelijke gekende problemen of slijtage bij dit type wagen
- "suitability": voor welke bestuurders deze wagen een goede keuze is (bv. pendelaars, jonge gezinnen, eerste wagen)
- "suggestedPrice": een eerlijk prijsvoorstel in euro (integer), gebaseerd op de Belgische tweedehandsmarkt
- "priceRange": minimum en maximum prijsrange waarbinnen de wagen realistisch kan verkocht worden
- "estimatedSellTime": hoe lang het gemiddeld duurt om dit type wagen te verkopen op de Belgische markt
- Schrijf altijd compact en Vlaams, alsof het bedoeld is voor een modern Belgisch autoplatform`;

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
      parsed = { verdict: content, reliability: "N/A", commonIssues: [], maintenanceCost: "N/A", suitability: [], suggestedPrice: 0, priceRange: { min: 0, max: 0 }, priceExplanation: "", estimatedSellTime: "" };
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

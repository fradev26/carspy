import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse, requireAuth, rateLimit, parseJson, z } from "../_shared/ai-guard.ts";

const ListingSchema = z.object({
  title: z.string().min(1).max(200),
  year: z.number().int().min(1950).max(2100),
  mileage: z.number().int().min(0).max(2_000_000),
  fuelType: z.string().min(1).max(40),
  transmission: z.string().min(1).max(40),
  power: z.number().int().min(0).max(2000).optional().nullable(),
  features: z.array(z.string().max(60)).max(60).optional(),
  price: z.number().int().min(0).max(10_000_000),
});
const AnalysisSchema = z.object({
  averagePrice: z.number().min(0).max(10_000_000),
  minPrice: z.number().min(0).max(10_000_000),
  maxPrice: z.number().min(0).max(10_000_000),
  comparableCount: z.number().int().min(0).max(100000),
  rating: z.enum(["good", "fair", "high"]),
});
const InputSchema = z.object({ listing: ListingSchema, analysis: AnalysisSchema });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const id = await requireAuth(req);
    if (id instanceof Response) return id;
    if (!(await rateLimit(id, "price-analysis", 20, 60))) {
      return jsonResponse({ error: "Te veel verzoeken, wacht even." }, 429);
    }
    const v = await parseJson(req, InputSchema);
    if (!v.ok) return v.response;
    const { listing, analysis } = v.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

Wagen:
- ${listing.title}
- Bouwjaar: ${listing.year}
- Km-stand: ${listing.mileage} km
- Brandstof: ${listing.fuelType}
- Transmissie: ${listing.transmission}
- Vermogen: ${listing.power || 'onbekend'} pk
- Uitrusting: ${listing.features?.join(', ') || 'niet opgegeven'}

Marktanalyse:
- Vraagprijs: €${listing.price}
- Gemiddelde marktprijs: €${analysis.averagePrice}
- Laagste vergelijkbare: €${analysis.minPrice}
- Hoogste vergelijkbare: €${analysis.maxPrice}
- Aantal vergelijkbare wagens: ${analysis.comparableCount}
- Beoordeling: ${analysis.rating === 'good' ? 'Onder marktprijs' : analysis.rating === 'fair' ? 'Marktconform' : 'Boven marktprijs'}

Geef een analyse in exact dit JSON-formaat (geen markdown, puur JSON):
{
  "summary": "Eén krachtige zin samenvatting van het prijsoordeel (max 100 tekens)",
  "priceVerdict": "good | fair | high",
  "details": "3-4 zinnen die uitleggen waarom dit een sterke deal, redelijke prijs of dure wagen is. Houd rekening met km-stand, bouwjaar, uitrusting en markttrends in België.",
  "strengths": ["sterk punt 1", "sterk punt 2", "sterk punt 3"],
  "weaknesses": ["aandachtspunt 1", "aandachtspunt 2"],
  "marketContext": "2-3 zinnen over de marktpositie van dit merk/model in België, populariteit, restwaarde en vraag/aanbod.",
  "ownershipCosts": "2-3 zinnen over verwachte kosten: onderhoud, verzekering, BIV, wegenbelasting en brandstofkosten voor deze wagen in België.",
  "tips": ["tip 1 (max 80 tekens)", "tip 2", "tip 3"],
  "score": 7
}

Belangrijk:
- strengths: 2-4 sterke punten van deze specifieke wagen
- weaknesses: 1-3 aandachtspunten of risico's
- marketContext: marktpositie en trends in België
- ownershipCosts: geschatte eigendomskosten in Belgische context (BIV, keuring, verzekering)
- tips: 2-4 onderhandelingstips voor de koper
- score: totaalscore van 1-10 (10 = beste deal)`;

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
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
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

    let parsed;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { summary: "AI-analyse niet beschikbaar", details: content, tips: [], strengths: [], weaknesses: [], marketContext: "", ownershipCosts: "", score: 0, priceVerdict: "fair" };
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse, requireAuth, rateLimit, parseJson, z } from "../_shared/ai-guard.ts";

const SYSTEM_PROMPT = `Je bent een professionele autoadvertentie-schrijver voor de Belgische en Nederlandse markt. 
Schrijf een aantrekkelijke, eerlijke en informatieve advertentietekst op basis van de opgegeven specificaties.

Richtlijnen:
- Schrijf in het Nederlands
- Begin met een pakkende openingszin
- Noem de belangrijkste highlights en sterke punten
- Wees eerlijk en vermijd overdreven claims
- Gebruik een professionele maar toegankelijke toon
- Houd het tussen 80-150 woorden
- Gebruik geen opsommingstekens, schrijf lopende tekst in 2-3 alinea's
- Noem relevante verkoopargumenten (zuinigheid, betrouwbaarheid, comfort, etc.)`;

const InputSchema = z.object({
  brand: z.string().min(1).max(60),
  model: z.string().min(1).max(80),
  year: z.number().int().min(1950).max(2100),
  mileage: z.number().int().min(0).max(2_000_000),
  fuelType: z.string().min(1).max(40),
  transmission: z.string().min(1).max(40),
  bodyType: z.string().min(1).max(40),
  color: z.string().max(40).optional().nullable(),
  power: z.number().int().min(0).max(2000).optional().nullable(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const id = await requireAuth(req);
    if (id instanceof Response) return id;
    if (!(await rateLimit(id, "generate-listing", 20, 60))) {
      return jsonResponse({ error: "Te veel verzoeken, probeer het over een minuut opnieuw." }, 429);
    }
    const v = await parseJson(req, InputSchema);
    if (!v.ok) return v.response;
    const { brand, model, year, mileage, fuelType, transmission, bodyType, color, power } = v.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Schrijf een advertentietekst voor deze auto:
- Merk: ${brand}
- Model: ${model}
- Bouwjaar: ${year}
- Kilometerstand: ${mileage} km
- Brandstof: ${fuelType}
- Transmissie: ${transmission}
- Carrosserie: ${bodyType}
${color ? `- Kleur: ${color}` : ''}
${power ? `- Vermogen: ${power} pk` : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
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
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-listing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Je bent AutoSpy AI, een slimme auto-assistent voor de Belgische en Nederlandse automarkt. Je helpt gebruikers met:

1. **Auto zoeken**: Vertaal natuurlijke taal naar zoekfilters. Bijvoorbeeld: "Ik zoek een zwarte BMW onder 25k met automaat" → merk: BMW, kleur: zwart, max prijs: 25000, transmissie: automaat
2. **Prijsadvies**: Geef inschatting of een prijs marktconform is op basis van merk, model, bouwjaar en kilometerstand
3. **Koopadvies**: Help gebruikers de juiste auto te kiezen op basis van hun behoeften (gezin, budget, gebruik)
4. **Vergelijken**: Help auto's vergelijken op basis van specificaties
5. **Technisch advies**: Beantwoord vragen over onderhoud, betrouwbaarheid, veelvoorkomende problemen per merk/model

Richtlijnen:
- Antwoord altijd in het Nederlands
- Wees beknopt maar informatief
- Gebruik emoji's spaarzaam maar effectief (🚗, ✅, ⚠️, 💰)
- Als je zoekfilters herkent, geef ze terug in een gestructureerd formaat
- Verwijs gebruikers naar de zoekpagina wanneer relevant
- Wees eerlijk als je iets niet zeker weet
- Focus op de Belgische/Nederlandse markt (merken, prijzen, regelgeving)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-tegoed op, voeg credits toe aan je workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

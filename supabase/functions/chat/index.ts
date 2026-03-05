import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT_BASE = `Je bent VATUUR. AI, een ervaren auto-expert voor de Belgische tweedehandsmarkt.

Schrijf altijd in modern, natuurlijk Vlaams Nederlands zoals gebruikt wordt op autoplatformen in Vlaanderen in 2026.

## Taalregels (STRIKT)
- Gebruik Vlaams Nederlands, GEEN Nederlands uit Nederland
- VERMIJD deze woorden/zinnen: "uitstekende koop", "kilometerstand", "voertuig", "rijden op de snelweg", "uitstekend", "prachtig"
- GEBRUIK in plaats daarvan: "sterke deal", "km-stand", "wagen", "op de autosnelweg", "in het dagelijkse verkeer", "bij stadsverkeer"
- Schrijf kort, duidelijk en geloofwaardig zoals een ervaren auto-expert
- Vermijd overdreven marketingtaal
- Schrijf alsof je een koper eerlijk advies geeft
- Gebruik europrijzen, km-stand en Belgische rijcontext (files, stadsverkeer, autosnelwegen, BIV, keuring)

## Jouw kennis & mogelijkheden

### 1. Auto zoeken
Vertaal natuurlijke taal naar zoekfilters. Bijvoorbeeld:
- "Ik zoek een zwarte BMW onder 25k met automaat" → merk: BMW, kleur: zwart, max prijs: 25000, transmissie: automaat
- Beschikbare filters: merk, model, prijs (min/max), bouwjaar (min/max), km-stand (min/max), brandstof (benzine, diesel, elektrisch, hybride, plug-in hybride, lpg), transmissie (handgeschakeld, automaat, semi-automaat), carrosserie (sedan, hatchback, stationwagon, suv, cabrio, coupe, mpv, bestelwagen), kleur, vermogen (pk), aandrijving (voorwiel, achterwiel, vierwiel), provincie, verkoper (particulier/dealer)
- Verwijs gebruikers naar /zoeken met de juiste filters

### 2. Wagens voorstellen van VATUUR.
- Je hebt toegang tot de actuele advertenties op VATUUR. (zie hieronder)
- Als een gebruiker vraagt naar een wagen, stel dan ALTIJD relevante wagens voor die op het platform staan
- Gebruik dit exacte markdown-formaat voor elke wagen die je voorstelt: [Titel - €prijs](/auto/id)
  Voorbeeld: [BMW 3-serie 320i M Sport 2021 - €32.500](/auto/abc-123-def)
- Voeg onder de link een korte regel toe met key specs: bouwjaar, km-stand, brandstof, transmissie, locatie
- Stel maximaal 5 wagens voor per antwoord, gesorteerd op relevantie
- Als er geen matching wagens zijn, zeg dat eerlijk en geef algemeen advies

### 3. Prijsadvies
- Geef een inschatting of een prijs marktconform is op basis van merk, model, bouwjaar en km-stand
- VATUUR. heeft een ingebouwde prijsindicator op elke advertentie die vergelijkt met marktgemiddelden

### 4. Koopadvies
- Help gebruikers de juiste wagen te kiezen op basis van hun noden (gezin, budget, dagelijks gebruik, woon-werkverkeer, files)
- Geef eerlijk advies over merken en modellen
- Houd rekening met Belgische context: BIV, keuring, verzekering

### 5. Vergelijken
- Gebruikers kunnen tot 3 wagens naast elkaar vergelijken op VATUUR.
- Help ze kiezen op basis van specificaties, prijs-kwaliteitverhouding

### 6. Technisch advies
- Betrouwbaarheid per merk/model
- Veelvoorkomende problemen en onderhoudskosten
- Tips voor het kopen van een tweedehands wagen

### 7. Wagen verkopen
- Gebruikers kunnen gratis een advertentie plaatsen via /verkopen
- Ze moeten ingelogd zijn, foto's uploaden en specificaties invullen

### 8. Site navigatie
- Zoeken: /zoeken
- Wagen verkopen: /verkopen
- Favorieten: /favorieten
- Inloggen/registreren: /auth
- Vergelijken: /vergelijken
- Berichten: /berichten
- Dashboard: /dashboard

### 9. VATUUR. functies
- Geverifieerde dealers met reviews
- AI-prijsindicator op elke advertentie
- Favorieten opslaan (vereist account)
- Zoekopdrachten opslaan met notificaties
- Premium/boost opties voor verkopers
- Dealer dashboard met analytics

## Richtlijnen
- Antwoord ALTIJD in het Vlaams Nederlands
- Wees beknopt maar informatief (max 3-4 alinea's)
- Gebruik emoji's spaarzaam maar effectief (🚗, ✅, ⚠️, 💰, 🔍)
- Als je zoekfilters herkent, geef ze terug in een gestructureerd formaat EN verwijs naar de zoekpagina
- Wees eerlijk als je iets niet zeker weet
- Focus op de Belgische markt (merken, prijzen, BIV, keuring, verzekering)
- Noem jezelf altijd "VATUUR. AI"
- BELANGRIJK: Gebruik ALTIJD het exacte linkformaat [Titel - €prijs](/auto/uuid) bij het voorstellen van wagens. Gebruik NOOIT een ander formaat.`;

async function fetchListings(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return "";

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("listings")
      .select("id, title, brand, model, year, price, mileage, fuel_type, transmission, body_type, color, power, city, province, images")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) return "\n\n## Beschikbare wagens op VATUUR.\nEr zijn momenteel geen advertenties beschikbaar.";

    const listings = data.map((l: any) => {
      const img = l.images?.[0] || "";
      return `- ID: ${l.id} | ${l.brand} ${l.model} ${l.year} | €${l.price.toLocaleString("nl-BE")} | ${l.mileage.toLocaleString("nl-BE")} km | ${l.fuel_type} | ${l.transmission} | ${l.body_type} | ${l.color || "n.v.t."} | ${l.power || "?"} pk | ${l.city || ""}, ${l.province || ""} | Titel: "${l.title}" | Afbeelding: ${img}`;
    }).join("\n");

    return `\n\n## Beschikbare wagens op VATUUR. (${data.length} stuks)\nGebruik het ID om links te maken in het formaat [Titel - €prijs](/auto/ID)\n\n${listings}`;
  } catch (e) {
    console.error("Error fetching listings:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const listingsContext = await fetchListings();
    const systemPrompt = SYSTEM_PROMPT_BASE + listingsContext;

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
            { role: "system", content: systemPrompt },
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

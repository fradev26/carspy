// Smart Search edge function — converts natural language to structured filters
// using Lovable AI Gateway with tool calling.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CAR_BRANDS = [
  'Audi', 'BMW', 'Citroën', 'Cupra', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai',
  'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Porsche',
  'Renault', 'Seat', 'Skoda', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
];

const FUEL_TYPES = ['benzine', 'diesel', 'elektrisch', 'hybride', 'plug-in hybride', 'lpg'];
const TRANSMISSIONS = ['handgeschakeld', 'automaat', 'semi-automaat'];
const BODY_TYPES = ['sedan', 'hatchback', 'stationwagon', 'suv', 'cabrio', 'coupe', 'mpv', 'bestelwagen'];
const COLORS = ['Zwart', 'Wit', 'Grijs', 'Zilver', 'Blauw', 'Rood', 'Groen', 'Bruin', 'Beige', 'Geel', 'Oranje', 'Paars'];
const FEATURES = [
  'apple_carplay', 'android_auto', 'navigation', 'parking_sensors', 'rear_camera', 'camera_360',
  'cruise_control', 'adaptive_cruise', 'seat_heating', 'panoramic_roof', 'sunroof', 'led_headlights',
  'matrix_led', 'tow_bar', 'alloy_wheels', 'lane_assist', 'blind_spot', 'head_up_display',
];

const systemPrompt = `Je bent VATUUR's slimme zoekassistent voor tweedehands auto's in België en Nederland.
Zet een natuurlijke zoekvraag om naar gestructureerde filters via de tool 'apply_filters'.

Regels:
- Geldige merken: ${CAR_BRANDS.join(', ')}.
- Spelfouten corrigeren ("mercedess" -> "Mercedes-Benz", "volswagen" -> "Volkswagen", "audii" -> "Audi").
- Brandstof (kies uit): ${FUEL_TYPES.join(', ')}.
- Transmissie (kies uit): ${TRANSMISSIONS.join(', ')}.
- Carrosserie (kies uit): ${BODY_TYPES.join(', ')}.
- Kleuren (kies uit, hoofdletter eerst): ${COLORS.join(', ')}.
- Features (kies uit): ${FEATURES.join(', ')}.

Synoniemen / intenties:
- "zuinig" -> fuelTypes: ['hybride','elektrisch','plug-in hybride'], maxPower 130
- "gezinswagen" -> bodyTypes: ['suv','mpv','stationwagon'], minSeats 5
- "sportief" / "snel" / "veel pk" -> minPower 200
- "goedkoop" / "betaalbaar" -> maxPrice 15000
- "weinig kilometers" / "lage km" -> maxMileage 80000
- "automaat" -> transmissions: ['automaat']
- "handgeschakeld" / "manueel" -> transmissions: ['handgeschakeld']
- "stadswagen" / "klein" -> bodyTypes: ['hatchback']
- "elektrisch" / "EV" -> fuelTypes: ['elektrisch']
- "diesel" / "benzine" / "hybride" -> overeenkomstig fuelTypes
- "nieuw" / "recent" -> minYear = huidig jaar - 3
- "onder X euro" / "max X" -> maxPrice X
- "vanaf X" / "boven X euro" (prijs) -> minPrice X

Voor 'intent': geef één korte Nederlandse zin in de vorm "We zochten ...". Vlaamse tone.
Voor 'confidence': 0.0-1.0 — hoe zeker je bent dat de filters de vraag correct dekken.
Laat velden weg als de gebruiker er niets over zei. Geef geen verzonnen waarden.`;

interface ToolArgs {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  fuelTypes?: string[];
  transmissions?: string[];
  bodyTypes?: string[];
  colors?: string[];
  features?: string[];
  minPower?: number;
  maxPower?: number;
  minSeats?: number;
  intent: string;
  confidence: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (query.length > 500) {
      return new Response(JSON.stringify({ error: 'query too long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'apply_filters',
              description: 'Zet de zoekvraag om naar gestructureerde filters voor de marketplace.',
              parameters: {
                type: 'object',
                properties: {
                  brand: { type: 'string', enum: CAR_BRANDS },
                  model: { type: 'string' },
                  minPrice: { type: 'number' },
                  maxPrice: { type: 'number' },
                  minYear: { type: 'number' },
                  maxYear: { type: 'number' },
                  minMileage: { type: 'number' },
                  maxMileage: { type: 'number' },
                  fuelTypes: { type: 'array', items: { type: 'string', enum: FUEL_TYPES } },
                  transmissions: { type: 'array', items: { type: 'string', enum: TRANSMISSIONS } },
                  bodyTypes: { type: 'array', items: { type: 'string', enum: BODY_TYPES } },
                  colors: { type: 'array', items: { type: 'string', enum: COLORS } },
                  features: { type: 'array', items: { type: 'string', enum: FEATURES } },
                  minPower: { type: 'number' },
                  maxPower: { type: 'number' },
                  minSeats: { type: 'number' },
                  intent: { type: 'string', description: 'Korte Nederlandse zin: "We zochten ..."' },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                },
                required: ['intent', 'confidence'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'apply_filters' } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: 'Te veel verzoeken, probeer zo opnieuw.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI-tegoed opgebruikt. Voeg credits toe.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await resp.text();
      console.error('AI gateway error:', resp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({
        filters: {}, intent: 'We konden je vraag niet helemaal interpreteren.', confidence: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const args: ToolArgs = JSON.parse(toolCall.function.arguments);
    const { intent, confidence, ...filters } = args;

    return new Response(JSON.stringify({ filters, intent, confidence }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('smart-search error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

# Herontwerp SalesAI output → Dashboard UI

Vandaag rendert `SalesAI.tsx` antwoorden als ruwe markdown via `ChatMessage`. We schakelen om naar een gestructureerd JSON-formaat dat het model meelevert in een fenced codeblok, en renderen dat met een nieuwe `SalesAIResponse` component die kaarten, badges en KPI's toont.

## 1. Backend — gestructureerde output afdwingen

Bestand: `supabase/functions/chat/index.ts` (alleen de `SYSTEM_PROMPT_BUSINESS`)

- Instructie toevoegen: bij elk SalesAI-antwoord moet bovenaan één codeblok komen:

  ````
  ```vatuur-sales
  { ...JSON... }
  ```
  ````

- Vrije tekst eronder mag, maar wordt niet getoond als het blok aanwezig is.
- JSON-schema dat we vragen:

  ```json
  {
    "summary": "1 zin samenvatting / hoofdadvies",
    "opportunities": [
      {
        "listing_id": "uuid|null",
        "title": "Mercedes-Benz C220d AMG Line",
        "price": 34500,
        "margin": 4200,
        "badges": [
          { "label": "Hoogste marge", "tone": "success", "icon": "flame" },
          { "label": "Snelle rotatie", "tone": "info", "icon": "zap" },
          { "label": "Particulier", "tone": "neutral", "icon": "user" }
        ],
        "reasons": ["Hoge vraag in België", "Premium uitstraling", "Sterke restwaarde"],
        "risks": ["Hoge km-stand"]
      }
    ],
    "actions": [
      { "label": "Advertentie schrijven", "type": "write_ad", "listing_id": "..." },
      { "label": "Markt vergelijken", "type": "market_compare", "listing_id": "..." },
      { "label": "Prijs optimaliseren", "type": "optimize_price", "listing_id": "..." },
      { "label": "Boosten", "type": "boost", "listing_id": "..." },
      { "label": "Leadcampagne starten", "type": "lead_campaign" }
    ],
    "kpis": [
      { "label": "Verwachte verkoop", "value": "14 dagen", "tone": "info" },
      { "label": "Marge", "value": "€4.200", "tone": "success" },
      { "label": "Vraagscore", "value": "92/100", "tone": "success" },
      { "label": "Concurrentiescore", "value": "68/100", "tone": "warning" }
    ],
    "risks": ["Concurrentie boven gemiddeld in dit segment"]
  }
  ```

- Stijlregels bijwerken: GEEN markdown-tabellen, GEEN pipes, GEEN losse opsommingen — alles in het JSON-blok.

## 2. Nieuw component — `SalesAIResponse`

Nieuw bestand: `src/components/dealer/salesai/SalesAIResponse.tsx`

Verantwoordelijkheden:
- Input: `rawContent: string`.
- Extraheert `vatuur-sales` codeblok; parse JSON met try/catch. Bij fout: fallback naar bestaande markdown-render (`ChatMessage` flow).
- Rendert secties (alleen als data aanwezig):
  1. **AI Insight Card** — `Card` met Lucide `Lightbulb`, titel "SalesAI Advies", `summary`-zin (groot, sterk leesbaar, subtiele primary-glow border).
  2. **Top kansen** — grid (`grid-cols-1`) van `Card`s per `opportunity`: titel, prijs (`text-primary` semibold), badges (shadcn `Badge` met tone→variant mapping), link naar `/zakelijk/voorraad/{listing_id}` indien aanwezig.
  3. **Waarom deze wagen?** — per opportunity, compacte sub-card met `reasons` lijst (checkmark icons).
  4. **SalesAI Acties** — `actions` als `Button`-grid. Type→handler:
     - `write_ad` → navigate `/zakelijk/voorraad/{id}/advertentie`
     - `market_compare` → `/zakelijk/voorraad/{id}?tab=markt`
     - `optimize_price` → `/zakelijk/voorraad/{id}?tab=prijs`
     - `boost` → open bestaande `BoostDialog` (event/state)
     - `lead_campaign` → `/zakelijk/leads`
     (gebruik de routes die al bestaan; onbekende types worden disabled)
  5. **Risico's** — top-level `risks[]` als compacte oranje/rode alert-rij met `AlertTriangle`.
  6. **Verwacht resultaat** — `kpis` in `grid-cols-2 md:grid-cols-4` KPI-cards (groot getal, label eronder, tone-kleuraccent).

Visueel:
- Shadcn `Card`, `Badge`, `Button`.
- Lucide icons (`Lightbulb`, `Flame`, `Zap`, `User`, `TrendingUp`, `AlertTriangle`, `CheckCircle2`, `Sparkles`, `Megaphone`, `Tag`, `BarChart3`, `Rocket`).
- Tone-mapping: `success` → groene accent (`text-emerald-600`/`bg-emerald-500/10`), `warning` → oranje (`text-amber-600`), `danger` → `text-destructive`, `info`/`neutral` → muted/primary.
- Mobiel-first: kaarten stacken, KPI's `grid-cols-2` op mobiel.
- Alle kleur via design tokens (geen `bg-white`/`text-black`).
- Geen markdown tables, geen pipes — alleen UI.

## 3. Integratie in chat-rendering

Bestand: `src/modules/chat/ChatMessage.tsx`
- Voor assistant-berichten: detecteer `vatuur-sales` codeblok. Als aanwezig → render `<SalesAIResponse rawContent={message.content} />` in plaats van de huidige `prose`-markdown. Bestaande `vatuur-lead` afhandeling blijft. Fallback naar markdown blijft voor niet-SalesAI-contexten.

Bestand: `src/pages/dealer/SalesAI.tsx`
- Geen wijziging in flow; `ChatMessage` doet het werk zodat zowel hier als andere SalesAI-oppervlakken (bv. `ChatWidget` in `business` context) automatisch het nieuwe component gebruiken.

## 4. Streaming UX

- Tijdens het streamen kan het JSON-blok nog incompleet zijn → `SalesAIResponse` toont in dat geval een subtiele skeleton (`Sparkles` + "SalesAI denkt na…") tot het blok parsebaar is. Dit voorkomt zichtbare ruwe JSON.

## 5. Niet in scope

- Geen wijziging aan publieke `vatuur` (consumer) chat.
- Geen wijzigingen aan `useChat` of streaming-pipeline zelf.
- Geen nieuwe routes; acties hergebruiken bestaande dealer-routes.

## Bestanden

- ✏️ `supabase/functions/chat/index.ts` — `SYSTEM_PROMPT_BUSINESS` uitbreiden met JSON-contract.
- ➕ `src/components/dealer/salesai/SalesAIResponse.tsx` — nieuw component.
- ✏️ `src/modules/chat/ChatMessage.tsx` — detecteer `vatuur-sales` blok en render via nieuw component.

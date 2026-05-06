## Plan: Slim Zoeken (AI-gestuurde natural language search)

Gebruikers typen vragen zoals *"Rode BMW SUV onder 20.000 euro"* en de AI zet dit om naar gestructureerde filters die de bestaande zoekpagina gebruikt. Geen extra services nodig — Lovable AI (Gemini) is al beschikbaar.

### Hoe het werkt (flow)

```
Gebruiker typt natuurlijke vraag
        ↓
Edge function `smart-search` (Lovable AI + tool calling)
        ↓
Gestructureerde filters (JSON) + interpretatie-zin
        ↓
Redirect naar /zoeken?... met AI-filter chips bovenaan
        ↓
Bestaande filterlogica toont resultaten
```

### Wat we bouwen

**1. Edge function `supabase/functions/smart-search/index.ts`**
- Input: `{ query: string }`
- Gebruikt Lovable AI (`google/gemini-3-flash-preview`) met **tool calling** om gestructureerde output af te dwingen (geen JSON-parsing-bugs).
- Tool schema mapt op bestaande `SearchFilters`: brand, model, minPrice/maxPrice, minYear/maxYear, maxMileage, fuelTypes, transmissions, bodyTypes, colors, features, minPower.
- Systeem-prompt bevat:
  - Lijst geldige merken/modellen/carrosserie/brandstof uit `src/types/listing.ts`
  - Synoniemen-regels: *zuinig* → hybride/elektrisch + maxPower laag, *gezinswagen* → SUV/MPV + minSeats 5, *sportief* → hoge pk, *goedkoop* → maxPrice 15000, *weinig km* → maxMileage 80000, *automaat* → automaat
  - Fuzzy: spelfouten corrigeren ("mercedess" → Mercedes-Benz, "volswagen" → Volkswagen), deelmatches ("BMW 3" → 3 Series)
  - Vlaamse/Nederlandse tone (past bij VATUUR-stijl)
- Output: `{ filters, intent: "We zochten een betaalbare BMW SUV in rood met automaat", confidence }`
- Standaard CORS, 429/402 error handling.

**2. Frontend component `src/modules/search/SmartSearchBar.tsx`**
- Eén groot input veld met Sparkles-icoon en placeholder *"Beschrijf je droomwagen… bv. 'rode BMW SUV onder 20.000 euro'"*
- Submit → call edge function → toon korte loader ("AI begrijpt je vraag…") → navigeer naar `/zoeken?...&aiIntent=...`
- Voorbeeld-chips eronder (3-4 quick prompts) om gebruikers op weg te helpen.

**3. Toggle Klassiek / Slim zoeken op homepage (`SearchBar.tsx` hero variant)**
- Twee tabs bovenaan de hero search-card: **Klassiek** (huidige formulier) en **Slim** (nieuwe SmartSearchBar). Standaard: Slim.

**4. AI-intent banner op `/zoeken`**
- Nieuwe URL-param `aiIntent` → toon bovenaan resultaten een card met Sparkles icoon: *"We zochten: {intent}"* + knop "Filters aanpassen" (opent FilterPanel) en "Klassiek zoeken".
- Actieve AI-filters worden via bestaande `FilterChips` getoond — visueel gemarkeerd met een subtiele Sparkles badge zodat duidelijk is welke filters door AI zijn ingevuld.

**5. Fallback**
- Als de AI geen enkel filter kan extraheren → toon *"We hebben je vraag niet helemaal begrepen, hier zijn populaire wagens"* en alle resultaten.
- Bij netwerkfout / 402 / 429 → toast met duidelijke melding, fallback naar klassiek formulier.

### Bestanden

**Nieuw:**
- `supabase/functions/smart-search/index.ts` — edge function met Lovable AI tool calling
- `src/modules/search/SmartSearchBar.tsx` — input + submit logica
- `src/hooks/useSmartSearch.ts` — wrapper om `supabase.functions.invoke('smart-search')`

**Aangepast:**
- `src/modules/search/SearchBar.tsx` — Tabs toevoegen (Klassiek / Slim) in hero variant
- `src/pages/Search.tsx` — AI-intent banner + parsing van `aiIntent` URL param
- `src/modules/search/index.ts` — export SmartSearchBar
- `supabase/config.toml` — `[functions.smart-search] verify_jwt = false` (publieke search)

### Geen DB-wijzigingen
Slim zoeken werkt 100% met bestaande `listings` tabel en `SearchFilters` types. Geen migrations nodig.

### Out of scope (kunnen later)
- Live autocomplete tijdens typen (kost extra AI-calls per toetsaanslag)
- Opslaan van AI-zoekgeschiedenis als saved searches (kan gebouwd op bestaande `saved_searches` tabel later)
- Voice input

Klaar om te bouwen?
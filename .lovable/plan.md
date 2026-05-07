## Redesign hero + AI sectie: focus, copy & CTA's

Doel: één duidelijke primaire flow (Slim zoeken), AI-waarde concreet maken, generieke copy vervangen door tastbare claims, CTA's actiever en consistent.

### 1. Hero section (`src/pages/Index.tsx`)

**Nieuwe copy:**
- **H1**: "Vind je volgende auto in één zin."
- **Subtitle**: "Beschrijf wat je zoekt — VATUUR. doorzoekt 25.000+ occasions van geverifieerde dealers in NL & BE en filtert direct het beste resultaat."
- **Label boven search** (verwijderen): "Zoek jouw auto" — overbodig, hero spreekt al voor zich.
- **Primaire CTA** = de Slim zoeken bar zelf (knop: "Zoek" → **"Vind mijn auto"**).
- **Secundaire CTA** (kleine link onder bar, alle viewports ipv lg-only):
  *"Auto verkopen? Plaats gratis in 2 minuten →"* linkt naar `/verkopen`.

**Tabs vereenvoudiging:**
- Verwijder de "Klassiek" tab uit de hero. Slim zoeken is dé entry. Klassieke filters blijven beschikbaar via een onopvallende link onder de bar: *"Liever filters gebruiken? →"* linkt naar `/zoeken`.
- Hierdoor: één primaire flow, geen keuzestress. `HeroSearch.tsx` wordt vervangen door directe render van `SmartSearchBar` + secundaire link.

**Trust strip** (blijven, lichte herformulering):
- "Geverifieerde dealers" → "Alleen geverifieerde verkopers"
- "25.000+ auto's online" → "25.000+ actuele occasions"
- "Dagelijks nieuwe advertenties" → "Dagelijks vers aanbod"

### 2. AI-assistent sectie (`src/modules/chat/AIChatSection.tsx`)

**Nieuwe positionering — concrete differentiator t.o.v. filters:**
- **Badge**: "AI-Assistent"
- **H2**: "Filters tonen alles. VATUUR. AI toont wat past."
- **Subtitle**: "Stel je vraag in normale taal. De assistent vergelijkt prijs, kilometerstand, opties en marktwaarde — en zegt eerlijk wanneer een wagen géén goede deal is."

**3 voorbeeldprompts** (vervangen huidige 6 generieke):
- "Welke gezinsauto met automaat onder €18.000 heeft de laagste km-stand?"
- "Is deze BMW 320d uit 2019 voor €22.500 een eerlijke prijs?"
- "Wat zijn de 3 betrouwbaarste hybrides tot €25.000 in België?"

**"Waarom beter dan filters" — 3 mini-bullets onder suggesties:**
- "Begrijpt context (budget + gebruik + voorkeuren tegelijk)"
- "Geeft een dealscore 1–10 per wagen, geen verkooppraatjes"
- "Filtert ruis weg — geen 1.200 resultaten doorscrollen"

**Input placeholder**:
*"bv. 'gezinsauto automaat onder €18k met lage km' "*

### 3. CTA copy set (project-breed)

| Context | Oud | Nieuw |
|---|---|---|
| Smart search knop | Zoek | Vind mijn auto |
| Klassieke search knop | Zoeken | Toon resultaten |
| Listing card primair | Bekijk details | Bekijk deze deal |
| Hero secundair | of verkoop je auto gratis → | Auto verkopen? Plaats gratis in 2 minuten → |
| CTA section | Start nu met verkopen | Plaats mijn advertentie |
| "Bekijk alles" listings | Bekijk alles | Bekijk alle 25.000+ wagens |
| Vergelijken bar | Vergelijken | Vergelijk deze 3 |

### 4. Verwijderen / dempen

- "De slimste manier om een tweedehands auto te vinden" → vervangen (zie hero).
- "Jouw slimste auto-assistent — zoek, vergelijk en krijg advies" → vervangen.
- "Waarom VATUUR?" 3-cards sectie blijft, maar copy iets concreter:
  - "Betrouwbaar" → "Geverifieerde dealers" + "Elke verkoper KvK-gecontroleerd, geen anonieme advertenties"
  - "Snel & Eenvoudig" → "AI doet het zoekwerk" + "Beschrijf wat je zoekt, VATUUR. AI levert de top-matches"
  - "Grote keuze" → "25.000+ wagens" + "Vers aanbod uit heel NL & BE, dagelijks bijgewerkt"

### 5. UX flow (3 stappen)

```text
1. Hero          → gebruiker beschrijft wagen in eigen woorden ("Vind mijn auto")
2. Resultaten    → AI-intent banner toont begrip; lijst met dealscores
3. Detail/Deal   → "Bekijk deze deal" → AI-analyse + contact verkoper / vergelijken
```

### Bestanden gewijzigd

- `src/pages/Index.tsx` — hero copy, label weg, secundaire CTA, "Waarom VATUUR?" copy, "Bekijk alles" knop, eind-CTA copy.
- `src/modules/search/HeroSearch.tsx` — tabs verwijderen, alleen `SmartSearchBar` + secundaire link "Liever filters? →".
- `src/modules/search/SmartSearchBar.tsx` — knoptekst "Zoek" → "Vind mijn auto".
- `src/modules/search/SearchBar.tsx` — knoptekst "Zoeken" → "Toon resultaten" (consistency op /zoeken).
- `src/modules/chat/AIChatSection.tsx` — nieuwe headline/subtitle, 3 nieuwe prompts, "waarom beter dan filters" bullets, placeholder.
- `src/modules/listings/ListingCard.tsx` — "Bekijk details" → "Bekijk deze deal".

Geen routing/backend/DB changes.
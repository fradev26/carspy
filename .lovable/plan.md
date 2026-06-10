## Doel

Op mobiel "zoeken vóór bladeren" doorvoeren, zonder de desktopervaring te wijzigen.

## 1. Mobiele zoekpagina (`src/pages/Search.tsx`)

Introduceer een **intent gate** die enkel op mobiel (`lg:hidden`) actief is. Resultaten worden alleen geladen/getoond op mobiel zodra de gebruiker een actie heeft ondernomen.

Bepaling "heeft de gebruiker iets gedaan?" (`hasUserIntent`):
- één of meer URL-parameters aanwezig: `q`, `aiIntent`, of een actieve filter (`activeFilterCount > 0`), OF
- de gebruiker heeft expliciet "Bekijk alle resultaten" geklikt (lokale state `showAll`, niet gepersisteerd).

Mobiele layout vóór intent (alleen `<lg`):
1. `SmartSearchBar variant="compact"` (AI / natuurlijke taal).
2. Eenvoudig zoekveld voor vrije tekst (zet `?q=...` in URL bij submit) — hergebruikt bestaand `Input`.
3. Compacte filterkaart met de belangrijkste filters: Merk, Model, Prijs (min/max), Bouwjaar (min/max), Kilometerstand (max), Brandstof, Transmissie. Gebruikt bestaande filter-controls uit `FilterPanel` of inline `Select`s gevoed met dezelfde opties; aanpassen werkt via `handleFiltersChange`.
4. Knop "Meer filters" → opent bestaande mobiele filter-`Drawer` (volledige `FilterPanel`).
5. Primaire CTA "Bekijk resultaten" → zet `showAll = true`, scrolt naar resultatenblok. Toont live aantal (`{filteredListings.length}`).
6. Secundaire link "Wis alles" wanneer er filters actief zijn.

Resultatensectie:
- Op mobiel alleen renderen wanneer `hasUserIntent` true is. Anders blok volledig verbergen (geen skeletons, geen lege-state).
- Wanneer zichtbaar: bestaande `ListingGrid` + paginering + `FilterChips` + "Bewaar zoekopdracht"-knop blijven werken.
- Desktop (`lg:`) toont resultaten en sidebar onverkort zoals nu.

Bestaande URL-sync, `parseFiltersFromURL`, `useSavedSearches`, en filter-logica blijven ongewijzigd.

## 2. Mobiele homepage (`src/pages/Index.tsx`)

Voeg direct onder de header (boven "Uitgelichte advertenties") een **compacte AI search module** toe, alleen op mobiel (`lg:hidden`):
- Sectie `py-4` met `container`.
- Korte koptekst: "Wat zoek je?" (h2, klein).
- `SmartSearchBar variant="compact"` met aangepaste placeholder: *"Ik zoek een zwarte Audi A4 automaat onder €25.000"* (placeholder via prop toevoegen aan `SmartSearchBar` — optionele `placeholder?: string`, default huidige tekst, geen breaking change).
- Kleine tekstlink eronder: "Of blader klassiek →" naar `/zoeken`.

Geen grote hero, geen achtergrondafbeelding. Desktop-hero en alle andere secties blijven ongewijzigd.

Volgorde mobiel:
1. (Header — global)
2. Compacte AI search
3. Uitgelichte advertenties
4. Features / CTA / FAQ (bestaand)

## Technische details

- `src/pages/Search.tsx`: nieuwe state `showAll`, derived `hasUserIntent`, nieuwe mobiele "intent panel" sectie boven het bestaande resultatenblok, mobiele resultaten wikkelen in `{(hasUserIntent) && (...)}` met `lg:block` fallback zodat desktop altijd resultaten toont (`<div className="hidden lg:block">` voor desktop-altijd-zichtbaar deel + `<div className="lg:hidden">{hasUserIntent && ...}</div>` voor mobiel).
- `src/modules/search/SmartSearchBar.tsx`: voeg optionele `placeholder` prop toe.
- `src/pages/Index.tsx`: nieuwe `<section className="lg:hidden ...">` direct boven de bestaande "Uitgelichte advertenties" sectie.
- Geen wijzigingen aan filterlogica, URL-sync, of desktop-layout.

## Niet in scope

- Geen wijzigingen aan `FilterPanel` internals.
- Geen aanpassingen aan analytics/conversie-tracking.
- Geen wijziging van listing-data-fetching (`useListings` blijft hetzelfde).

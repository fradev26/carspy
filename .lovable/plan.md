# Plan: wrijving op /zoeken oplossen

Testbevindingen (uit browser-acties + code-review). Twee blockers, drie polish-fixes, plus zichtbare console-warning.

## Kritieke wrijving

### 1. Filterstatus syncroniseert niet met de URL (blocker)
**Wat ik zag:** Diesel aanvinken laat 3 resultaten zien, maar de URL blijft `/zoeken` — geen `?fuelTypes=diesel`. Gevolgen: refresh wist filters, deelbare/bookmarkbare resultaten kapot, terug/vooruit knop onbetrouwbaar, en de `Bekijk resultaten`-deeplink vanuit Zoekalerts werkt enkel bij eerste mount.

**Oorzaak:** `handleFiltersChange` in `src/pages/Search.tsx` zet alleen lokale state (`setFilters`). De `parseFiltersFromURL`-effect schrijft nooit terug.

**Fix:** maak `filters` URL-driven.
- Vervang lokale `setFilters` in `handleFiltersChange` (en in `handleRemoveFilter`) door één helper `writeFiltersToURL(newFilters)` die met `setSearchParams` schrijft. Bewaar bestaande `q`, `aiIntent`, `aiQuery`, `compareWith` params.
- De bestaande `useEffect([searchParams])` updatet `filters` automatisch via `parseFiltersFromURL`, dus state blijft consistent.
- Idem voor `sortBy` → schrijf naar `?sort=`.
- Bestaande utility: `src/lib/searchFilters.ts` heeft al de parser; voeg een `serializeFiltersToParams(filters)` helper toe (volledige whitelist conform `SearchFilters`) en gebruik die in `writeFiltersToURL` en in `SearchBar.handleSearch` om duplicatie te schrappen.

### 2. Geen manier om een zoekopdracht op te slaan vanaf /zoeken (blocker)
**Wat ik zag:** Het 80/20 "Toon resultaten + Opslaan"-combo zit in `SearchBar.tsx` (hero-variant — homepage), niet in `FilterPanel`. Tijdens vorige cleanup hebben we de "Bewaar zoekopdracht"-knop uit de Search-header weggehaald. Resultaat: op `/zoeken` kan je nu nergens een Zoekalert maken.

**Fix:** zet één compact "Opslaan als zoekalert"-knop terug, maar dichter bij de filter-acties:
- In `Search.tsx` header (regel ±232-243, naast de telling/sort/grid-toggle) een `Button variant="outline"` met `Bell`-icon + label "Opslaan". Disabled als `activeFilterCount === 0`, en als niet-ingelogd → toast + redirect `/auth`.
- Dialog hergebruikt zelfde patroon als in `SearchBar.tsx` (naam-veld met suggestie uit `filters`, `useSavedSearches().save`).
- Extract de dialog naar `src/modules/search/SaveSearchDialog.tsx` zodat SearchBar (hero) én Search-header dezelfde component delen — geen duplicatie.

## Polish-wrijving

### 3. Card-hover-overlay blijft hangen na klik
**Wat ik zag:** "Bekijk deze deal"-overlay blijft op de eerste kaart staan nadat de pointer ergens anders heen ging (group-hover state stuck door focus-ring na klik).

**Fix in `src/modules/listings/ListingCard.tsx`:** beperk de overlay tot `group-hover:` zonder `group-focus-within:` (of voeg `pointer-events-none` toe op de overlay) en zorg dat hij niet triggert op `:focus-visible` van interne knoppen. Verifieer met re-screenshot.

### 4. AI-zoekbalk dupliceert filterspoor op /zoeken
**Wat ik zag:** Bovenaan de results-kolom prijkt nog de volledige `SmartSearchBar` ("Beschrijf je droomwagen") terwijl de gebruiker al midden in het filteren zit. Neemt verticale ruimte weg van resultaten.

**Fix:** comprimeer `SmartSearchBar` op `/zoeken` tot een collapsed chip (1 regel, "Vraag het de AI…") die uitklapt bij klik. `variant="chip"` toevoegen aan `SmartSearchBar`, of inline in `Search.tsx` de huidige `variant="compact"`-render vervangen door een collapsible.

### 5. "Snelle selectie"-presets zonder labels
**Wat ik zag:** 5 icon-only chips in de sidebar (zie eerste screenshot) zijn niet te interpreteren zonder hover. Op mobiel zijn ze überhaupt verborgen omdat `showPresets={false}`.

**Fix in `src/modules/search/FilterPresets.tsx`:** label naast icoon tonen vanaf `sm:` breedte, en `title`/`aria-label` op alle chips. Mobiel: presets aanzetten in de drawer/gate (`showPresets={true}` op mobiel) — ze zijn juist daar nuttig.

### 6. Console-warning `fetchPriority` (cosmetic)
**Wat ik zag:** `Warning: React does not recognize the 'fetchPriority' prop` afkomstig van `Index.tsx` (`<img fetchPriority="high">`).

**Fix:** in `src/pages/Index.tsx` vervang `fetchPriority="high"` door `fetchpriority="high"` (lowercase, native HTML attribuut) of laat het weg en gebruik `<link rel="preload">` in `index.html`.

## Technische details

- **Geen DB-migratie nodig.**
- Geen edge-function wijzigingen.
- Nieuwe util: `serializeFiltersToParams` in `src/lib/searchFilters.ts` (whitelist parallel aan `parseFiltersFromURL`).
- Nieuwe component: `src/modules/search/SaveSearchDialog.tsx` (props: `open`, `onOpenChange`, `filters`, `activeFilterCount`).
- Test-pad: na fix #1 moet `/zoeken?fuelTypes=diesel` direct 3 resultaten + aangevinkte Diesel-checkbox tonen na refresh.

## Buiten scope

- Vrije invoer/slider voor prijs/jaar/km (apart project).
- Herontwerp `FilterPanel` secties.
- Mobile gate skip-link (los voorstel later).
- Confirm op "Reset alles" (los voorstel later).

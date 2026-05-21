# Plan: SEO-geoptimaliseerde dealer-inventorypagina's

## Doel
Iedere dealer krijgt een eigen publieke pagina (`/dealer/:slug`) met een overzicht van al zijn actieve advertenties, filterbaar en SEO-vriendelijk.

## URL & routing
- Nieuwe route: `/dealer/:slug` (lazy-loaded, in `src/App.tsx`).
- Slug = kebab-case van `seller.name` (bv. `AutoWorld Amsterdam` → `autoworld-amsterdam`).
- Helper `slugify` + `findDealerBySlug` in `src/lib/dealers.ts` (gebaseerd op `mockListings` – dezelfde databron als de rest van de site).

## Nieuwe pagina: `src/pages/DealerInventory.tsx`
Layout (hergebruik bestaande modules — geen logica-duplicatie):

1. **Breadcrumb**: Home › Dealers › {Dealer naam}
2. **Dealer-header** (card):
   - Naam, badge "Geverifieerde dealer"
   - Locatie (stad/provincie), telefoonnummer, lid sinds, gem. reactietijd
   - Rating + reviewCount (sterren)
   - Aantal beschikbare auto's
3. **Filter + resultaten**: sticky `FilterPanel` zijbalk (desktop) / `Sheet` (mobiel), `FilterChips`, sorteer-select, `ListingGrid` met paginatie (24/p). Hergebruik filter-/sorteerlogica uit `Search.tsx` door die in een `useFilteredListings`-hook te tillen — alleen als de extractie klein blijft; anders direct kopiëren.
4. **CTA**: "Neem contact op" knop (start chat via bestaand messaging-systeem indien ingelogd).

## SEO / AEO
Via bestaande `SEOHead`:
- `<title>`: `{Dealer} – {N} occasions | VATUUR.`
- `meta description`: dynamisch ("Bekijk {N} tweedehands auto's bij {Dealer} in {stad}. …")
- `canonical`: `https://vatuur.be/dealer/{slug}`
- JSON-LD (array):
  - `AutoDealer` (name, address, telephone, aggregateRating)
  - `BreadcrumbList`
  - `ItemList` met de eerste ~20 listings (`@type: Vehicle`, url, price)

## Sitemap
`scripts/generate-sitemap.ts` aanmaken (predev/prebuild) of bestaande uitbreiden zodat alle unieke dealer-slugs als `<url>` worden toegevoegd. Indien er nog geen generator is, alleen de statische `public/sitemap.xml` bijwerken met de huidige mock-dealers.

## Linken naar de nieuwe pagina
- `src/pages/ListingDetail.tsx`: dealer-naam in sidebar wordt link naar `/dealer/{slug}`.
- `src/modules/listings/ListingCard.tsx`: bij dealer-listings de naam (waar getoond) klikbaar maken.
- `src/pages/DealerDashboard.tsx`: knop "Bekijk publieke pagina" → `/dealer/{eigen-slug}`.

## Bestanden
- nieuw: `src/lib/dealers.ts`
- nieuw: `src/pages/DealerInventory.tsx`
- gewijzigd: `src/App.tsx`, `src/pages/ListingDetail.tsx`, `src/modules/listings/ListingCard.tsx`, `src/pages/DealerDashboard.tsx`, `public/sitemap.xml`

## Buiten scope
- Echte dealer-tabel in DB (huidige app gebruikt mock-data; structuur blijft gelijk).
- Reviews schrijven / dealer-profiel bewerken.
- Filter-state in URL voor `/dealer/:slug` (kan in volgende iteratie als de gebruiker dat wil).

# Plan: Categorie-secties met uitgelichte advertenties

## Doel
Vervang de huidige icon-grid `CategoryGrid` door meerdere "Uitgelichte advertenties"-secties, één per categorie. Elke sectie heeft dezelfde stijl en layout als de bestaande "Uitgelichte advertenties" sectie (titel + subtitel links, "Bekijk alle" knop rechts, `ListingGrid` met 3 kolommen).

## Categorieën (4 secties, 3 cards elk)
Beperk tot 4 secties om de homepage niet te overladen:

1. **SUV's** — filter `bodyType === 'suv'` → "Bekijk alle SUV's" → `/zoeken?bodyTypes=suv`
2. **Elektrisch** — filter `fuelType === 'elektrisch'` → "Bekijk alle elektrische auto's" → `/zoeken?fuelTypes=elektrisch`
3. **Budget onder €10.000** — filter `price <= 10000 && price > 0` → "Bekijk budgetauto's" → `/zoeken?maxPrice=10000`
4. **Sportief** — filter `bodyType === 'coupe'` → "Bekijk sportieve auto's" → `/zoeken?bodyTypes=coupe`

Elke sectie toont max 3 recente listings (slice 0–3) van die categorie via de bestaande `useListings()` data (client-side filter).

## Wijzigingen

### 1. Vervang `src/components/home/CategoryGrid.tsx`
Maak hier een nieuw component `CategorySections` dat de `allListings` array (en `favorites`, `toggle`) als props ontvangt. Per categorie:
- Hetzelfde frame als de bestaande "Uitgelichte advertenties" sectie in `Index.tsx` (lines 292–334), inclusief:
  - `<section className="bg-muted/30 py-12 md:py-16">` (afwisselend `bg-background` voor visuele rust — zie hieronder)
  - Header: titel `text-2xl font-semibold` + subtitel `text-sm text-muted-foreground` + "Bekijk alle" outline button
  - `ListingGrid` met `columns={3}`
  - Skeleton fallback wanneer `loading`
  - Wanneer er minder dan 1 listing in die categorie is, verberg de sectie

Wissel achtergrond af tussen `bg-background` en `bg-muted/30` per sectie zodat ze visueel gescheiden zijn van elkaar én van de echte "Uitgelichte advertenties".

### 2. `src/pages/Index.tsx`
- Verwijder de huidige `<CategoryGrid />` op regel 291.
- Plaats `<CategorySections allListings={allListings} loading={listingsLoading} favorites={favorites} onToggle={toggle} />` **onder** de bestaande "Uitgelichte advertenties" sectie (na regel 334).
- Werk de import bij.

## Technische details
- Filtering gebeurt client-side op de al opgehaalde `allListings` (geen extra queries).
- Hergebruik `<ListingGrid>` en de bestaande skeleton block exact zoals in `Index.tsx`.
- Geen wijzigingen aan `ListingCard`, `useListings`, of backend.
- Behoud SEO/accessibility: elke sectie krijgt een eigen `<h2>`.

## Niet in scope
- De andere 4 categorieën (Hatchbacks, Sedans, Nieuw aanbod, Populair) komen niet als sectie — anders wordt de homepage te lang. Kan later toegevoegd worden indien gewenst.
- Geen aanpassing aan filter-URL semantiek of bottomnav.

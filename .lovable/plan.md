# Verkopen-pagina: van dashboard naar sales feed

Doel: de "Verkopen"-pagina (`/zakelijk/voorraad`) voelt nu als een dashboard met KPI-strip bovenaan. We halen die laag weg en verschuiven alle relevante info naar de listing card, zodat elke card een zelfstandige beslis-unit is.

## Wijzigingen in `src/pages/dealer/Inventory.tsx`

### 1. Verwijderen
- Volledige KPI-strip bovenaan (de 7 metric-tegels: Actief, Views, Favorieten, Leads, Gem. dagen in voorraad, Snelst verkopend, Prijspositie).
- Bijhorende `<Collapsible>` mobile-wrapper rond die strip.
- `useDealerAnalytics` overview-afhankelijkheden die enkel voor die strip dienden (overview blijft enkel als per-listing data het nodig heeft; anders verwijderen).
- Berekeningen die enkel de strip voedden (median views, snelst verkopend segment, prijspositie-aggregaat).

### 2. Behouden
- H1 "Verkopen", korte microcopy eronder.
- Filterzone (search + status chips + smart presets "Snel verkopen" / "Lang in voorraad" / "Hoge marge").
- Bulkbar (Premium, Boost, Verkocht, Verwijder).
- Empty state.
- Grid layout (1/2/3/4 cols responsive).

### 3. Listing card wordt de beslis-unit
Elke `DealerCard` toont compact en scanbaar:

**Altijd zichtbaar (top → bottom):**
- Foto met `StatusBadge` overlay (Beschikbaar / Gereserveerd / Verkocht / Concept).
- Titel + jaar · km · brandstof (1 regel, truncate).
- Prijs prominent (grote font).
- Margin pill rechts naast prijs (alleen indien `market_value` bekend; graceful fallback = pill weglaten).
- Subtiele meta-regel: "X dagen in voorraad · Y views · Z leads" (text-xs, text-muted-foreground).

**Acties (footer van card):**
- Primair (visueel dominant, `Button` default variant, full-width of breed):
  - `status === 'draft'` → "Bewerken" → `/verkopen?edit=:id`
  - anders → "Verkoop starten" → `/zakelijk/voorraad/:id` (ListingOperating)
- Secundair (subtiel, `Button` variant="ghost" of "link", kleiner):
  - "Vergelijk markt" → `/zoeken?...&compareWith=:id`

Bulk-select checkbox blijft top-left overlay op de foto.

### 4. UX-principes
- Geen globale metrics-laag meer; alle insight zit op de card waar de beslissing valt.
- Card hierarchy: foto → status → prijs+marge → acties. Meta (tijd/views/leads) is tertiair.
- Primaire actie krijgt visueel gewicht; secundaire is bewust ingetogen om dubbele-CTA-ruis te vermijden.
- Mobiele view: 1 kolom, card-footer-acties stacken niet — primair breed, secundair als kleine link eronder of ernaast.

## Buiten scope
- Geen wijzigingen aan `BottomNav`, `DealerLayout`, routes, of backend.
- Geen wijziging aan de smart-preset-logica (blijft op huidige views/age-heuristiek).
- Geen nieuwe analytics-velden — margin/views/leads/days komen uit bestaande `ListingAnalytics`.

## Bestanden
- `src/pages/dealer/Inventory.tsx` (enige file die wijzigt).

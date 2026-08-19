# Per-voertuig drilldown in /zakelijk/analytics (A3.4)

## Wat er nu is (geverifieerd)

- `/zakelijk/analytics` toont enkel dealer-brede aggregaten: voorraadwaarde, gem. leeftijd, prijssegment-grafiek, top-performers en slow-movers. Klikken leidt naar de bestaande beheerpagina `/zakelijk/voorraad/:id`, niet naar statistieken.
- De cijfers komen uit de edge function `dealer-analytics`, die per voertuig `views`, favorieten, gesprekken en berichten teruggeeft — allemaal als één totaalstand, zonder tijdlijn.
- Belangrijk: **de viewteller wordt nergens opgehoogd**. In de database staat `views = 0` voor alle 25 advertenties. De hele analyticspagina rust dus deels op lege data.

## Aanpak

### 1. Views effectief meten (voorwaarde voor een zinvolle drilldown)

Nieuwe tabel `listing_view_events` (listing_id, dag, sessie-hash, bron) met dagelijkse rollup, gevuld via een publieke edge function die vanaf de advertentiedetailpagina wordt aangeroepen. Dubbeltellingen worden beperkt door één view per sessie per advertentie per dag. De bestaande `listings.views`-kolom wordt door dezelfde functie mee opgehoogd, zodat huidige weergaven blijven kloppen.

### 2. Drilldownpagina per voertuig

Nieuwe route `/zakelijk/analytics/:id` met:
- Kopblok: foto, titel, prijs, status, dagen in voorraad, boost-status.
- KPI-rij: views, favorieten, gesprekken, berichten, conversieratio (leads/views).
- Tijdlijngrafiek (lijn/area, recharts) van views + leads per dag, met periodekeuze 7 / 30 / 90 dagen.
- Trechter: views → favorieten → gesprekken → berichten.
- Vergelijking met het gemiddelde van de eigen voorraad in hetzelfde prijssegment ("dit voertuig krijgt 32% minder views dan vergelijkbare wagens in je voorraad").
- Actieblok: knoppen naar bewerken, boosten en prijsvoorstel — hergebruikt de bestaande BoostDialog.
- Lege staat wanneer er nog geen meetdata is, met uitleg dat metingen vanaf nu lopen.

### 3. Overzicht koppelen aan drilldown

- Top-performers en slow-movers linken naar `/zakelijk/analytics/:id` in plaats van de voorraadpagina.
- Nieuwe tabel-sectie "Alle voertuigen" op de analyticspagina: sorteerbaar op views, leads, conversie en leeftijd, elke rij klikbaar naar de drilldown.
- Op `/zakelijk/voorraad/:id` een link "Bekijk statistieken" naar de drilldown.

### 4. Rechten

De drilldown valt onder de bestaande dealer-permissies: alleen leden van hetzelfde bedrijf met leestoegang tot de voorraad zien de cijfers; de data wordt server-side gefilterd op eigenaar, net als de bestaande analytics.

## Technische details

- Migratie: `listing_view_events` + dagelijkse rollupweergave, RLS met eigenaar-/bedrijfscheck, GRANTs voor `authenticated` en `service_role`; inserts uitsluitend via de edge function met service role (geen directe anon-insert).
- Edge functions: nieuwe `track-listing-view` (publiek, IP/sessie-rate-limited via de bestaande `ai-guard`-helpers) en uitbreiding van `dealer-analytics` met een `listingId`-modus die tijdreeks, trechter en segmentgemiddelde retourneert.
- Frontend: `src/pages/dealer/ListingAnalytics.tsx`, hook `useListingAnalytics.ts`, route in `App.tsx` (lazy), aanpassingen in `Analytics.tsx` en `ListingOperating.tsx`.
- Tests: unittests op de aggregatiehelpers (tijdreeks vullen van ontbrekende dagen, conversieberekening) en een rendertest van de drilldown met en zonder data.

## Buiten scope

Betalingen/facturatie, externe analytics (GA/GTM-koppeling), en historische reconstructie van views vóór de meting live gaat.

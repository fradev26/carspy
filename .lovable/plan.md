### Doel
1. Hernoem tablabel "Verkopen" naar "Zakelijk" in zowel de mobiele bottom-nav als de desktop dealer-header.
2. Verwijder de header-sectie bovenaan de `/zakelijk/voorraad` pagina (H1-titel, ondertitel, en "Voertuig toevoegen" knop).
3. Verwijder de smart-preset chips "Snel verkopen" en "Lang in voorraad" uit de filterzone.

### Wijzigingen

**`src/components/BottomNav.tsx`**
- Wijzig dealer-item label: `'Verkopen'` -> `'Zakelijk'`.

**`src/layouts/DealerLayout.tsx`**
- Wijzig tab label: `'Verkopen'` -> `'Zakelijk'`.

**`src/pages/dealer/Inventory.tsx`**
- Verwijder de hele header `<div>` met H1 "Verkopen", subtitle en "Voertuig toevoegen" knop.
- Verwijder de smart-presets rij met `Flame` / `TrendingDown` chips.
- Behoud filters (zoekveld + status chips), bulkbar, card-grid, empty state.
- Pas `SEOHead` title aan naar `"Zakelijk — VATUUR."`.
- Schoon ongebruikte imports op (`Flame`, `TrendingDown`, `PlayCircle`, `Plus`, `Car` indien elders niet gebruikt).
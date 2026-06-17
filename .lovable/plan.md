# Plan: drie regressies op /zoeken oplossen

## Root cause van "Filters doen niets"

Reproduceerbaar: kies "BMW" in het Merk-dropdown → URL blijft `/zoeken`, niets gebeurt. Checkboxes (Brandstof) wérken wel.

In `src/modules/search/FilterPanel.tsx` doet de Merk-Select **twee** sequentiële `onFiltersChange`-aanroepen in één handler:

```tsx
onValueChange={(v) => {
  updateFilter('brand', v === 'all' ? undefined : v);        // call 1
  if (v === 'all' || v !== filters.brand) updateFilter('model', undefined); // call 2
}}
```

Beide calls bouwen `{...filters, ...}` op met dezelfde **stale** `filters`-closure. Call 2 wint en overschrijft de URL zónder de net-gezette `brand`. Sinds filters nu URL-driven zijn is `setSearchParams` async → de tweede call ziet nooit het brand-veld → URL = leeg.

## Fix 1 — Filters werken weer (blocker)
**`src/modules/search/FilterPanel.tsx`**, brand-Select handler combineren tot één update:
```tsx
onValueChange={(v) => {
  const nextBrand = v === 'all' ? undefined : v;
  const resetModel = nextBrand !== filters.brand;
  onFiltersChange({
    ...filters,
    brand: nextBrand,
    model: resetModel ? undefined : filters.model,
  });
}}
```
Snelle grep doen naar andere Selects/handlers in FilterPanel/FilterPresets met meerdere `updateFilter`-calls in één event en hetzelfde patroon toepassen.

## Fix 2 — "Opslaan" altijd bereikbaar bij actieve filters
- **Mobile filter-gate** (`src/pages/Search.tsx`, blok `!showMobileResults && (...)`): voeg in de sticky bottom-bar een tweede knop `Opslaan als zoekalert` toe, naast/onder "Toon resultaten", zichtbaar zodra `activeFilterCount > 0`. Hergebruikt `saveGate.openSave`.
- **Mobile filter-Drawer** (`<DrawerFooter>` in zelfde bestand, rond regel 320): voeg een outline-knop `Opslaan` toe links van de "Toon X resultaten"-knop, ook gated op `activeFilterCount > 0`.
- Header-knop blijft staan voor desktop/post-gate.

## Fix 3 — "Snelle selectie" weer verbergen op mobiel
Terug naar het oorspronkelijke gedrag: `showPresets={false}` op de twee mobile-instances in `src/pages/Search.tsx`:
- regel ~165 (mobile gate)
- regel ~319 (drawer)

Desktop-sidebar blijft `showPresets` standaard `true`.

## Technische notes
- Geen DB/types-wijziging.
- Verificatie: na fix kies "BMW" → URL = `?brand=BMW`, telling daalt; check Carrosserie/Body-Select met dezelfde aanpak indien aanwezig.
- Mobile-presets: bevestig dat de chip-rij in 768px viewport niet meer verschijnt.

## Buiten scope
- Bredere refactor naar functional-update pattern in `writeFiltersToURL` (nice-to-have als andere componenten ooit batch-updaten).
- Wijzigingen aan DealerInventory (gebruikt al `showPresets={false}`).

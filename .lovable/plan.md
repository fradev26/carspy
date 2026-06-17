# Plan: mobile filter-gate gedraagt zich als beloofd

## Probleem
1. Zodra de gebruiker op mobiel **één** filter aanvinkt, verdwijnt de filter-gate en springt de pagina direct naar de resultatenlijst. Pas na klikken op **Toon alle resultaten** zouden de resultaten zichtbaar mogen worden.
2. De **Opslaan**-knop is in deze gate niet (duidelijk) zichtbaar — momenteel een klein Bell-icoon naast de primary CTA, makkelijk te missen.

## Root cause
In `src/pages/Search.tsx`:
```ts
const hasIncomingIntent =
  !!searchParams.get('q') ||
  !!searchParams.get('aiIntent') ||
  activeFilterCount > 0;        // ← deze regel dismist de gate bij elke filter
const showMobileResults = mobileResultsRevealed || hasIncomingIntent;
```
Elke filter zet `activeFilterCount > 0`, waardoor de gate dicht klapt zonder dat de gebruiker op **Toon alle resultaten** heeft geklikt.

## Fix 1 — gate alleen via expliciete CTA dismissen
- `activeFilterCount > 0` weghalen uit `hasIncomingIntent`. De gate verdwijnt dus alleen wanneer:
  - `q` of `aiIntent` in URL staat (binnenkomende intent vanuit homepage / AI-zoek), **of**
  - de gebruiker op **Toon alle resultaten** klikt (`mobileResultsRevealed = true`).
- Counter in de CTA blijft live updaten (`Toon {total} resultaten`) zodat de gebruiker feedback krijgt zonder dat de gate sluit.

## Fix 2 — Opslaan duidelijk zichtbaar in de gate
In het sticky-bottom-blok van de mobile gate de huidige icon-only Bell vervangen door een volwaardige outline-knop met label:
```tsx
<Button variant="outline" onClick={saveGate.openSave} className="w-full min-h-11">
  <Bell className="h-4 w-4 mr-2" /> Opslaan als zoekalert
</Button>
```
Plaatsing: onder de primary "Toon X resultaten"-knop en boven "Wis alle filters", zichtbaar zodra `activeFilterCount > 0`. Geen 80/20-rij meer in de gate — daar is geen ruimte voor en het label moet leesbaar zijn.

## Buiten scope
- Header/desktop save-knop (werkt al).
- Drawer-footer save-knop (al toegevoegd vorige iteratie).
- Wijzigingen aan `useSearchListings` of URL-sync (filter wordt nog steeds naar URL geschreven zodat resultaten klaarstaan zodra de gebruiker op CTA klikt — dat is gewenst).

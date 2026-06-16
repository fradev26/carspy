## Doel

De zoekbalk uit de header verwijderen — zowel de mobiele variant (regels 242-260) als de desktop-variant (regels 271-283) in `src/layouts/Header.tsx`. De prominente zoekfunctie staat al op de homepage en op `/zoeken`; in de header is ze visueel ruis.

## Wijzigingen

**`src/layouts/Header.tsx`**

1. Verwijder mobile search block (regels 242-260, het hele `{!isHomepage && (...)}`-blok inclusief `<form>`).
2. Verwijder desktop search form (regels 271-283).
3. Verwijder ongebruikt geworden code:
   - `searchQuery` state + `setSearchQuery`.
   - `handleSearch` handler.
   - `Input` en `Search` (lucide) imports als die nergens anders in dit bestand gebruikt worden.
4. Desktop nav verschuift natuurlijk naar links naast het logo — pas indien nodig `justify-between` of `gap` aan zodat het logo links en nav rechts blijft (huidige `justify-between` op de container blijft prima werken zonder middle-element).

## Wat we NIET aanraken

- De zoekbalk op de homepage (`HomepageFilters` / hero) blijft.
- De zoekpagina `/zoeken` blijft.
- BottomNav (mobiel) blijft ongewijzigd.

## Verificatie

- Vitest run (35/35 moet groen blijven).
- Preview check op `/`, `/zoeken`, `/favorieten` (mobiel + desktop): geen zoekbalk meer in header, layout intact.
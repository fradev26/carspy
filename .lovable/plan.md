# Plan: Toggle-off gedrag voor filter presets

## Probleem
De snelle-selectie preset-knoppen (Gezinswagen, Stadsauto, Elektrisch, etc.) hebben geen toggle-off gedrag. Wanneer je een preset aanklikt die al actief is, blijft deze actief in plaats van uitgeschakeld te worden.

## Oplossing
1. **FilterPresets.tsx**: Pas `onClick` aan zodat een actieve preset wordt uitgeschakeld door de bijbehorende filterwaarden op `undefined` te zetten.
2. **FilterPanel.tsx** & **HomepageFilters.tsx**: Pas `applyPreset` aan zodat `undefined` waarden in het preset-object worden behandeld als "verwijder deze filter" (via `delete`).

## Bestanden
- `src/modules/search/FilterPresets.tsx`
- `src/modules/search/FilterPanel.tsx`
- `src/modules/search/HomepageFilters.tsx`

## Impact
Alleen preset-knoppen; geen andere filter-UI wordt aangeraakt.

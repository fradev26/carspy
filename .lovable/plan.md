# Populaire merken naar hamburgermenu (mobiel)

## Doel
De sectie "Populaire merken" verdwijnt van de homepage op mobiel en komt terug als navigatie-blok in het mobiele hamburgermenu. Op desktop blijft alles ongewijzigd.

## Wijzigingen

### 1. `src/pages/Index.tsx` — sectie verbergen op mobiel
- Voeg `hidden lg:block` toe aan de `<section>` met "Populaire merken" (regel 234).
- Geen verdere wijzigingen aan layout of inhoud op desktop.

### 2. `src/layouts/Header.tsx` — merkenblok in mobiel menu
- Definieer een constante `POPULAR_BRANDS` (dezelfde 15 merken als op de homepage) bovenaan het bestand.
- In de mobiele `SheetContent` `<nav>`, na het blok "Favorieten/Berichten/Zakelijk" en vóór de `Separator` boven Privacy/Voorwaarden:
  - Voeg een sub-sectie toe met label "Populaire merken" (kleine uppercase muted text, consistent met menu-spacing).
  - Render eronder een 2-koloms grid (`grid grid-cols-2 gap-1`) met knoppen per merk.
  - Elk merk = `<button>` dat `handleMobileNav('/zoeken?brand=<merk>')` aanroept, met dezelfde styling-tokens als andere menu-items (px-3 py-2, text-sm, hover:bg-muted, rounded-md), maar compacter.
- Plaatsing identiek voor ingelogde én niet-ingelogde gebruikers.
- De bestaande `SheetContent` is al scrollbaar via Radix; bij overflow scrollt het menu vanzelf.

## Resultaat
- Mobiel: geen merken-sectie meer op de homepage; merken bereikbaar via hamburger → "Populaire merken" → directe filter-link.
- Desktop: ongewijzigd (sectie blijft op homepage).
- Geen duplicatie, geen overlay-in-overlay, consistent met bestaande menu-stijl.

# Hero viewport-gebonden maken op mobiel

## Doel
Op mobiel passen titel, zoekveld, knoppen én eerste review (sterrenrating) altijd binnen de viewport. Geen scroll nodig voor de above-the-fold actiegroep.

## Aanpak
De hero in `src/pages/Index.tsx` wordt herstructureerd als een viewport-gebonden flex column container. Geen spacing-tweaks of negatieve margins meer — de verdeling gebeurt structureel via flex.

## Wijzigingen — `src/pages/Index.tsx`

**Hero `<section>`**
- Vervang `pt-32 pb-16 lg:pt-44 lg:pb-36 min-h-[560px] sm:min-h-[620px] lg:min-h-[720px]` door:
  - `min-h-[100svh]` (small viewport height — correct voor mobiele browser-UI)
  - `flex flex-col`
  - `pt-20 pb-6 lg:pt-28 lg:pb-16` (ruimte voor fixed header; geen content-positionering)
- `-mt-14 lg:-mt-16` blijft (overlap met fixed header).

**Container binnen de hero**
- De huidige `<div className="container relative z-10">` wordt: `container relative z-10 flex flex-1 flex-col justify-between gap-4`
- Drie content-blokken als directe children:
  1. **Top** — titel + beschrijving (`<div>` rond het bestaande `max-w-3xl` blok)
  2. **Midden** — `HeroSearch` (`max-w-4xl` wrapper)
  3. **Bottom** — knoppen + trust + reviews als één `flex flex-col gap-3` groep

**Bottom groep**
- Eén wrapper `<div className="flex flex-col gap-3 items-center">` die bevat:
  - CTA knoppen grid (knoppen blijven boven)
  - Trust indicators (`hidden md:flex` blijft — op mobiel verborgen om ruimte voor review te garanderen)
  - Social proof / sterren rating (altijd zichtbaar)
- Alle bestaande `mt-*` margins op deze elementen verwijderen — spacing gebeurt via `gap-3` op de wrapper.

**Animaties & styling**
- `animate-fade-in`, `animate-fade-in-up`, kleuren, fonts, achtergrondfoto en overlay blijven ongewijzigd.
- Geen wijzigingen aan andere secties (Popular Brands, Uitgelichte advertenties, FAQ, etc.).

## Resultaat
Op mobiel verdeelt flex de drie blokken automatisch tussen header en onderkant viewport. Titel staat bovenaan, zoekveld in het midden, knoppen + sterrenrating altijd zichtbaar onderaan — zonder scroll, zonder absolute positioning, zonder margin-hacks. Op desktop blijft de hero ruim en luchtig dankzij `min-h-[100svh]` + flex distribution.

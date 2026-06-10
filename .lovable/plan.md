# Mobiel optimaliseren — voertuig-detailpagina

Doel: volledige foto's tonen zonder crop, geen horizontale scroll, alles leesbaar vanaf 320px breed.

## 1. Foto-galerij (`src/modules/listings/ImageGallery.tsx`)

- Hoofdfoto wisselt op mobiel naar `object-contain` met donkere achtergrond, zodat de volledige auto zichtbaar is (witruimte boven/onder is toegestaan).
- Desktop blijft `object-cover` voor strakke hero-uitstraling.
- Aspect ratio op mobiel naar `4/3` (i.p.v. `16/10`) zodat staande/liggende foto's voldoende ruimte krijgen; desktop blijft `16/9`.
- Image-element krijgt `max-w-full` + `h-auto` semantiek binnen de aspect-container, zodat niets buiten de container valt.
- Thumbnails-rij: `overflow-x-auto` blijft (bedoeld), maar de wrapper krijgt `max-w-full` + `min-w-0` zodat de pagina zelf niet meescrolt.
- Lightbox-knoppen blijven, maar positionering controleren op 320px (geen overlap met counter).

## 2. Detail-layout (`src/pages/ListingDetail.tsx`)

- Buitenste wrapper: `min-w-0` + `overflow-x-clip` toevoegen aan grid-kolommen zodat lange tekst de grid niet oprekt.
- Key Specs-kaarten: huidige `truncate` op de waarde wordt op mobiel afgeknipt → vervangen door `break-words` met `whitespace-normal`; bij erg lange waarden mag de kaart twee regels worden.
- Beschrijving (`<p>`): toevoegen `break-words` + `overflow-wrap: anywhere` (via util-class) en `whitespace-pre-line` behouden — geen truncate.
- Specificatie-`<dl>`-blokken (Verbruik & emissies, Garantie & inspectie, Verkoper, etc.): op mobiel naar één kolom met grid `grid-cols-[minmax(7rem,40%)_1fr]` zodat label/value netjes uitlijnen en lange waardes wrappen. `sm:` en hoger behoudt huidige 2/3-koloms layout.
- `<dd>` krijgt `break-words` / `overflow-wrap-anywhere`.
- Breadcrumb-laatste item: `truncate` blijft (bedoeld om overflow van titel te voorkomen), maar `max-w-[60vw]` zodat hij niet uit beeld valt.

## 3. Globale utility (`src/index.css`)

- Kleine utility toevoegen:
  ```css
  .break-anywhere { overflow-wrap: anywhere; word-break: break-word; }
  ```
  Gebruikt voor beschrijving + lange spec-waarden.
- Geen verdere globale `overflow-x: hidden`-regels; bestaande `overflow-x: clip` op `html,body` blijft.

## 4. Sticky sidebar / overige

- Sidebar-kaart (rechterkant desktop) ongewijzigd; op mobiel staat hij al onder de content via grid-stacking.
- Related listings grid (`ListingGrid`) ongewijzigd, maar visueel checken op 320px.

## 5. Verificatie

Na implementatie: preview testen op 320, 375, 414, 768 px:
- volledige foto zichtbaar zonder crop
- geen horizontale scrollbar
- lange beschrijving + lange spec-waarden wrappen
- specs-kaarten tonen volledige waarde

## Bestanden die wijzigen

- `src/modules/listings/ImageGallery.tsx` — object-contain op mobiel, aspect ratio, min-w-0
- `src/pages/ListingDetail.tsx` — spec-grids, dl-layout, break-anywhere op beschrijving en dd's, min-w-0 op grid-kolommen, truncate verwijderen op Key Specs
- `src/index.css` — `.break-anywhere` utility

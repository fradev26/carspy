# Visuele audit /zoeken, home, dealers, help, contact — herstelplan

Ik heb screenshots gemaakt van `/`, `/zoeken`, `/verkopen`, `/dealers`, `/help` en `/contact` op mobiel (390px), tablet (834px) en desktop (1440px), plus een automatische meting van horizontale overloop per element. Hieronder staan alleen bevestigde bevindingen.

## Bevindingen

### 1. Preset-chips "Snelle selectie" zijn onleesbaar afgekapt (desktop /zoeken)
In de sidebar staan 5 preset-knoppen in `grid-cols-5` binnen een kolom van 288px. Daardoor tonen ze enkel "S", "!", "I" — de labels zijn volledig weggevallen. Duidelijkste visuele fout van de audit.

### 2. Kaartafbeeldingen worden verkeerd bijgesneden
De carrousel gebruikt `aspect-[16/10]` met `object-cover`. Bij de huidige advertentiefoto's snijdt dat de bovenrand af, waardoor de tekst in de foto half over de kaartrand valt en er een grijze band onderaan overblijft. Zichtbaar op home, /zoeken en favorieten.

### 3. Kaarten in dezelfde rij hebben ongelijke hoogtes (home)
Kaarten met een extra badge ("Btw aftrekbaar") worden hoger dan hun buren; de kaarten rekken niet mee, dus onderranden en de knop "Vergelijk markt" liggen niet op één lijn.

### 4. Horizontale overloop op mobiel
- `/dealers`: een tabel van 527px breed in een viewport van 390px veroorzaakt zijwaarts scrollen.
- `/` (home): een carrousel-slide steekt buiten de documentbreedte.

### 5. Tekst afgekapt in de vertrouwensrij van /dealers
"Geverifieerde deal…" wordt met ellipsis afgekapt op zowel mobiel als desktop, terwijl er ruimte genoeg is.

### 6. Centrering en uitlijning
- Home mobiel: de sectiekop "Uitgelichte advertenties" breekt over twee regels naast de knop "Bekijk alle wagens" in plaats van eronder te stapelen.
- `/dealers` desktop: gecentreerde sectiekoppen tegenover links uitgelijnde statistiekkaarten; de statistiekenrij wordt bovendien onderaan afgesneden bij het scrollpunt.
- `/zoeken` tablet (834px): de mobiele filterpoort met de knop "Toon alle resultaten" overlapt de laatste filterrij, en de zwevende AI-knop overlapt het label "Verkopen" in de bottom-nav.

### 7. Reactwaarschuwing in de console
"Function components cannot be given refs" op elke pagina — cosmetisch geen effect, maar vervuilt de console; nemen we mee als opruiming.

## Aanpak

1. **Presets**: van vast `grid-cols-5` naar een responsieve wrap-rij (`flex flex-wrap` met `min-w`), zodat labels altijd leesbaar zijn; in de smalle sidebar 2 per rij, breder 3-5.
2. **Afbeeldingen**: `aspect-[4/3]` als standaard voor kaarten en `object-cover` behouden met `object-center`, zodat er geen tekst meer half wordt afgesneden.
3. **Gelijke kaarthoogtes**: kaart-root `h-full flex flex-col` geven en de metablok laten groeien, zodat de onderste actie altijd op dezelfde lijn eindigt.
4. **Overloop**: de dealer-tabel in een `overflow-x-auto`-wrapper zetten; de carrousel-slides `w-full shrink-0` met `overflow-hidden` op de track corrigeren.
5. **Tekstafkapping**: de vertrouwensrij op /dealers laten wrappen in plaats van truncaten.
6. **Uitlijning**: sectiekoppen op mobiel stapelen (`flex-col` onder `sm`), de statistiekkaarten centreren zoals hun kop, extra bodempadding onder de filterpoort en de zwevende AI-knop boven de bottom-nav positioneren.
7. **Console**: de ref-waarschuwing traceren en de betrokken component in `forwardRef` wikkelen.

## Technisch

Betrokken bestanden: `src/modules/search/FilterPresets.tsx`, `src/modules/listings/ListingImageCarousel.tsx`, `src/modules/listings/ListingCard.tsx`, `src/pages/Dealers.tsx`, `src/pages/Index.tsx`, `src/pages/Search.tsx`, `src/components/BottomNav.tsx`. Enkel presentatielaag — geen wijzigingen aan queries, hooks of backend. Na afloop draai ik dezelfde screenshot- en overloopcontrole opnieuw ter verificatie en houd ik de bestaande testsuite groen.

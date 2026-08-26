# Correcte laadstatussen op /zoeken en /auto/:id

## Wat er nu misgaat (geverifieerd)

- `src/pages/Search.tsx` toont de resultatenteller (`{total ?? pageListings.length} resultaten gevonden`) altijd, ook tijdens het laden. Omdat `total` dan `null` is en de lijst leeg, verschijnt kort "0 resultaten gevonden".
- Dezelfde teller staat in de mobiele filterknop ("Toon 0 resultaten") voordat de query klaar is.
- `src/pages/ListingDetail.tsx` toont bij laden een spinner met "Advertentie laden…" in plaats van een skeleton.
- `useListing` (in `src/hooks/useListings.ts`) houdt wel een `error` bij, maar de pagina gebruikt die niet: bij een mislukte query verschijnt "Advertentie niet gevonden", wat een fout als "bestaat niet" laat lijken.
- De skeletonkaart gebruikt beeldverhouding 16/10 terwijl de echte listingkaarten 3:2 zijn — dat geeft een kleine layout shift.

## Wat we bouwen

### /zoeken
- Resultatenteller pas tonen als de query klaar is. Tijdens laden een smalle tekst-skeleton op dezelfde plek (zelfde hoogte, geen shift).
- Mobiele knoppen ("Toon … resultaten") tonen tijdens laden een neutrale tekst in plaats van "0".
- Lege staat strikt op `!isLoading && !isError && listings.length === 0`.
- Foutstaat blijft, maar geldt ook wanneer er al eerder resultaten waren: duidelijke melding met knop "Opnieuw proberen".
- Skeletonraster houdt hetzelfde aantal kolommen en dezelfde kaartafmetingen als het echte raster.
- Filterchips en resultaat-afhankelijke teksten pas renderen zodra de bijbehorende query voltooid is.

### /auto/:id
- Nieuwe skeletonweergave die de echte detaillayout benadert: galerij (3:2), titelregel, prijsblok, kenmerkenraster en sticky zijpaneel — desktop tweekoloms, mobiel gestapeld.
- Onderscheid tussen drie eindstaten:
  - fout → "Advertentie kon niet geladen worden" + knop "Opnieuw proberen"
  - geen record → bestaande "Advertentie niet gevonden"
  - succes → huidige pagina

### Techniek
- `useListing` krijgt naast `listing`/`loading`/`error` een `refetch`, zodat "Opnieuw proberen" werkt zonder page reload.
- Skeletonkaart naar `aspect-[3/2]` om shift te vermijden; verder geen wijziging aan styling, kleuren of spacing.
- Nieuwe component `src/components/ui/skeleton-detail.tsx` voor de detailpagina-skeleton.

## Bestanden

- `src/pages/Search.tsx` — teller/gating, lege- en foutstaat
- `src/pages/ListingDetail.tsx` — skeleton + foutstaat
- `src/hooks/useListings.ts` — `refetch` in `useListing`
- `src/components/ui/skeleton-card.tsx` — aspect ratio 3:2
- `src/components/ui/skeleton-detail.tsx` — nieuw

## Verificatie

Desktop en mobiel (393px) via Playwright: hard reload op `/zoeken` en op een detailpagina, controleren dat "0 resultaten gevonden" nooit tussentijds verschijnt en dat de skeletons de eindlayout benaderen. Daarna de bestaande testsuite draaien.

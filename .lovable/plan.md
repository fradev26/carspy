# Menu verbreden en Tesla verwijderen

## Wijzigingen in `src/layouts/Header.tsx`

1. Verwijder `'Tesla'` uit de `POPULAR_BRANDS` constante (blijven 14 merken in 2 kolommen, 7 rijen).
2. Verbreed de mobiele `SheetContent` van `w-72` (288px) naar `w-80` (320px), zodat "Mercedes-Benz" volledig past zonder truncate.

## Resultaat
Mercedes-Benz volledig leesbaar; Tesla weg uit de lijst; menu blijft binnen mobiele drawer-conventies.

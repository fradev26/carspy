# Swipe-navigatie in voertuiggalerij (lightbox)

## Doel
In de fullscreen lightbox kan de gebruiker op mobiel horizontaal swipen om naar de vorige/volgende foto te gaan. Pijltjes blijven werken op desktop. Verticale paginascroll en lazy loading blijven intact.

## Aan te passen bestand
- `src/modules/listings/ImageGallery.tsx` (enige aanpassing)

## Aanpak

1. **Touch handlers op het lightbox-image-container**
   - Voeg `onTouchStart`, `onTouchMove`, `onTouchEnd` toe op de `<div>` rond de fullscreen `<img>`.
   - Track `touchStartX`, `touchStartY`, `touchEndX`, `touchEndY` via `useRef`.
   - In `onTouchEnd`: bereken `deltaX` en `deltaY`.
     - Als `Math.abs(deltaX) > 50` én `Math.abs(deltaX) > Math.abs(deltaY) * 1.5` → trigger `goToNext()` (swipe links) of `goToPrevious()` (swipe rechts).
     - Anders: niets doen (voorkomt per ongeluk wisselen bij tap/verticale gestures).
   - Drempel 50px voorkomt accidentele triggers; ratio-check zorgt dat verticale scrolls niet als swipe tellen.

2. **Voorkom dat swipen de dialog sluit**
   - Radix Dialog sluit niet op tap/swipe binnen content, dus standaard gedrag is OK.
   - `e.stopPropagation()` op `onTouchStart` van de img-container, om te voorkomen dat overlay-click-to-close getriggerd wordt tijdens een swipe-gebaar.

3. **Mobiel vs desktop**
   - Pijltjes in lightbox blijven gerenderd, maar krijgen `hidden md:flex` zodat ze op mobiel verdwijnen en swipe het overneemt.
   - Image counter (`3 / 10`) blijft ongewijzigd.

4. **Performance / smoothness**
   - Geen state updates tijdens `onTouchMove` (we lezen alleen refs) → geen re-renders → vloeiend.
   - Geen `preventDefault()` op touchmove → verticale scroll buiten de lightbox blijft mogelijk; binnen de lightbox is er toch niets te scrollen.
   - `touch-action: pan-y` via Tailwind `touch-pan-y` op de image-container, zodat de browser horizontale gestures aan ons overlaat en verticale gestures zelf afhandelt.

5. **Edge cases**
   - `goToNext` / `goToPrevious` zijn al circulair (wrap-around) — laatste → eerste, eerste → laatste werken automatisch.
   - Snelle opeenvolgende swipes werken omdat we alleen `setCurrentIndex` aanroepen, geen debounce nodig.
   - Single image: swipe-handlers blijven actief maar `validImages.length > 1` check in handler voorkomt onnodige state-updates.

## QA-checklist (na implementatie)
- 320 / 375 / 390 / 414 / 768 px portrait + landscape
- Swipe links/rechts wisselt foto onmiddellijk
- Wrap-around werkt (laatste→eerste, eerste→laatste)
- Tap op afbeelding sluit lightbox niet onbedoeld
- Verticale scroll op de detailpagina (buiten lightbox) blijft werken
- Desktop: pijltjes nog steeds zichtbaar en functioneel

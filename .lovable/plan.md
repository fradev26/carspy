## Doel
Verwijder de zwevende chatbot-popup (`ChatWidget`) volledig uit de mobiele interface. De AI-functionaliteit blijft bereikbaar via de centrale AI-knop in de bottom navigation (`AIFullscreenChat`).

## Huidige situatie
- `src/modules/chat/ChatWidget.tsx` rendert een zwevende knop + chatpanel op zowel mobiel als desktop.
- Op mobiel zit deze knop boven de bottom navigation (`bottom-[calc(5rem+...)]`).
- De bottom navigation bevat al een centrale AI-knop die `AIFullscreenChat` opent.
- Er bestaat al een `useIsMobile` hook in `src/hooks/use-mobile.tsx` (breakpoint 768px).

## Wijziging
1. **In `src/modules/chat/ChatWidget.tsx`:**
   - Importeer `useIsMobile` van `@/hooks/use-mobile`.
   - Roep de hook aan binnen de component.
   - Return `null` wanneer `isMobile === true`.
   - Bestaande desktop-gedrag (inclusief lazy-load in `AppLayout.tsx`) blijft ongewijzigd.

## Wat er niet gewijzigd wordt
- `AIFullscreenChat` en de bottom navigation AI-knop blijven intact.
- `AppLayout.tsx` hoeft niet aangepast (lazy import blijft werken voor desktop).
- Geen CSS- of animatiewijzigingen nodig; component retourneert simpelweg geen DOM op mobiel.

## Controlepunten
- Geen zwevende knop of chatpanel op mobiel.
- Geen lege ruimte of z-index conflicten.
- Bottom navigation en AI-tab blijven correct functioneren.
- Desktop: chatwidget blijft zichtbaar in de rechterbenedenhoek.
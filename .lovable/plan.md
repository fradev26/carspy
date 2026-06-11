Optimaliseer de mobiele headeruitlijning in `src/layouts/Header.tsx` zodat de iconen dichter bij het gecentreerde logo staan.

**Wat er gebeurt**
- Profielicoon (links) en berichtenicoon (rechts) worden absoluut gepositioneerd op een vaste, identieke afstand van de zijkanten (`left-3` / `right-3` binnen de `safe-x` container).
- Het VATUUR-logo blijft exact gecentreerd via `absolute left-1/2 -translate-x-1/2`.
- `ml-auto` op de berichten-container verdwijnt, zodat de iconen nooit visueel verschuiven door badges of contentbreedtes.
- Touch targets blijven `h-11 w-11` (44 px).
- iOS-safe areas blijven behouden via de bestaande `safe-x` op de container.

**Controle**
- Preview op mobiel bekijken om symmetrie en spacing te verifiëren.
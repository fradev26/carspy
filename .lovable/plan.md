## Doel
Maak de profiel- (linksboven) en berichten- (rechtsboven) iconen in de mobiele header visueel en interactief gelijk aan de favoriet- en vergelijk-knoppen op de listingcards.

## Huidige situatie
**Header-iconen** (mobiel):
`h-10 w-10 rounded-xl bg-muted/60 text-foreground hover:bg-muted active:bg-muted/80 transition-colors`

**Listingcard knoppen**:
`h-9 w-9 rounded-md bg-card/90 text-accent (of text-primary) backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground`

## Wijziging in `src/layouts/Header.tsx`
Vervang de className van beide mobiele header-iconen (Sheet trigger met `User` + berichten-button met `MessageCircle`) door dezelfde stijl als de listingcard buttons:

```
h-9 w-9 rounded-md bg-card/90 text-accent backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground active:scale-95
```

- Behoud `relative` + de bestaande badge-positionering voor `unreadCount` (mogelijk badge-positie iets aanpassen ivm `h-9 w-9` ipv `h-10 w-10`).
- Behoud iconen, aria-labels, klikgedrag en sheet/navigate-logica.
- Pas eveneens het `h-10 w-10` placeholder-blokje aan naar `h-9 w-9` zodat het centrale logo niet verschuift.

## Resultaat
Profiel- en berichteniconen voelen als dezelfde premium "floating button" als favoriet/vergelijk: lichte kaartachtergrond, blur, schaduw, en bij hover schalen ze naar 110% met primary fill — consistente vormtaal door de hele app.
## Mobiele header herstructureren

### Doel
Een mobiele header met het VATUUR-logo perfect gecentreerd, een profielknop linksboven en een aparte berichtenknop rechtsboven. Berichten verdwijnt uit het profielmenu om dubbele navigatie te vermijden.

### Layout

```text
[Profiel]            VATUUR.            [Berichten]
```

### Aanpassingen in `src/layouts/Header.tsx`

**1. Mobiele header (`<div className="lg:hidden">`)**
- Vervang de huidige `flex justify-between` structuur door een `relative` container met absolute centrering van het logo:
  - `<div className="container relative flex h-14 items-center safe-x">`
  - Logo: `<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Logo size="lg" asLink /></div>`
  - Links: profielknop (Sheet trigger, huidige `User`-icoon).
  - Rechts (`ml-auto`): nieuwe berichtenknop als `<Link to="/berichten">` met `MessageCircle`-icoon en ongelezen-badge (rode dot zoals huidige profiel-indicator, of `UnreadBadge` voor count).
- Beide knoppen behouden `Button variant="ghost" size="icon"` (40px standaard; uitbreiden naar `h-11 w-11` voor 44px touch target).
- Toon de berichtenknop alleen wanneer `user` ingelogd is; bij uitgelogde gebruiker blijft de rechterzijde leeg (logo blijft gecentreerd dankzij absolute positioning).

**2. Profielmenu (Sheet content)**
- Verwijder de "Berichten"-knop uit de navigatielijst in de SheetContent.
- Verwijder de gerelateerde rode notificatiedot op de profielknop (badge zit nu op de berichtenknop zelf).
- `useUnreadMessages` blijft nodig voor de nieuwe berichtenknop.

**3. Desktop header**
- Geen wijzigingen. Berichten blijft daar als aparte knop bestaan zoals nu.

### Technische details
- Absolute centrering garandeert dat badges of icoonbreedte het logo niet verschuiven.
- `safe-x` blijft behouden voor iOS notch/safe area.
- `h-14` headerhoogte ongewijzigd, consistent met bottom nav.
- Touch targets: icon buttons krijgen `h-11 w-11` (44×44px).

### Acceptatie
- Logo perfect gecentreerd, ingelogd of niet, met of zonder ongelezen badge.
- Profielknop linksboven opent de bestaande Sheet.
- Berichtenknop rechtsboven navigeert naar `/berichten` en toont ongelezen badge.
- "Berichten" verwijderd uit het profielmenu.
- Werkt op 320px+ zonder overlap; tablet/desktop ongewijzigd.
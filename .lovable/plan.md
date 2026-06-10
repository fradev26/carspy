## Optimalisatie mobiel accountmenu

### Analyse
- `POPULAR_BRANDS` (regels 30-34) wordt alleen gebruikt in de mobiele Sheet (regels 121-131 voor ingelogd, 151-161 voor uitgelogd). Geen andere afhankelijkheden.
- `Menu` icoon van `lucide-react` wordt alleen gebruikt als hamburger-trigger (regel 88). Kan vervangen worden door bestaande `User` import.
- Desktop-navigatie staat in een apart blok (`lg:flex`) en blijft volledig ongewijzigd.

### Wijzigingen

1. **Verwijder "Populaire merken" sectie**
   - Verwijder beide `Populaire merken` blokken uit de mobiele Sheet (ingelogd + uitgelogd pad).
   - Verwijder de `POPULAR_BRANDS` constant (regels 30-34) — geen externe verwijzingen.

2. **Vervang hamburger icoon door profiel icoon**
   - Vervang `<Menu className="h-5 w-5" />` door `<User className="h-5 w-5" />` (al geïmporteerd).
   - Behoud de ongelezen-indicator (rode dot) op het icoon voor ingelogde gebruikers.
   - Pas `aria-label` aan naar profiel-gerichte tekst.

3. **Herorden menu-items**
   - Voor ingelogde gebruikers:
     1. Mijn advertenties
     2. Berichten (met `UnreadBadge`)
     3. Favorieten
     4. Zakelijk Dashboard (dealer only, indien aanwezig)
     5. Separator
     6. Privacybeleid
     7. Algemene voorwaarden
     8. Separator
     9. Uitloggen
   - Voor uitgelogde gebruikers: alleen "Inloggen / Registreren", separator, Privacybeleid, Algemene voorwaarden (geen merken).

4. **Badge-behoud**
   - Ongelezen dot blijft op het `SheetTrigger` icoon.
   - `UnreadBadge` blijft naast "Berichten" in het menu.

5. **UX-afwerking**
   - Verwijder overtollige separators waar de merkenlijst tussen stond.
   - Controleer spacing zodat alle primaire acties binnen één schermhoogte passen zonder scroll.

### Niet in scope
- Desktop navigatie, zoekbalk, transparante header-logica, bottom navigation.
- `isDealer` conditional wordt ongewijzigd meegenomen.

### Bestand
- `src/layouts/Header.tsx` — alleen het mobiele Sheet-blok (regels ~85-173).
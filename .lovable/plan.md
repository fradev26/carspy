### Doel
De profiel- en berichteniconen in de mobiele header staan momenteel te dicht bij het gecentreerde VATUUR-logo. Ze worden subtiel naar de schermranden verplaatst om een rustiger, premium driedelingsbeeld te creëren.

### Wijziging
- **Bestand:** `src/layouts/Header.tsx`
- **Aanpassing:** Wijzig de absolute horizontale offset van beide iconen van `left-8` / `right-8` naar `left-6` / `right-6`.
- Het logo blijft onveranderd absoluut gecentreerd (`left-1/2 -translate-x-1/2`).
- Badges, notificaties en touch-targets (44×44 px) blijven intact.

### Visueel resultaat
```text
[Profiel]        VATUUR        [Berichten]
```
De iconen schuiven ~8 px per kant naar buiten, wat ongeveer een derde terug is richting de oorspronkelijke randpositie. Dit geeft een betere visuele balans zonder uitgestreken of samengedrukt te ogen.
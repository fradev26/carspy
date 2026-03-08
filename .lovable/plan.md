

## Plan: Fix visuele kleurmismatches in de desktop header

### Probleem
Op de homepage (vóór het scrollen) is de header transparant over een donkere hero-afbeelding. De desktop navigatieknoppen gebruiken `text-foreground` (donkere tekst), waardoor ze onzichtbaar zijn op de donkere achtergrond. De zoekbalk gebruikt `bg-muted` en `text-foreground`, wat eveneens niet leesbaar is. Op mobiel is dit al correct opgelost met `text-white` op het hamburgericoon, maar op desktop ontbreekt deze logica.

### Wijzigingen — `src/layouts/Header.tsx`

1. **Desktop navigatieknoppen**: Conditioneel `text-white hover:bg-white/10` toepassen wanneer `isTransparent`, anders `text-foreground hover:bg-muted` behouden. Dit geldt voor:
   - "Zoeken" knop
   - "Favorieten" knop
   - "Berichten" knop
   - "Account" knop
   - "Inloggen" knop

2. **Desktop zoekbalk**: Wanneer `isTransparent`, styling aanpassen naar transparante/glass look: `bg-white/10 border-white/20 text-white placeholder:text-white/60`. Na scrollen terug naar de huidige stijl.

3. **Zoek-icoon**: Conditioneel `text-white/60` wanneer transparant, anders `text-muted-foreground`.

Geen andere bestanden of backend-wijzigingen nodig.


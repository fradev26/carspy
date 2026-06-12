## Doel
Het AI-centrumknopje in de bottom navigation van een cirkel (`rounded-full`) omzetten naar dezelfde afgeronde rechthoek/pill-vorm (`rounded-xl`) als de actieve navigatietabs.

## Huidige situatie
- Het AI-knopje gebruikt een cirkelvormige container: `w-12 h-12 -mt-2 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30`
- De actieve tabs gebruiken een pill-vormige container: `rounded-xl` met liquid-glass styling

## Wijziging
In `src/components/BottomNav.tsx`, aanpassen van de AI-knop container:
- Vervang `rounded-full` door `rounded-xl`
- Behoud `bg-primary`, `text-primary-foreground` en de schaduw
- Behoud bestaande afmetingen (`w-12 h-12`) en `-mt-2` offset
- Behoud icoon (`Sparkles`), label en klikgedrag

## Resultaat
Het AI-knopje staat visueel in lijn met de vormtaal van de actieve bottomnav-tabs, zonder dat de herkenbare primaire kleur en het accentvermogen verloren gaan.
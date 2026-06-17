## Context
Op `/zakelijk/*` (dealer-portaal) staat in de header een outline-knop "Wagen verkopen". De gebruiker wil:
1. Deze knop verwijderen uit de header (zoals getoond op de screenshot).
2. Een primaire, gevulde knop "Auto verkopen" toevoegen die op **mobiel** onderaan het scherm verschijnt, **boven de bottom navigation**, zonder overlap.

## Aanpassingen

### 1. Header (`src/layouts/DealerLayout.tsx`)
- Verwijder de `<Button asChild … Wagen verkopen>` sectie uit de header (regels 26-30).
- Behoud overige header-elementen (logo, dealer-naam, tabs).

### 2. Sticky bottom CTA
- Plaats een sticky bottom-bar **alleen op mobiel** (`lg:hidden`) binnen het `DealerLayout`, direct boven de `<main>` of als sibling binnen de layout-root.
- Gebruik een primaire `<Button>` (`variant="default"`) met label "Auto verkopen", gelinkt naar `/verkopen`.
- Styling:
  - `sticky bottom-0` of `fixed bottom-20` (afhankelijk van hoogte bottom nav) zodat hij **niet overlapt** met de bestaande bottom navigation.
  - `w-full` met padding `px-4 py-3`.
  - Achtergrond: `bg-background` of een subtiele gradient/achtergrond zodat content erachter leesbaar blijft tijdens scroll.
- De knop is **niet zichtbaar op desktop** (`hidden lg:flex` of vergelijkbaar).

### 3. Afstemming bottom-nav
- Controleer de hoogte/padding van de bestaande mobiele bottom navigation zodat de nieuwe CTA exact erboven komt (geen visuele overlap).
- Indien nodig: voeg `pb-20` toe aan `<main>` (of vergelijkbaar) zodat scrollbare content niet achter de sticky knop verdwijnt.

## Geen andere wijzigingen
- Desktop header en navigatie blijven ongewijzigd.
- Alle `/zakelijk/*` routes behouden hun huidige functionaliteit.
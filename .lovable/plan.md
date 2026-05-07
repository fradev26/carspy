## Fix: Hero search toggle centering

De `TabsList` in `src/modules/search/HeroSearch.tsx` heeft nu `grid w-full max-w-md grid-cols-2` zonder centrering, waardoor hij links uitlijnt. Daarnaast staat het label "Zoek jouw auto" in `Index.tsx` links uitgelijnd, wat de visuele groep breekt.

### Wijzigingen

**`src/modules/search/HeroSearch.tsx`**
- Wrapper `div` rond de `Tabs` met `flex flex-col items-center w-full`.
- `TabsList` krijgt `mx-auto` toegevoegd zodat de segmented control horizontaal centreert binnen de hero container, op alle breakpoints (mobile/tablet/desktop).
- `TabsContent` panels behouden volle breedte (`w-full`) zodat de zoekbalk eronder netjes uitgelijnd blijft met de toggle.

**`src/pages/Index.tsx`**
- Het label "Zoek jouw auto" boven `<HeroSearch />` wordt `text-center` (was links via `ml-1`), zodat de volgorde Titel → Subtitel → (label) → Toggle → Zoekbalk → Suggesties één gecentreerde visuele groep vormt.
- De `HeroSearch` wrapper container blijft `max-w-4xl mx-auto` (al aanwezig).

### Acceptance check
- Toggle staat exact onder headline/subtext gecentreerd op 375px, 768px en 1280px+.
- Geen horizontale offset meer; Slim en Klassiek tab geven identieke layout.
- Zoekbalk blijft uitgelijnd met de toggle erboven.

Geen logica, routing, of backend changes.
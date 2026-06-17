## Wijzigingen

1. **`src/layouts/DealerLayout.tsx`**
   - Vervang de "Voertuig toevoegen" knop (rechtsboven, met Plus icoon) door een "Instellingen" knop met Settings-icoon, linkend naar `/zakelijk/instellingen`.
   - Verwijder de `Plus` import uit lucide-react (indien niet elders gebruikt).

2. **`src/components/BottomNav.tsx`**
   - Verwijder `{ icon: Settings, label: 'Instellingen', path: '/zakelijk/instellingen' }` uit de `moreLinks` array.
   - `Settings` import blijft staan want andere delen van de code gebruiken het mogelijk.

## Resultaat
- Desktop: instellingen bereikbaar via header-knop naast merknaam.
- Mobiel: instellingen bereikbaar via een directe tab in de bottom-nav (toekomstig idee) of via de header op desktop; voor nu verdwijnt het uit "Meer".
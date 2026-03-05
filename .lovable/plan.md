

## Plan: Verwijder ".?" uit alle teksten

### Probleem
De merknaam "VATUUR." eindigt op een punt. Wanneer deze in een vraagzin staat, ontstaat ".?" — wat er vreemd uitziet.

### Gevonden locaties (2 bestanden, ~10 voorkomens)

**`src/pages/Index.tsx`** (FAQ-sectie):
- "Is VATUUR. gratis te gebruiken?" → "Is VATUUR gratis te gebruiken?"
- "Kan ik auto's vergelijken op VATUUR.?" → "Kan ik auto's vergelijken op VATUUR?"
- "In welke regio's is VATUUR. actief?" → "In welke regio's is VATUUR actief?"
- "Waarom VATUUR.?" → "Waarom VATUUR?"
- Antwoorden met "VATUUR." midden in een zin blijven ongewijzigd (punt fungeert als deel van de merknaam)

**`public/llms.txt`**:
- "Wat is VATUUR.?" → "Wat is VATUUR?"

### Aanpak
Alleen de punt verwijderen wanneer "VATUUR." direct gevolgd wordt door een vraagteken. Overige vermeldingen (bijv. "VATUUR. is een...") blijven intact.


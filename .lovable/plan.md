## Hero zoekbalk opschonen — chips weg, clean search-first

Doel: rustigere hero, één duidelijke input + CTA, geen visuele ruis onder de zoekbalk.

### Wijziging in `src/modules/search/SmartSearchBar.tsx`

**Verwijderen:**

- Volledige `{variant === 'hero' && (...)}` blok met:
  - "Voorbeelden:" label
  - De 4 chip-buttons (`rounded-full border ... px-3 py-1`)
  - De `EXAMPLES` array (4 items) en bijbehorende click-handlers

**Vervangen door** een subtiele inline tekstregel onder de bar (alleen `variant === 'hero'`):

- Max 3 voorbeelden, als platte tekst gescheiden door `·`
- Geen knoppen, geen borders, geen pills — niet klikbaar
- Klein, licht grijs (`text-xs text-white/60`), gecentreerd, `mt-3`

```text
Bijvoorbeeld: "Zuinige gezinswagen automaat" · "Elektrische auto lage km-stand"
```

(Op mobiel breekt de regel natuurlijk; geen horizontale scroll.)

### Wat blijft

- De zoekbalk zelf, het Sparkles-icoon, "Vind mijn auto" CTA — ongewijzigd.
- Trust-strip, sociale proof en "Auto verkopen?"-link in `Index.tsx` — ongewijzigd.
- "Liever filters gebruiken? →" link in `HeroSearch.tsx` — ongewijzigd.

### Resultaat

- Geen chip-buttons, geen AI-suggestie-tags, geen dynamische variaties.
- Eén primaire focus: input + "Vind mijn auto".
- Voorbeelden blijven als rustige inspiratie zichtbaar, zonder af te leiden.

### Bestanden

- `src/modules/search/SmartSearchBar.tsx` — chips-blok verwijderen, statische voorbeeldregel toevoegen.

Geen andere bestanden, geen routing/backend changes.
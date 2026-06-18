Optimaliseer de volledige filterervaring op `/zoeken`. Behoud huisstijl, sectie-structuur en URL-state synchronisatie. Werk uitsluitend in `src/modules/search/FilterPanel.tsx`, `src/modules/search/FilterChips.tsx`, `src/types/listing.ts`, `src/lib/searchFilters.ts` en een nieuwe utility/component voor numerieke invoer. `HomepageFilters.tsx` blijft buiten scope (homepage), tenzij type-wijzigingen TS-fouten geven — dan minimaal bijwerken.

## 1. Nieuwe numerieke invoercomponent

Maak `src/components/ui/number-input.tsx`:
- Wrapper rond `Input` met `inputMode="numeric"`, `pattern="[0-9]*"`, autocomplete off.
- Props: `value?: number | undefined`, `onValueChange(n: number | undefined)`, `placeholder`, `prefix` (bv. `€`), `suffix` (bv. `km`, `pk`), `min`, `max`, `groupThousands?: boolean` (default true).
- Live-formatting: tijdens typen worden niet-cijfers verwijderd en duizendtallen met punt-/spatie-scheidingsteken (Nederlands `nl-NL.toLocaleString`) getoond. Lege string → `undefined`.
- Suffix/prefix als visuele addon binnen het input (rechts/links, `pointer-events-none`).
- Min hoogte `h-12` (≥44 px), `text-base` om iOS-zoom te vermijden.

## 2. Type- en optie-uitbreidingen (`src/types/listing.ts`)

- `OnlineSince`: vervang door `'today' | '3d' | '7d' | '14d' | '30d' | '30d+'`.
- `ONLINE_SINCE_OPTIONS`: Vandaag / Afgelopen 3 dagen / Afgelopen 7 dagen / Afgelopen 14 dagen / Afgelopen 30 dagen / Langer dan 30 dagen.
- `COLOR_OPTIONS`: uitbreiden naar volledige lijst incl. Zilver, Crème, Goud, Roze, Turquoise, Bordeaux, Tweekleurig, Overig. Voeg `hex` toe als gestructureerd object `{ value, label, hex }` om kleurchips te kunnen renderen (Tweekleurig/Overig krijgen gradient/neutral fallback).
- `SearchFilters.interiorColors` is al aanwezig — wordt nu in UI ontsloten.
- `minWarranty` / `WarrantyOption` / `WARRANTY_OPTIONS` markeren als deprecated maar niet verwijderen (back-compat met URL); UI weggehaald.
- Map mileage in queries: behandel `minMileage === 0` als "geen ondergrens" (al impliciet) en `maxMileage === 0` ook als "geen bovengrens" — toepassen in `useSearchListings` (`maxMileage > 0`).
- Mapping `useSearchListings` voor nieuwe OnlineSince-waarden: today=1d, 3d, 7d, 14d, 30d, 30d+ (=`lt` op cutoff).

## 3. Serialisatie (`src/lib/searchFilters.ts`)

- `onlineSince`: parse/serialize de nieuwe set (string cast volstaat).
- Voeg `interiorColors` toe (array, comma-separated zoals `colors`).
- `minWarranty` blijft parsable maar wordt niet meer in UI gezet.

## 4. FilterPanel-herschrijving (`src/modules/search/FilterPanel.tsx`)

Globale visuele update binnen huidige huisstijl:
- Sectiekoppen `text-base` (was `text-sm`), padding `py-4`, hit-area volle breedte.
- Labels `text-sm` (was `text-xs`), `font-medium`, niet meer uppercase tracking.
- Checkbox: vergroot via wrapper-klasse naar `h-5 w-5`, label `text-base`, rij heeft `min-h-11 py-2` voor 44 px hit-target.
- Verticale spacing tussen velden: `space-y-5`.
- Sectie-spacing: `border-border/60`, `gap-3`.

Per filter:

**Basis**
- Prijs: 2 × `NumberInput` met `prefix="€"`, placeholders "Min" / "Max", `min={0}`.
- Bouwjaar: 2 × `NumberInput` met `min={1950}`, `max={currentYear+1}`, placeholders "Van" / "Tot", `groupThousands={false}`. Validatie: clamp on blur naar geldig bereik.
- Kilometerstand: 2 × `NumberInput` met `suffix="km"`. Helper-tekst onder veld: "Laat leeg voor geen bovengrens." `0` en leeg gedragen identiek (serialisatie laat 0 weg).
- Brandstof / Carrosserie: bredere grid op desktop (`grid-cols-2`), grotere klikvlak rijen.

**Aandrijving & Prestaties**
- Vermogen: 2 × `NumberInput` met `suffix="pk"`.
- Transmissie/Aandrijving: zelfde checkbox-vergroting.

**Uiterlijk & Interieur**
- Exterieurkleur: grid `grid-cols-4 sm:grid-cols-5` met kleurchips: ronde swatch (`h-9 w-9 rounded-full border`) + label eronder of ernaast; geselecteerd → `ring-2 ring-primary`. "Tweekleurig" → conic-gradient, "Overig" → grijze swatch met diagonale streep.
- Interieurkleur: identieke kleurchip-grid op `filters.interiorColors`.

**Praktisch** — ongewijzigd, alleen visueel groter.

**Locatie & Timing**
- Online sinds: vervang door horizontale segmented chips (radio-stijl) — Vandaag / 3 dagen / 7 dagen / 14 dagen / 30 dagen / 30 dagen+. Component: knoppenrij met `flex flex-wrap gap-2`, actieve knop `bg-primary text-primary-foreground`.

**Historiek & Zekerheid**
- "Minimale garantie" sectie verwijderen (UI + section count).
- Vorige eigenaren: vervang Select door chip-rij met `0`, `1`, `2`, `3`, `4+` (waarde `4` betekent `maxPreviousOwners = 4`); 0 → 1e eigenaar mapping behouden (`0` betekent geen vorige eigenaren). Werkt via dezelfde `maxPreviousOwners` field.

**Opties & Extra's** — ongewijzigd, alleen visueel groter.

Toegankelijkheid: alle nieuwe inputs krijgen `aria-label` + zichtbare label, chip-knoppen `role="radio"` binnen `role="radiogroup"`.

## 5. FilterChips

- Tag voor interieurkleur (`interiorColors`) toevoegen met label "Interieur: {kleur}".
- Tag voor nieuwe OnlineSince labels (label komt uit `ONLINE_SINCE_OPTIONS`).
- Verwijder garantie-chip (mag blijven voor back-compat met URL, maar zonder UI is hij niet meer triggerbaar — laat code staan).

## 6. Search-pagina (`src/pages/Search.tsx`)

- `handleRemoveFilter`: voeg `'interiorColors'` toe aan `arrayKeys`.
- Geen layout-wijzigingen verder; sticky CTA op mobile blijft "Toon {n} resultaten".

## 7. Mobiele afronding

- Vermijd horizontaal scrollen: ranges (Prijs/Jaar/KM/Vermogen) gebruiken `grid grid-cols-2 gap-3` i.p.v. flex met em-dash.
- Alle inputs `text-base`, `h-12`, full-width.
- Drawer-content houdt onveranderd `overflow-y-auto px-4 py-4`.

## Technische details

- Geen DB/edge-functie wijzigingen vereist; alleen client.
- `useSearchListings` aanpassen voor `maxMileage > 0` guard en uitgebreide OnlineSince cutoffs (dagen-mapping via switch).
- `HomepageFilters.tsx` raakt OnlineSince-type aan: voer dezelfde uitbreidende waarden door zodat TS niet breekt; UI blijft daar visueel onveranderd, behalve dat de Select de nieuwe opties toont (acceptabel, scope-light).
- Backwards-compat: oude URL-waarde `24h` mappen we tijdens parsing naar `today` zodat opgeslagen zoekopdrachten blijven werken.

```text
Sidebar (desktop)               Drawer (mobile)
┌───────────────┐               ┌────────────────────┐
│ Filters    [n]│               │ Filters     [n act]│
│ ──────────── │               │ ──────────────────│
│ Basis      ▾  │               │ ▾ Basis            │
│   Merk        │               │   ...              │
│   Prijs €min  │               │ ▾ Aandrijving      │
│   Prijs €max  │               │ ▾ Uiterlijk        │
│   Jaar van/tot│               │   ⬤⬤⬤⬤⬤ kleurchips │
│   KM min/max  │               └────────────────────┘
│ Aandrijving ▸ │               sticky: [Toon n resultaten]
│ Uiterlijk   ▾ │
│   Kleurchips  │
│   Interieur   │
│ Praktisch   ▸ │
│ Locatie     ▾ │
│   [Vandaag][3d][7d][14d][30d][30d+]
│ Historiek   ▾ │
│   Eigenaren: [0][1][2][3][4+]
│ Opties      ▸ │
└───────────────┘
```

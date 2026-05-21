# Fix overlap logo ↔ herotitel (mobiel)

## Probleem
Op mobiel zit het transparante logo "VATUUR." (h-14 header, ~56px) visueel te dicht op de herotitel. Door `pt-20` (80px) blijft er maar ~24px tussen header-bottom en titel — dat voelt als overlap, zeker met text-2xl titel.

## Oplossing — `src/pages/Index.tsx` (alleen mobiel, `lg:` blijft ongewijzigd)

### 1. Hero top padding (regel 169)
- `pt-20` → `pt-24` op mobiel (24px → 40px ademruimte onder het logo)
- `pb-6` blijft

### 2. Titel (regel 192)
- `text-2xl` → `text-xl` op mobiel (strakker gezet, compenseert extra top padding)
- Desktop `md:text-5xl lg:text-6xl` blijft

### 3. Beschrijving (regel 195)
- `mt-2` → `mt-1.5` op mobiel
- `text-sm` blijft

### 4. HeroSearch container (regel 201)
- `mt-4` → `mt-3` op mobiel

### 5. CTA-knoppen (regel 206)
- `mt-3` blijft

### 6. Social proof (regel 240)
- `mt-3` → `mt-2` op mobiel

## Resultaat
- Duidelijke scheiding tussen logo en titel (~40px ademruimte).
- Totale verticale winst door compactere titel/spacing compenseert de extra top padding, dus knoppen + eerste review blijven binnen 780px viewport.
- Hero-achtergrond, hoogte (`min-h-0` op mobiel) en desktop layout ongewijzigd.
- Geen absolute positioning, geen negatieve margins toegevoegd.

# Above-the-fold compressie op mobiel

## Doel
Op mobiel (iPhone-hoogte ~780px) moet alles binnen één viewport zichtbaar zijn: titel, beschrijving, zoekveld, CTA-knoppen én de eerste review. De hero zelf (achtergrond, positie) verandert niet — alleen interne spacing en de hoogte op mobiel.

## Wijzigingen — `src/pages/Index.tsx`

Alle wijzigingen gelden enkel op mobiel (`< lg`). Desktop (`lg:`) blijft exact zoals nu.

### 1. Hero sectie (regel 169)
- `pt-32 pb-16` → `pt-20 pb-6` (compacter top/bottom padding mobiel)
- `min-h-[560px] sm:min-h-[620px]` → `min-h-0 sm:min-h-0` (hero mag krimpen tot zijn content op mobiel, zodat reviews-sectie omhoog komt)
- Desktop `lg:pt-44 lg:pb-36 lg:min-h-[720px]` blijft ongewijzigd

### 2. Titel (regel 192)
- `text-3xl` → `text-2xl` op mobiel (md/lg ongewijzigd)

### 3. Beschrijving (regel 195)
- `mt-3` → `mt-2`
- `text-base` → `text-sm` op mobiel
- Desktop `lg:mt-5 lg:text-lg` blijft

### 4. HeroSearch container (regel 201)
- `mt-6` → `mt-4`
- Desktop `lg:mt-10` blijft

### 5. CTA-knoppen container (regel 206)
- `mt-3` → `mt-3` (al compact, blijft)
- Knop-grootte op mobiel verkleinen: voeg `h-11` toe i.p.v. `size="lg"` standaard h-11 → blijft, maar `text-base` → `text-sm` op mobiel

### 6. Trust indicators (regel 225)
- Reeds `hidden md:flex` → blijft verborgen op mobiel, geen impact

### 7. Social proof / reviews (regel 240)
- `mt-4` → `mt-3` op mobiel

## Resultaat
Op een iPhone-viewport (~390×780) past de volledige hero-content + de top van de "Populaire merken / Uitgelichte advertenties"-sectie waar de eerste review (uitgelichte advertentie-kaart) zichtbaar wordt zonder scroll. Hero-achtergrond en compositie blijven intact; desktop blijft volledig ongewijzigd.

## Technische notities
- Geen absolute positioning, alles via Tailwind responsive utilities (mobile-first met `lg:` overrides).
- `min-h-0` op mobiel zorgt dat de hero zich aanpast aan zijn content i.p.v. een vaste minimum-hoogte af te dwingen.
- De "eerste review" wordt geïnterpreteerd als de eerste kaart in "Uitgelichte advertenties" (social proof block). De inline 4.8/5-sterrenrating blijft uiteraard in de hero zichtbaar.

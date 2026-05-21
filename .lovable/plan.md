# Hero compacter: alles above-the-fold op mobiel

## Doel
Zoekveld, CTA-knoppen en review-blok moeten zonder scrollen zichtbaar zijn op een 390x777 mobiele viewport (rekening houdend met fixed header ~56px en bottom nav ~80px → bruikbare hoogte ≈ 640px).

## Wijziging
Eén bestand: `src/pages/Index.tsx`, hero-`<section>` op regel 144 en zijn binnenmarges.

### 1. Section-padding compacter
Huidig: `pt-32 pb-16 lg:pt-44 lg:pb-36 min-h-[560px] sm:min-h-[620px] lg:min-h-[720px]`
Nieuw: `pt-20 pb-8 lg:pt-32 lg:pb-24 min-h-[calc(100vh-80px)] sm:min-h-[620px] lg:min-h-[720px]`
- Mobiel: kleinere top/bottom padding, en `min-h` = viewport minus bottom nav, zodat de hero exact één scherm vult.
- Desktop ongewijzigd kwalitatief (iets minder pt).

### 2. Verticale centrering met lichte bovenbias
Wrap de bestaande container-inhoud in een flex-kolom die ze rond ~40% verticaal centreert via `justify-center` + extra `pb` op de section, of pas een interne flex toe op de section.
Concreet: zet op de section ook `flex flex-col justify-center` zodat de inhoud verticaal gecentreerd staat binnen de min-h.

### 3. Spacing tussen blokken verkleinen op mobiel
- Titel `<h1>`: `text-2xl` op mobiel (was `text-3xl`) zodat hij compacter blijft; `md:text-5xl lg:text-6xl` ongewijzigd.
- Paragraaf: `mt-2` (was `mt-3`), `text-sm` op mobiel (was `text-base`).
- HeroSearch-wrapper: `mt-4` (was `mt-6`).
- CTA-knoppen: `mt-4` (was `mt-6`).
- Social proof (reviews): `mt-4` ongewijzigd, maar zorg dat de trust indicators (hidden op mobiel via `hidden md:flex`) onveranderd blijven zodat ze geen mobiele ruimte nemen.

### 4. Geen overlap met bottom nav
De bestaande `AppLayout` voorziet al `pb-20` waar nodig. De hero zelf is geen scroll-container — door `min-h-[calc(100vh-80px)]` blijft alles binnen het zichtbare deel.

Geen wijzigingen aan andere secties of business logic.

## Resultaat
Op mobiel (390x777) zijn titel, zoekveld, beide knoppen én het sterren-reviewblok direct zichtbaar zonder scrollen, met de inhoud licht boven het midden gepositioneerd.

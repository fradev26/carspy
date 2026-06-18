Voeg een lichte, in-card foto-swiper toe aan `ListingCard` voor zowel de default als horizontal variant, met fotocounter-badge, paginatie-dots, mouse/touch drag, keyboard-navigatie en lazy/prefetch laadgedrag. Alleen `src/modules/listings/ListingCard.tsx` wordt aangepast plus één nieuwe component `src/modules/listings/ListingImageCarousel.tsx`.

## Nieuwe component: `ListingImageCarousel`

Props:
- `images: string[]`
- `alt: string`
- `aspectClass: string` (bv. `aspect-[16/10]` of `aspect-[4/3]`)
- `priority?: boolean` (eerste afbeelding eager + `fetchpriority="high"`, default false)
- `className?: string`
- `children?: ReactNode` (voor overlay-content: prijs, hartje, badges)

Gedrag:
- State: `index`, `dragging`, `dragDelta`.
- Track: `flex` met `translateX(calc(-index*100% + delta))`, `transition-transform` uit tijdens drag.
- Slide-rendering: per slide één `<div class="w-full shrink-0">` met `<img>`.
  - Slide 0: `loading="eager"` indien `priority`, anders `loading="lazy"`.
  - Slide 1+: `loading="lazy"` initieel; zodra `dragging===true` of `index>0` voor het eerst → bewaar `loadedSet` (state Set<number>) waarin index 0,1 en daarna `index-1, index, index+1` zijn opgenomen; render niet-geladen slides als `<div class="bg-muted">` (lege placeholder, geen `<img>` om netwerkverkeer te voorkomen).
  - Op begin van drag: voeg `index±1` toe aan loadedSet (prefetch volgende).
- Geen layout shift: alle slides delen dezelfde `aspectClass` op de buitenste track.

Interactie:
- Pointer Events (`onPointerDown/Move/Up/Cancel`) — werkt voor muis + touch + pen. Capture pointer.
- Drempel: `>10 px` horizontale beweging → markeer als "swipe in gang", zet `dragging=true`, registreer dat klik genegeerd moet worden.
- Op `pointerup`: bepaal eind-index op basis van delta (>25% containerbreedte of snelheid >0.4 px/ms → wissel), clamp naar `[0, images.length-1]` (geen infinite).
- Verticale drag (deltaY dominant) → laat scrollen, annuleer swipe.
- Klik-suppressie: als drag gedetecteerd is, `e.preventDefault()` op de eerstvolgende `click` event via een capturing handler op de carousel; geef ouder-`Link` zo geen navigatie. Reset flag na 50 ms.
- Toetsenbord: container krijgt `tabIndex={0}`, `role="region"`, `aria-roledescription="carousel"`, `aria-label="Foto's van {title}"`. `ArrowLeft/ArrowRight` wisselen index (alleen wanneer carousel zelf focus heeft, niet de hele card).
- Single image of leeg: render alleen statische `<img>` zonder swipe-laag, dots of counter.

Overlay-elementen binnen de carousel (positioned absolute):
- Fotocounter rechtsonder: `Badge` met `Camera`-icoon + `{index+1}/{images.length}` óf alleen totaal `{images.length}`. Plan: toon `📷 {images.length}` (totaal) wanneer geen interactie, en `{index+1} / {images.length}` zodra de gebruiker swipet (na eerste indexwissel). Stijl: `rounded-full bg-black/55 text-white backdrop-blur-sm text-xs px-2.5 py-1 gap-1.5 inline-flex items-center`. WCAG-contrast door donkere semi-transparante achtergrond.
- Paginatie-dots onderaan-gecentreerd: alleen tonen bij ≥2 foto's en ≤8 (anders alleen counter). Bullet-rij `flex gap-1`, dot `h-1.5 w-1.5 rounded-full bg-white/60`, actief `w-4 bg-white`. Subtiele drop-shadow voor leesbaarheid.
- Prev/Next-pijlen (alleen lg, alleen bij hover van de hele card): `h-9 w-9 rounded-full bg-card/90 backdrop-blur` met `ChevronLeft/Right`. Verborgen op mobiel (touch heeft swipe). Klik op pijl → `e.stopPropagation()` + index ±1 binnen grenzen.
- Bestaande overlays (prijs links boven, favorite/compare rechts, premium/status links onder, hover-CTA) blijven via `children` slot ongewijzigd boven de track gerenderd.

Performance:
- Eerste card-afbeelding gebruikt `loading="lazy"` zoals nu; alleen slide 0 wordt initieel in DOM gerenderd als `<img>`. Slide 1 wordt vooraf ingeladen wanneer de gebruiker `pointerdown` doet (prefetch). Slide n-1/n/n+1 worden actief gehouden zodra n actief is.
- `decoding="async"`, `draggable={false}` op alle `<img>` om native HTML5 drag te onderdrukken.
- `select-none touch-pan-y` op de carousel zodat verticaal scrollen mogelijk blijft maar horizontale swipe door ons wordt afgehandeld.
- `will-change: transform` alleen tijdens drag.

## ListingCard-aanpassingen

- Vervang de huidige `<img>` + shimmer + price/heart/compare/premium-overlays voor zowel `horizontal` als `default` door:
  ```tsx
  <ListingImageCarousel images={listing.images} alt={listing.title} aspectClass="aspect-[16/10]">
    {/* alle bestaande overlay-knoppen en badges */}
  </ListingImageCarousel>
  ```
  De `Link`-wrapper blijft; de carousel onderschept clicks alleen wanneer een swipe is gedetecteerd. Bestaande `e.stopPropagation()` op favorite/compare blijft werken.
- `imageError`/`imageLoaded` state in `ListingCard` vervalt (verhuist naar carousel).
- `listing.images.length === 0` → carousel toont `/placeholder.svg`, geen swipe-UI.
- Horizontal variant gebruikt `aspectClass="aspect-[16/10] sm:aspect-[4/3]"` en `sm:w-72` blijft op de wrapper.
- Houd `group-hover:scale-105` weg (conflict met carousel transform). Vervang door subtielere `transition-opacity` zoom-fallback: niet doen — laat eruit om sleep-interactie strak te houden.

## A11y & touch targets

- Pijlknoppen `h-9 w-9` op desktop; mobiel geen pijlen (swipe vervangt ze). Carousel-container is groot genoeg (volledige afbeelding) → swipe-oppervlak >>44 px.
- Counter-badge en dots zijn niet interactief.
- `aria-live="polite"` op een visueel verborgen status: "Foto {index+1} van {total}" — geüpdatet bij wisseling, zodat screenreaders het volgen.

## Regressies vermijden

- `useFavorites`, `useCompare`, marketcompare-knop en alle bestaande props blijven onveranderd.
- Tests: visueel verifiëren via Playwright na build — swipe op `/zoeken` listingcard wisselt foto, klik opent `/auto/:id`, pijltjestoetsen werken wanneer de carousel focus heeft.

## Out of scope

- `ImageGallery` op de detailpagina blijft onveranderd.
- Geen DB-, route- of layout-wijzigingen.

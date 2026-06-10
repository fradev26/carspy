# Plan: Echte overflow-fix zonder content te knippen

## Wat is er mis gegaan
In de vorige iteratie heb ik in `src/index.css` globaal toegevoegd:
- `html, body { overflow-x: hidden; max-width: 100% }`
- `#root { overflow-x: hidden; max-width: 100%; position: relative }`
- `img, video { max-width: 100%; height: auto }`
- `table { max-width: 100% }`

`overflow-x: hidden` op `html` en `#root` creëert een nieuwe **containing block** en breekt `position: sticky` op de detail-sidebar, kan grid-/flex-tracks laten "ineenklappen" en zorgt dat content die net buiten de viewport rendert onzichtbaar is in plaats van scrollbaar. `position: relative` op `#root` versterkt dit nog. Daardoor lijken op de detailpagina (en elders) blokken niet volledig zichtbaar / niet bereikbaar.

## Aanpak

### Stap 1 — Revert van de te brede CSS in `src/index.css`
Verwijder de huidige globale blokkade en vervang door één veilige regel:

```css
/* Voorkom horizontale scroll zonder content te knippen of sticky te breken */
html, body {
  overflow-x: clip;
}
```

- `overflow-x: clip` (i.p.v. `hidden`) maakt **géén** nieuwe containing block aan en breekt dus `position: sticky` niet.
- Geen `max-width: 100vw/100%` op `html`, `body` of `#root` (die voegde niets toe en kan in zeldzame gevallen tracks misrekenen).
- Geen `position: relative` op `#root`.
- Geen globale `img/video { height: auto }` (kan responsive height-strategieën verstoren). Beelden in dit project gebruiken al `h-full w-full object-cover` in een aspect-ratio-container; geen globale regel nodig.
- `table { max-width: 100% }` weghalen (tabellen zitten al in eigen `overflow-x-auto` wrappers).

### Stap 2 — Daadwerkelijke overflow-bronnen punctueel fixen
Alleen wijzigen wat aantoonbaar > viewport oplevert:

1. **`src/modules/chat/ChatWidget.tsx`** — `w-[calc(100vw-2rem)]` is in de vorige iteratie al vervangen door `left-4 right-4 max-w-sm md:left-auto`. Behouden.
2. **`src/components/CompareBar.tsx`** — controleren of de floating bar binnen viewport blijft (mogelijk `inset-x-4` of `max-w-[calc(100%-2rem)]` toevoegen).
3. **`HomepageFilters` TabsList** — heeft al `flex-wrap`, geen actie.
4. **Tabellen in `Dealers.tsx`, `BusinessDashboard.tsx`, `DealerDashboard.tsx`** — zitten al in `overflow-x-auto` wrappers, geen actie.

### Stap 3 — Verificatie (oorzaakgericht)
- Detailpagina (`/auto/:id`) opnieuw renderen op 320, 375, 768, 1024, 1440, 2560 en controleren dat:
  - Volledige beschrijving, foto's, specificaties zichtbaar zijn.
  - Sticky sidebar werkt.
  - Geen horizontale scrollbar.
- Voor elke geteste pagina via DevTools-check: `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
- ListingCards: controleren dat hover-scale niet wordt afgekapt — de cards staan in een grid, hun ouders mogen geen `overflow-hidden` hebben tenzij de card-rand bewust gecontaind moet zijn. Hier niets wijzigen tenzij gemeten clipping.

## Wat er NIET wordt gewijzigd
- Geen `overflow-x: hidden` op pagina-roots of generieke containers.
- Geen globale `max-width`-regels.
- Geen img/video-resets.
- Geen wijzigingen aan Radix/shadcn-componenten.

## Verwacht resultaat
- Detailpagina toont weer volledige content (beschrijving, foto's, specs).
- Sticky elementen werken zoals voorheen.
- Geen horizontale scrollbar op alle geteste viewports (320–2560px).
- Geen visueel afgeknipte cards of afbeeldingen.

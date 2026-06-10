# Plan: Geen horizontale scroll op alle viewports

## Doel
Geen horizontale scrollbar op de hele VATUUR-site, van 320px tot 2560px, zonder bestaande UI te breken.

## Aanpak

### 1. Globale CSS hardening (`src/index.css`)
De huidige `overflow-x: hidden` staat alleen onder `@media (max-width: 768px)`. Dat wordt globaal gemaakt, met behoud van `position: relative` (anders breken `position: sticky` headers in sommige browsers door overflow-x op `html`).

- `html, body` → `overflow-x: hidden;` op alle viewports
- `#root` → `overflow-x: hidden; max-width: 100%;` op alle viewports
- Vervang `max-width: 100vw` door `max-width: 100%` (100vw houdt geen rekening met scrollbarbreedte op desktop en kán zelf overflow veroorzaken)
- Voeg algemene safety toe: `img, video, svg, canvas { max-width: 100%; height: auto; }` (alleen `max-width` voor svg/canvas zonder height auto om iconen niet te breken — strikter: alleen `img, video` krijgt `height: auto`)

### 2. Fix bekende 100vw / w-screen plekken
- `src/modules/chat/ChatWidget.tsx` (regel 97): `w-[calc(100vw-2rem)]` → `w-[calc(100%-2rem)]` binnen een full-width wrapper, of simpeler: vervang door `left-4 right-4 w-auto` met behoud van `max-w-sm`. Geen `100vw` meer.
- `src/pages/Index.tsx` (regels 159, 164): `sizes="(max-width: 640px) 100vw, …"` — dit is een `sizes`-attribuut voor responsive images en veroorzaakt geen layout-overflow. Ongewijzigd laten.

### 3. Audit en fix per pagina
Lopen door en controleren in browser op mobiel (390px), tablet (768px), desktop (1440px), 4K (2560px):
- Home (`/`)
- Zoeken (`/zoeken`) — inclusief mobile filter gate en `FilterPanel`
- Voertuig detail (`/auto/:id`) — `ImageGallery` thumb rail (`overflow-x-auto` is OK, blijft binnen parent)
- Favorieten (`/favorieten`)
- Verkopen (`/verkopen`) — Sell wizard met `-right-2 -top-2` absolute badges binnen `relative` parent (OK, blijven binnen card)
- AI-flow (`/ai`, ChatFullscreen)
- Dashboards (`/zakelijk`, `/dealer`) — tabellen al in `overflow-x-auto` wrapper (OK)
- Modals/Drawers/Sheets

Specifiek nakijken op:
- Tabellen met `min-w-[…]` → moeten in een `overflow-x-auto` wrapper zitten (al het geval bij Dealers/BusinessDashboard/DealerDashboard).
- `HomepageFilters` TabsList met 6 × `min-w-[80px]` (= 480px min) → kan op 320–375px overlopen. Wrappen in `overflow-x-auto` of `flex-wrap` toestaan.
- Bottom nav, fixed header: controleren dat ze geen breedte > 100% forceren.
- Hero/sectie-achtergronden zonder horizontale padding-bleed.

### 4. Verificatie
Browser preview opvragen op 320, 375, 390, 768, 1024, 1440, 1920, 2560 voor elke kernpagina; bevestigen via `document.documentElement.scrollWidth <= clientWidth`.

## Technische details
- Geen wijzigingen aan Radix UI / shadcn componenten (hun `translate-x-[-50%]` zit binnen `fixed` overlays met `max-w-lg` en is veilig).
- `overflow-x: hidden` op `html` kan `position: sticky` op descendants breken. Daarom op `body` en `#root` toepassen; op `html` enkel als nodig. Huidige sticky elementen (sidebar in detailpagina) blijven binnen een container, dus veilig.
- Geen functionele logica wijzigen; uitsluitend CSS/className aanpassingen.

## Risico's
- Globale `overflow-x: hidden` kan `position: sticky` headers/sidebars beïnvloeden. Mitigatie: alleen op `body`/`#root`, niet op `html`; testen in preview.
- Vervangen van `100vw` `sizes` zou de responsive-image hint slechter maken — daarom niet aanraken.

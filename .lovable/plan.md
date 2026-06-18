## Native app-achtige mobiele ervaring

Doel: de bestaande huisstijl 100% behouden en alleen de mobiele "shell" verstevigen — viewport lock, geen horizontale overflow, safe areas, en touch-vriendelijke defaults.

### 1. `index.html` — viewport
Vervang de huidige viewport meta door:
```
width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover
```
Behoud bestaande PWA-meta's (`apple-mobile-web-app-capable`, theme-color, manifest).

### 2. `src/index.css` — globale mobiele guards
Toevoegen / aanpassen in een nieuwe `@layer base` blok:

- **No horizontal overflow & viewport-fit**:
  ```css
  html, body { max-width: 100%; overflow-x: clip; overscroll-behavior-x: none; }
  body { width: 100%; }
  #root { max-width: 100%; overflow-x: clip; }
  ```
  (huidige `overflow-x: clip` blijft)
- **Dubbel-tap zoom voorkomen** op interactief: `button, a, [role="button"], input, select, textarea, label { touch-action: manipulation; }`
- **Geen tekstselectie tijdens swipen** op niet-tekst elementen: `button, [role="button"], .no-select { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }` — inputs/textarea expliciet `user-select: text` houden.
- **Responsieve media**: `img, video, canvas, svg, iframe { max-width: 100%; height: auto; }`
- **Lange woorden netjes breken**: `p, h1, h2, h3, h4, h5, h6, a, span, li, td, th { overflow-wrap: anywhere; word-break: normal; }` + utility `.break-anywhere` blijft beschikbaar.
- **iOS tap highlight uit**: `-webkit-tap-highlight-color: transparent` op `html`.
- **Min flex children** ter voorkoming van overflow in flex/grid: nieuwe utility `.min-w-0-all > * { min-width: 0; }` (optioneel inzetbaar; geen brede mutatie van bestaande components).
- **Safe area utilities** (bestaand): `.safe-x`, `.safe-top`, `.safe-bottom`, `.pb-nav` blijven; toevoegen `.safe-area-inset { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }` voor algemene modals.
- **Tap target minimum**: utility `.tap-target { min-width: 44px; min-height: 44px; }` — niet globaal forceren (zou knoppen te groot maken), maar beschikbaar maken; bestaande knoppen in `BottomNav`/header voldoen al.
- **Scrollbar verbergen op touch** (cosmetisch native feel): `@media (hover: none) { ::-webkit-scrollbar { display: none; } html { scrollbar-width: none; } }`

### 3. Modals/Drawers viewport-clamp
Shadcn `DialogContent` en `SheetContent` krijgen een class-override in een centrale utility (`src/components/ui/dialog.tsx`, `sheet.tsx`) of een CSS-regel:
```css
[role="dialog"] { max-width: calc(100vw - 1rem); max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom)); }
```
Alleen toevoegen via CSS — geen component-API wijziging — om regressie te vermijden.

### 4. PWA manifest check
`public/manifest.webmanifest` reeds aanwezig. Geen wijzigingen tenzij `display` ontbreekt; alleen aanvullen indien nodig (controleren tijdens implementatie).

### 5. Regressietest (handmatig in build mode)
Met Playwright op 375×812 (iPhone) een snelle sweep over kernroutes: `/`, `/zoeken`, `/favorieten`, `/verkopen`, `/auto/:id` (mock), `/dealer/:slug`, `/zakelijk`, `/zakelijk/voorraad`, `/account`, `/auth`. Detecteer `document.documentElement.scrollWidth > clientWidth` per route. Los geconstateerde overflow per route op met minimale, lokale class-toevoegingen (geen redesign, alleen `min-w-0`, `flex-wrap`, `max-w-full`, `truncate`/`break-anywhere`).

### Buiten scope
- Geen huisstijl-, kleur- of typografie-wijzigingen.
- Geen nieuwe routes, geen component-redesigns.
- Geen service worker / offline (PWA installable blijft zoals nu).
- Geen Capacitor-setup (web-only).

### Technische details
- Bestanden gewijzigd: `index.html`, `src/index.css`, mogelijk gerichte fixes in 1–3 page/components op basis van regressietest output.
- Geen npm installs.

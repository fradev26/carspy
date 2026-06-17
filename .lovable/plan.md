# Plan: /favorieten → "Mijn activiteiten" hub

Consolideer Favorieten, Recent bekeken en Zoekalerts op één pagina (`/favorieten`) met tabs. Identiek voor particulier en zakelijk.

## 1. Nieuwe paginastructuur (`src/pages/Favorites.tsx`)

Hernoem visueel naar **Mijn activiteiten**:

- H1: "Mijn activiteiten"
- Sub: "Beheer je favoriete voertuigen, recente bezoeken en zoekalerts."
- `<Tabs defaultValue="favorieten">` met `?tab=` URL-sync zodat diepe links blijven werken (`?tab=alerts`, `?tab=recent`).
- TabsList sticky onder de header, full-width op mobiel, horizontal scroll bij overflow.
- Logged-out gate (huidige Heart-card) blijft, met aangepaste copy ("Bewaar wagens, alerts en geschiedenis").

```
TabsList:
[ Heart  Favorieten ]  [ Clock  Recent bekeken ]  [ Bell  Zoekalerts ]
```

### Tab 1 — Favorieten
Bestaande logica behouden (Supabase `favorites` + `ListingGrid`). Toevoegen boven de grid:
- Aantal-badge ("12 wagens")
- Sorteer-`Select` (Nieuwste / Prijs ↑ / Prijs ↓ / Km ↑ / Bouwjaar ↓) — client-side sort op `listings` state.
- Knop "Vergelijken" (zichtbaar als `useCompare().items.length > 0`) → `/vergelijken`.
- Empty state: Heart icon, "Nog geen favorieten", CTA → `/zoeken`.

(Filterpanel is overkill voor v1 — sorteer + vergelijken volstaan; "Filters" laten we als later toevoeging buiten scope, omdat brief "indien beschikbaar" zegt.)

### Tab 2 — Recent bekeken
Inline-port van `RecentlyViewed.tsx`:
- `useRecentlyViewedListings()` hook hergebruiken.
- Card-grid (zelfde stijl als bestaand): afbeelding, titel, prijs, "Bekeken op {relatieve tijd}" via `Intl.RelativeTimeFormat`.
- Acties per kaart: Bekijken (link) + Verwijderen (trash).
- Toolbar boven grid: aantal + "Wis alles".
- Empty state: Clock icon, copy uit brief, CTA → `/zoeken`.

### Tab 3 — Zoekalerts
Inline-port van `SearchAlerts.tsx`:
- Behoud: `saved_searches` query, pauseren/hervatten, frequentie-select, verwijderen, "Zoeken" actie.
- Toevoegen badge "Actief"/"Gepauzeerd" links in de kaart.
- Kop-actie: "Nieuwe zoekalert" → `/zoeken`.
- Empty state: Bell icon, copy uit brief, CTA → `/zoeken`.

(Een echte "nieuwe matches sinds laatste bezoek"-badge vereist backend werk; v1 toont `frequency` als badge en `created_at` als "Laatste update" — `last_run_at` kolom is niet beschikbaar, dus geen verzonnen data.)

## 2. Routing (`src/App.tsx`)

- Behoud `/favorieten`.
- Verwijder routes `/account/recent` en `/account/zoekalerts` (de losse pagina's worden niet meer geladen).
- Bestanden `src/pages/account/RecentlyViewed.tsx` en `src/pages/account/SearchAlerts.tsx` worden verwijderd nadat hun logica geport is.

## 3. Navigatie-opruiming

Vervang alle links naar `/account/recent` of `/account/zoekalerts` door:
- `/favorieten?tab=recent`
- `/favorieten?tab=alerts`

Bestanden te updaten:
- `src/layouts/Header.tsx` (mobiele sheet)
- `src/pages/Dashboard.tsx`
- `src/pages/Index.tsx`
- `src/pages/ListingDetail.tsx`
- `src/pages/dealer/Settings.tsx` ("Mijn activiteiten" sectie)
- `src/pages/account/AccountSettings.tsx` ("Mijn activiteiten" sectie)
- `src/data/faq.ts`

BottomNav blijft ongewijzigd (Favorieten-item wijst al naar `/favorieten`).

## 4. Design

- Donker thema, bestaande shadcn `Tabs` (zelfde styling als overige VATUUR-tabs).
- Lucide-only iconen (Heart, Clock, Bell, Search, Trash2, Pause, Play, GitCompare).
- Geen emoji, geen pipes, geen markdown-tabellen.
- Mobile-first: tabs full-width, kaarten 1-koloms < sm, 2/3 koloms ≥ sm.
- Actieve tab krijgt `data-[state=active]` styling met primary underline-accent.

## Technische details

- Eén bestand wijzigen (`Favorites.tsx`) + één hook hergebruiken; geen nieuwe componenten nodig behalve evt. lokale `FavoritesTab`, `RecentTab`, `AlertsTab` subcomponenten onderaan hetzelfde bestand voor leesbaarheid.
- Tab-state via `useSearchParams` zodat back/forward en deep links werken.
- Geen DB-migraties.
- Geen edge-function wijzigingen.

## Out of scope (expliciet)

- Echte "nieuwe matches sinds vorige check"-teller (vereist `last_seen_at`/cron, geen mock-data).
- Server-side filterpanel binnen Favorieten-tab.
- Wijzigingen aan BottomNav of desktop header dropdown.

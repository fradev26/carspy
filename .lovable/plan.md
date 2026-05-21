# Twee zoekmodi in de hero: Slim & Klassiek

Eén hero-zoekcontainer met een segmented toggle erboven. De gebruiker schakelt instant tussen **Slim zoeken** (AI, natuurlijke taal) en **Klassiek zoeken** (Merk / Model / Prijs / Meer filters). Default = Slim zoeken.

## UX-gedrag

- Segmented control boven de zoekbalk, gecentreerd, met 2 opties.
- Actieve optie: gevuld pill in primary (rood, wit label) met `Sparkles`-icoon bij Slim.
- Inactieve optie: transparant pill, witte tekst, hover lichte witte overlay.
- Instant switch via `useState<'smart' | 'classic'>` — geen route change.
- Eén shared wrapper (`glass rounded-2xl`) met `min-height` zodat de hero niet verspringt bij wissel.
- Beide modi voelen first-class: geen "geavanceerd"-label, geen tekstuele uitleg.

## Componentstructuur

```text
HeroSearch (refactor)
├── SearchModeToggle           (nieuw, intern)
│     [ ✨ Slim zoeken ] [ Klassiek zoeken ]
└── div.glass.rounded-2xl      (shared container, min-h vast)
      ├── mode === 'smart'  → <SmartSearchBar variant="hero" />
      └── mode === 'classic' → <ClassicHeroSearch />   (nieuw)
```

### ClassicHeroSearch (nieuw, in `src/modules/search/`)

Horizontale pill-balk binnen dezelfde glass-container, met verticale scheidingslijnen:

```text
[ Merk ▾ ] | [ Model ▾ ] | [ Prijs ▾ ] | [ ⚙ Meer filters ] | [ 🔍 Zoeken ]
```

- Velden zijn lokale `useState` (brand, model, maxPrice).
- Model-Select is disabled tot Merk gekozen is.
- "Meer filters" → `navigate('/zoeken?...')` met huidige selectie als query params (opent zoekpagina met filterpanel open).
- "Zoeken"-CTA → `navigate('/zoeken?brand=...&model=...&maxPrice=...')`.
- Op mobiel (`<md`): velden stacken verticaal binnen dezelfde container, CTA full-width.

## State & logica

- Modus state lokaal in `HeroSearch` (`useState`). Persistentie niet nodig — homepage-only.
- `SmartSearchBar` blijft ongewijzigd; routet zelf naar `/zoeken` na AI-parsing.
- `ClassicHeroSearch` bouwt URL met `URLSearchParams` en gebruikt `react-router-dom` `useNavigate`.
- Merken-lijst hergebruikt uit bestaande constanten (zelfde lijst als "Populaire merken" sectie); modellenlijst uit `mockListings` of bestaande brand→models mapping als die er is.

## Design

- Toggle pill-container: `bg-white/10 backdrop-blur p-1 rounded-full border border-white/20`.
- Actieve knop: `bg-primary text-white shadow-sm`.
- Inactieve knop: `text-white/80 hover:text-white hover:bg-white/10`.
- Klassieke balk: witte achtergrond, `rounded-full` (zoals huidige homepage filters look), velden via shadcn `Select` met `border-0` en `divide-x` separators.
- Geen layout shift: container krijgt `min-h-[140px] md:min-h-[96px]`.

## Bestanden

- **Nieuw**: `src/modules/search/ClassicHeroSearch.tsx`
- **Wijzigen**: `src/modules/search/HeroSearch.tsx` (toggle + conditional rendering, verwijder onderliggende "Liever filters gebruiken?" link want overbodig)
- **Export**: `src/modules/search/index.ts` (geen wijziging nodig, `HeroSearch` blijft de public API)

## Waarom dit UX-gewijs werkt

1. Eén visueel anker (de glass container) blijft op zijn plek → geen cognitieve reset bij switch.
2. Segmented control is een bekend patroon (iOS-style) → direct begrijpelijk zonder uitleg.
3. Default Slim zoeken pusht de AI-USP zonder Klassiek te verbergen — beide één tap weg.
4. Klassieke balk lijkt op concurrent (vertrouwd), maar zit in dezelfde branding-shell → consistent met VATUUR.
5. Vaste min-height voorkomt jank op slow devices en bewaart de hero-compositie.

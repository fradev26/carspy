# Radius systeem: controlled sharpness voor VATUUR

Doel: de UI laten matchen met het hoekige, high-confidence logo. Weg van de "friendly SaaS pill" look, naar een strakker "automotive tool" gevoel — zonder volledig vierkant te worden.

## Het systeem (3 radius-levels)

Eén bron van waarheid in `tailwind.config.ts` + `index.css`. Daarna mag in components alleen nog `rounded-sm`, `rounded-md`, `rounded-lg` gebruikt worden.

```text
sm  =  6px   inputs, badges, kleine chips, segmented toggle items
md  = 10px   cards, containers, buttons, selects, dropdowns
lg  = 14px   hero search container, modals, grote panels
```

Verboden vanaf nu:
- `rounded-full` op alles behalve avatars en pure icon-only round indicators (bv. status dot)
- `rounded-2xl` / `rounded-3xl`
- `rounded-xl` als "default"

`--radius` in `index.css` gaat van `0.75rem` (12px) → `0.625rem` (10px) zodat de shadcn defaults (`lg`, `md`, `sm`, `xl`, `2xl`) automatisch verschuiven naar het nieuwe scale.

## Concrete refactor scope

Alleen presentation/styling. Geen logica wijzigt.

1. **`tailwind.config.ts`** — `borderRadius` map herdefiniëren naar het 3-level systeem (sm/md/lg + behoud `DEFAULT`). `2xl`/`xl` mappen naar `lg` zodat bestaande klassen die we niet handmatig opruimen ook ingetoomd worden.
2. **`src/index.css`** — `--radius` aanpassen naar `0.625rem` (10px).
3. **`src/components/ui/button.tsx`** — `rounded-md` als basis (was al), maar `size: sm` van `rounded-md` houden en `lg` van `rounded-md` ipv `rounded-md`. Geen `rounded-full` varianten.
4. **`src/modules/search/HeroSearch.tsx`**
   - Segmented toggle: `rounded-full` → `rounded-md`, items van `rounded-full` → `rounded-sm`.
   - Glass container: `rounded-2xl` → `rounded-lg` (14px).
5. **`src/modules/search/ClassicHeroSearch.tsx`**
   - Desktop pill row: `rounded-full` → `rounded-md`, `rounded-r-full` op CTA → `rounded-r-md`.
   - Mobile container: `rounded-2xl` → `rounded-md`.
   - Triggers: behouden geërfde radius.
6. **`src/modules/search/SmartSearchBar.tsx`** — zoekbalk-input van pill → `rounded-md` (12px-achtig via scale). Submit button `rounded-md`.
7. **`src/modules/listings/ListingCard.tsx`** + andere kaarten — controleren en `rounded-xl`/`rounded-2xl` → `rounded-md`. Behoud subtiele border, dial down shadow van `shadow-floating`/`shadow-elevated` naar `shadow-card` waar overdreven.
8. **`src/components/BottomNav.tsx`** — actieve indicator: ronde "blob" → afgeronde rechthoek (`rounded-md`). Center AI-knop blijft cirkel (uitzondering: één hero-element).
9. **Globale sweep** — `rg "rounded-(full|2xl|3xl|xl)"` door `src/` en per geval beslissen: vervangen door `rounded-md`/`rounded-lg`, of (zeldzaam) bewust laten staan met comment (avatar, dot, hero AI-knop).

## Uitzonderingen (bewust)

- **Avatars** → `rounded-full` blijft
- **Status-dots** (online, badge-puntjes) → `rounded-full` blijft
- **Center AI-knop in BottomNav** → cirkel blijft, dit is het visuele anker

## CTA-richtlijn

Primary CTA's: `rounded-md` (10px) + extra horizontale padding (`px-6`/`px-8`) ipv extra radius. Sterke rode fill, harde edge. Geen pill, geen full-round.

## Visuele check na implementatie

Screenshots maken op home (hero + toggle + zoekbalk), `/zoeken` (cards + filters), `/auto/:id` (detail card + sticky sidebar) op mobiel en desktop. Verifiëren dat:
- Geen pill-buttons meer zichtbaar
- Radius voelt consistent (max 3 niveaus per screen)
- Logo + UI nu in dezelfde "taal"

## Out of scope (voor later, indien gewenst)

- Diagonale dividers / skewed accents
- Angled hover states
- Nieuwe shadow-scale

Dit kan in een follow-up nadat het radius-fundament staat.


# Vergelijkingspagina herontwerp (`/vergelijken`)

Eén bestand wordt aangepast: `src/pages/Compare.tsx`. Bestaande huisstijl, `useCompare`-hook, routes en `CompareBar` blijven ongewijzigd.

## Nieuwe structuur (top → bottom)

```text
[ Sticky page header ]
 ← Auto's vergelijken                          [Wis alles]
 2 van 3 geselecteerd · ☑ Alleen verschillen

[ Sticky auto-header (compact, plakt onder page header bij scroll) ]
 ┌──────┐┌──────┐(+ Auto)
 │ foto ││ foto │
 └──────┘└──────┘
 Audi RS4   BMW M3
 €22.900    €24.900   [×] [×]

[ Specificaties tabel ]  — compact, zebra, winnaar-highlight
 Prijs        🟢 €22.900     €24.900
 Bouwjaar        2022        2021
 Km-stand     🟢 31.000      47.000 ▼niet-winnaar
 Vermogen        320 pk      🟢 360 pk
 ...

[ Uitrusting ]  (ongewijzigd qua data, met "alleen verschillen" gefilterd)

[ Onderaan CTA-blok ]
 [+ Auto toevoegen]   [Deel vergelijking]
```

## Functionele veranderingen

1. **Echte tabel-layout** — labelkolom 120px, dan 1fr per auto. Eén `grid` met `auto-rows-min`, dichter spacing (`py-2.5`), dunne separator-lijnen. Geen losse cards meer per rij.
2. **Sticky compacte auto-header** — `position: sticky; top: 0` (rekening houdend met bestaande globale header offset via `top-14`). Bij scroll krimpt foto-aspect naar 4:3 op ~96px breed; auto-naam + prijs blijven leesbaar. Op mobiel: foto's kleiner (25-30% minder hoogte) en `gap-2` tussen kolommen.
3. **"Alleen verschillen tonen"-toggle** — `Switch` bovenaan. Bij actief: filter `specs` waar alle items dezelfde `getValue` retourneren; idem voor features waar alle items dezelfde include-status hebben. Wanneer er maar 1 auto is, toggle uitgrijzen.
4. **Winnaar-highlight per rij** — per spec optioneel `compare: 'higher' | 'lower' | null`:
   - `lower`: Prijs, Km-stand
   - `higher`: Bouwjaar, Vermogen, Motor (engineSize)
   - `null`: Brandstof, Transmissie, Carrosserie, Kleur, Deuren (geen winnaar)
   Winnaar krijgt subtiel `text-success font-semibold` + klein groen bolletje (`size-1.5 rounded-full bg-success`). Bij gelijkstand geen highlight.
5. **Compactere foto-cards** — aspect `16/10` → `4/3` met `max-h-32 md:max-h-40`. `X`-knop verschuift naar onder de prijs (compactere overlay).
6. **Onderlinge afstand auto-kolommen** — `gap-2 md:gap-3` (was `gap-4`); voelt als één vergelijking.
7. **Onderste CTA-strip** — `flex` met `+ Auto toevoegen` (outline) en `Deel vergelijking` (primary, gebruikt `navigator.share` met fallback naar `clipboard.writeText(window.location.href)`). Mobiel full-width gestapeld, desktop side-by-side.
8. **Lege state** — ongewijzigd.
9. **Accessibility** — Switch heeft label; tabel gebruikt `role="table"`, `role="row"`, `role="cell"`. Sticky header behoudt focus outlines.

## Buiten scope

- Swipe tussen auto's (alleen relevant bij 3+ auto's, blijft als horizontale scroll zoals nu).
- Wijzigingen aan `CompareBar`, `useCompare`-hook, route of detailpagina.
- AI-vergelijking / nieuwe data uit DB.

## Technische details

- Geen nieuwe dependencies. `Switch` uit `@/components/ui/switch` is al beschikbaar.
- Spec-config wordt uitgebreid: `{ label, getValue, getNumeric?, compare?: 'higher'|'lower' }`. Winnaar-bepaling via `Math.min/max` over `getNumeric` resultaten; gelijkstand → geen highlight.
- Sticky offsets via Tailwind: `sticky top-14 z-30 bg-background/95 backdrop-blur` voor auto-header; bestaande globale header `h-14` blijft intact.
- Deel-knop: `if (navigator.share) navigator.share({ url }); else { clipboard + toast('Link gekopieerd') }` via bestaande `sonner` toast.
- Geen wijzigingen aan SEO/`noindex` meta.

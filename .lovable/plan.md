## Doel
De header op mobiel (<lg) mag nooit transparant zijn — ook niet op de homepage bovenaan de pagina. Op desktop blijft het huidige gedrag (transparant op homepage-top, solide bij scroll) ongewijzigd.

## Probleemanalyse
In `src/layouts/Header.tsx` wordt `isTransparent = isHomepage && !scrolled` toegepast op:
- de `<header>` achtergrond (`bg-transparent` vs `bg-card/95 backdrop-blur-lg border-b shadow-sm`)
- de kleur van het hamburger-icoon (`text-white`)
- desktop search/nav (witte tekst op transparant)

Sinds de hero op mobiel verwijderd is, staat de transparante header direct boven "Uitgelichte advertenties" → onleesbaar logo/icoon en oogt onaf.

## Wijzigingen — alleen `src/layouts/Header.tsx`

1. **Header-wrapper**: transparantie alleen toepassen vanaf `lg`. De solide stijl (achtergrond `bg-card/95`, blur, border, shadow) wordt op mobiel altijd actief. Concreet wordt de className opgesplitst:
   - basis: `fixed top-0 ... bg-card/95 backdrop-blur-lg border-b border-border/60 shadow-sm`
   - op `lg`: indien `isTransparent` → override naar `lg:bg-transparent lg:backdrop-blur-0 lg:border-transparent lg:shadow-none`

2. **Hamburger-icoon kleur**: `text-white` alleen toepassen op `lg` schermen. Op mobiel altijd `text-foreground`. (In de praktijk: hamburger zit in de mobiele balk; de witte variant is daar nooit meer nodig → gewoon `text-foreground hover:bg-muted`.)

3. **Ring rond ongelezen-indicator**: `ring-card` blijft correct want achtergrond is nu altijd `card` op mobiel.

4. **Desktop branch**: ongemoeid laten — `isTransparent` blijft daar volledig functioneren (witte search, witte nav-tekst op homepage-top).

## Sticky/CLS-check
- `fixed top-0` blijft. Hoogte blijft `h-14` mobiel / `h-16` desktop → geen layout shift.
- `AppLayout` heeft al `pt-[calc(3.5rem+env(safe-area-inset-top))]` op de homepage mobiel, dus geen content valt onder de header.
- Geen nieuwe transitions die bij scroll van mobiel triggeren (de `transition-all` blijft, maar mobiel heeft geen scroll-afhankelijke stijlwisseling meer).

## Out-of-scope
- Geen aanpassingen aan `AppLayout`, Index, of andere pagina's.
- Desktop look & feel ongewijzigd.

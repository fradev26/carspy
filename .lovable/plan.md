Geef de mobile bottom navigation een premium liquid-glass uitstraling in `src/components/BottomNav.tsx`.

## Wijzigingen

1. **Verwijder de harde border-top** en vervang door een subtiele semi-transparante stroke via `border-t border-white/10 dark:border-white/[0.06]`.

2. **Versterk het glass-effect op de nav**: van `bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80` naar `bg-background/60 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/50`, zodat de balk echt translucent aanvoelt.

3. **Voeg een gradient fade toe boven de nav**: een absolute pseudo-laag (`::before` via een extra `<div>`) van 16–24px hoog, gepositioneerd net boven de nav, met `bg-gradient-to-t from-background/70 to-transparent` en `pointer-events-none`. Dit laat de content vloeiend overlopen i.p.v. een scherpe scheidingslijn.

4. **Voeg een zachte highlight-stroke toe binnenin** met een tweede inset border via `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]` voor de glas-glans aan de bovenkant.

5. **Behoud bestaande gedrag**: alle nav items, AI center button, active pill styling, safe area en `lg:hidden` blijven ongemoeid.

## Visueel resultaat

De bottomnav zweeft licht boven de content, met een translucent achtergrond, een fade-naar-transparant overgang en een subtiele glasrand — consistent met de active pill, header icon cards en message hover states.
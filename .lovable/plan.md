Maak de bottomnav-achtergrond ondoorzichtig in `src/components/BottomNav.tsx`, behoud de glas-rand en gradient fade.

- Vervang `bg-background/60 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/50` door `bg-card backdrop-blur-xl` (volledig opaque achtergrond).
- Behoud de subtiele `border-t border-white/10 dark:border-white/[0.06]` en `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]` voor de glas-uitstraling.
- Behoud de gradient fade-overlay boven de balk (`from-background/70 to-transparent`) — die zorgt voor de vloeiende overgang zonder dat de nav zelf transparant is.
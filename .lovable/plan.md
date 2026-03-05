

## Header Rood Maken

### Wijzigingen in `src/layouts/Header.tsx`

1. **Header achtergrond**: Verander `bg-card/95` en `bg-card/80` naar `bg-primary` (de rode kleur uit het design system)
2. **Logo tekst**: `text-foreground` → `text-white font-bold`
3. **Navigatie links**: Alle `text-muted-foreground` en `hover:text-foreground` → `text-white font-bold` en `hover:text-white/80`
4. **Search icon (mobiel)**: `text-muted-foreground` → `text-white`
5. **Search bar (desktop)**: Achtergrond en border aanpassen voor contrast op rode achtergrond (witte border, transparante achtergrond, witte tekst/placeholder)
6. **"Auto verkopen" button**: Verander van `bg-accent` naar `bg-white text-primary font-bold` zodat het opvalt op de rode achtergrond
7. **Border onderaan**: `border-border/60` → `border-white/20` of verwijderen

### Bestand
- `src/layouts/Header.tsx`


## Doel
De huidige pill-layout duwt iconen en labels uit hun oorspronkelijke positie (verticaal gecentreerd in een `h-12` wrapper met `my-2 mx-1`). Herstel de originele positionering zoals voor de pill-wijziging, maar behoud de liquid-glass styling als actieve indicator.

## Scope
Uitsluitend `src/components/BottomNav.tsx`. Geen wijziging aan iconen, labels, routes, hoogte van de nav of de center AI-knop.

## Wijzigingen in `BottomNav.tsx`

### Layout van elke tab-link
Terug naar de originele structuur:
- `flex flex-col items-center justify-center w-full h-full` op de `<Link>` (zoals de AI-button al gebruikt)
- `gap-1` tussen icoon en label (originele ritmiek, niet `gap-0.5`)
- Geen `mx-1 my-2 h-12 px-2 flex-1` meer — die wrapper-maatvoering veroorzaakte de verschuiving

### Liquid-glass behoud
De actieve glass-styling blijft, maar wordt aangebracht op een inner-wrapper rond icoon + label in plaats van op de hele `<Link>`-cel. Zo zit het glass-element strak om de inhoud en blijven de iconen op hun originele plek staan.

Structuur:
```tsx
<Link to={path} className="flex flex-col items-center justify-center w-full h-full">
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ease-out',
      isActive
        ? 'bg-white/55 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-sm shadow-primary/15 text-primary'
        : 'text-muted-foreground active:scale-[0.97]'
    )}
  >
    <item.icon className="h-5 w-5" />
    <span className="text-[10px] font-medium leading-none">{item.label}</span>
  </div>
</Link>
```

### Wat blijft ongewijzigd
- `h-16` nav-hoogte
- AI center-knop (rode ronde knop met `-mt-2`)
- Iconen (`h-5 w-5`), labels (`text-[10px] font-medium`)
- Routing, auth/dealer-redirects, `aria-current`

## Verificatie
Preview op mobile (`/`, `/zoeken`, `/favorieten`): icoon + label staan weer op dezelfde verticale positie als de AI-knop-tekst, actieve tab toont een strak glass-pilletje rond icoon+label, geen layout-shift bij wisselen van tab.

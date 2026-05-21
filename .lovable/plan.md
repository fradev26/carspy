# Buttons: glans verwijderen

Doel: flat, matte, "tool"-buttons. Geen shimmer, geen accent-glow, geen gradient-fills op buttons.

## Wat verwijderd wordt

| Plek | Effect nu | Wordt |
|---|---|---|
| `src/components/ui/button.tsx` (default variant) | `shine-effect` (shimmer overlay via `::after`) | weg — alleen `bg-primary hover:bg-primary/90` |
| `src/index.css` | `.shine-effect` utility + `::after` shimmer + `@keyframes shimmer` | utility + ::after weg. `@keyframes shimmer` blijft (gebruikt door image skeletons via `animate-shimmer`). |
| `src/modules/search/SmartSearchBar.tsx` (submit) | `bg-accent … shadow-glow-accent` | `bg-primary text-primary-foreground hover:bg-primary/90` (geen glow) |
| `src/modules/search/SearchBar.tsx` (CTA) | idem `shadow-glow-accent` | idem fix |
| `src/pages/AutoWaarde.tsx` (CTA in hero) | idem `shadow-glow-accent` | idem fix |

## Wat blijft (bewust)

- **Skeleton/Image shimmer** (`animate-shimmer` op afbeeldings-placeholders in `ListingCard`, `ImageGallery`, `SkeletonCard`): laadt-indicator, geen button → blijft.
- **Section-backgrounds met `bg-gradient-*`** (hero overlay, AutoWaarde section bg, Index CTA strip): geen buttons, eigen design-keuze → buiten scope.
- **Premium listing ring** (`shadow-glow-premium` op `ListingCard`): card-level highlight voor premium aanbod, geen button → blijft.

## Hover-gedrag

Eén regel: subtiele darken via opacity-modifier (`hover:bg-primary/90` / `hover:bg-accent/90`). Geen extra shadow-toename, geen overlay.

## Implementatie-volgorde

1. `button.tsx` — verwijder `shine-effect` uit default-variant.
2. `index.css` — verwijder `.shine-effect` blok + `::after`.
3. `SmartSearchBar.tsx`, `SearchBar.tsx`, `AutoWaarde.tsx` — vervang `bg-accent … shadow-glow-accent` door solid `bg-primary` zonder glow.
4. Visuele recheck van homepage hero (Slim zoeken CTA) + `/auto-waarde` CTA.

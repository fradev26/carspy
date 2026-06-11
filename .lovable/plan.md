### Doel
De profiel- en berichteniconen in de mobiele header krijgen een verfijndere, premium uitstraling met identieke cirkelvormige containers, zonder de bestaande layout of positie te wijzigen. Het VATUUR-logo blijft het dominante middelpunt.

### Wijzigingen — `src/layouts/Header.tsx`

**1. Profiel-icoon (SheetTrigger, links)**
- Button wordt een 40×40px cirkel met lichte achtergrond.
- Classes: `absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-muted/60 hover:bg-muted active:bg-muted/80 text-foreground transition-colors`
- `User` icoon krijgt `h-[18px] w-[18px] strokeWidth={1.75}` (≈12% kleiner, verfijnde stroke).
- Wrapper rondom button: extra onzichtbare hit-area zodat touch target ≥44px behouden blijft → button wikkelen in `<span className="inline-flex h-11 w-11 items-center justify-center">` ? Eenvoudiger: button blijft 40×40 visueel, maar we vergroten het effectieve doel met `before:` pseudo-element: `relative before:absolute before:inset-[-2px] before:content-['']`. Resultaat: 44×44px tap, 40×40px visueel.

**2. Berichten-icoon (rechts)**
- Identieke styling als profiel: `absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-muted/60 hover:bg-muted active:bg-muted/80 text-foreground transition-colors relative before:absolute before:inset-[-2px] before:content-['']`
- `MessageCircle` icoon: `h-[18px] w-[18px] strokeWidth={1.75}`
- Ongelezen-badge blijft absoluut gepositioneerd bovenop de cirkel:
  - `absolute -top-0.5 -right-0.5` (zweeft net buiten de cirkelrand)
  - `ring-2 ring-background` voor scheiding
  - Layout-onafhankelijk: badge zit binnen de relatief gepositioneerde button, dus beïnvloedt niets.
- Lege-state placeholder wordt ook `h-10 w-10` zodat de symmetrie identiek blijft.

**3. Achtergrond-token**
- Gebruik `bg-muted/60` (lichte neutrale tint, past in zowel light als dark mode via design tokens). Geen hardgecodeerde `#F7F7F7`.

### Niet gewijzigd
- Positie iconen (`left-6` / `right-6`) blijft.
- Logo blijft `absolute left-1/2 -translate-x-1/2`, exact gecentreerd.
- Desktop-header, sheet-content, badges-logica.

### Visueel resultaat
```text
( ◔ )           VATUUR.           ( ✉ )
```
Twee identieke, subtiele cirkels flankeren een dominant gecentreerd logo — rustig, premium, automotive.

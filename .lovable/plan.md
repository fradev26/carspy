

# Hero Section Aanpassen — Minder rood, met achtergrondafbeelding

## Probleem
De hero sectie is volledig `bg-gradient-to-br from-primary via-primary to-primary/90` — een massief rood vlak dat te overweldigend is.

## Oplossing
Vervang de rode achtergrond door een sfeervolle automotive hero-afbeelding met een donkere overlay, zodat de tekst leesbaar blijft. De rode primary kleur blijft als accent (SearchBar, knoppen) maar domineert niet meer de hele hero.

## Aanpassingen

### `src/pages/Index.tsx` — Hero section restylen

- **Achtergrond**: Verwijder `bg-gradient-to-br from-primary via-primary to-primary/90`
- **Hero image**: Gebruik een Unsplash automotive foto als achtergrondafbeelding (via `bg-[url(...)]` of een `<img>` met `object-cover`)
  - Bijv. een stijlvolle auto op een weg, showroom, of dashboard-detail
- **Overlay**: Donkere gradient overlay (`bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/80`) voor leesbaarheid
- **Tekst**: Blijft wit (`text-white`) — werkt op donkere overlay
- **Trust indicators**: Wit met lagere opacity — werkt op donkere overlay
- **SVG pattern**: Verwijderen (niet nodig met foto-achtergrond)

### Afbeelding aanpak
Gebruik een gratis Unsplash-afbeelding URL direct als CSS background-image. Geen upload nodig. Voorbeeld:
```
https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80
```
(Elegante auto, donkere tint, professionele uitstraling)

### Resultaat
- Hero voelt premium en professioneel aan
- Rode accenten komen via knoppen en SearchBar (subtiel, niet overweldigend)
- Donkere overlay garandeert leesbaarheid op elke afbeelding

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/Index.tsx` | Hero achtergrond: afbeelding + donkere overlay i.p.v. rood vlak |


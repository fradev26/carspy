

## Plan: Logo + zoekicoon altijd zichtbaar, witte balk pas na hero

### Wat verandert er
Op de homepage zijn het logo en zoekicoon (mobiel) / logo (desktop) **altijd zichtbaar** bovenaan — zonder achtergrond, als zwevende elementen over de hero. De witte balk met achtergrond, blur en border verschijnt pas na het scrollen voorbij de hero (~300px). Op andere pagina's blijft alles zoals nu (altijd solid).

### Technische aanpak

**Bestand: `src/layouts/Header.tsx`**

De header wordt **altijd zichtbaar** (`opacity-100`, `translate-y-0`), maar de achtergrondstijling is conditioneel:

1. **Header wrapper**: altijd `opacity-100 translate-y-0` — nooit meer `opacity-0` of `-translate-y-full`
2. **Achtergrond conditioneel**:
   - `isVisible` (niet-homepage OF gescrold): `bg-card/95 backdrop-blur-lg border-b shadow-sm`
   - Homepage + niet gescrold: `bg-transparent` — geen border, geen blur, geen shadow
3. **Tekst/icoon kleur op homepage vóór scroll**: wit (`text-white`) zodat logo en zoekicoon leesbaar zijn over de donkere hero
4. **Logo kleur**: `text-primary` wanneer solid, `text-white` wanneer transparant over hero
5. **Zoekicoon kleur**: `text-white` wanneer transparant, `text-foreground` wanneer solid

### Styling samengevat

```
Header wrapper:
  Altijd: fixed, opacity-100, translate-y-0, pointer-events-auto
  Solid (scrolled of niet-homepage): bg-card/95, backdrop-blur, border-b, shadow
  Transparant (homepage, niet gescrold): bg-transparent, geen border/shadow

Mobiel logo + zoekicoon:
  Solid: text-primary (logo), text-foreground (icoon)
  Transparant: text-white (beide)

Desktop logo:
  Solid: text-primary
  Transparant: text-white
```

### Bestanden
| Bestand | Wijziging |
|---------|-----------|
| `src/layouts/Header.tsx` | Header altijd zichtbaar, achtergrond + kleuren conditioneel op scroll-state |




## Transparante Header met Doorlopende Hero

### Probleem
De header is nu een rode balk (`bg-primary`) die boven de hero-sectie zit. De hero-afbeelding begint pas onder de header.

### Oplossing

**1. Header transparant maken (`src/layouts/Header.tsx`)**
- Achtergrond: `bg-primary` → `bg-transparent`
- Verwijder `border-b border-white/20`
- Positie: `sticky top-0` → `fixed top-0 left-0 right-0` (zodat hij over de content heen zweeft)
- Logo: `text-white` → `text-primary` (rood logo)
- Nav links en iconen blijven `text-white font-bold` (leesbaar op de hero-afbeelding)
- Zoekbalk styling behouden (semi-transparant wit werkt op de afbeelding)
- "Auto verkopen" knop: behouden als `bg-white text-primary`

**2. Hero-sectie omhoog trekken (`src/pages/Index.tsx`)**
- Voeg negatieve top-padding toe zodat de afbeelding achter de header doorloopt: `pt-0` en gebruik `-mt-[56px] lg:-mt-[64px]` (header hoogte) op de hero section
- Pas de interne padding aan zodat de content niet achter de header valt: verhoog `py-24` naar `pt-32 pb-24` en `lg:py-36` naar `lg:pt-44 lg:pb-36`
- Pas de overlay gradient aan: `from-foreground/70` → `from-foreground/80` aan de bovenkant voor betere leesbaarheid achter de header

**3. Z-index check**
- Header heeft `z-50`, hero content heeft `z-10` — dit is correct

### Bestanden
| Bestand | Wijziging |
|---------|-----------|
| `src/layouts/Header.tsx` | `bg-transparent`, `fixed`, logo `text-primary` |
| `src/pages/Index.tsx` | Negatieve margin-top, aangepaste padding |




## Plan: Footer Overlap Fix op Mobiel

### Analyse
- **Huidige situatie**:
  - `BottomNav`: `fixed bottom-0` met `h-16` (64px), zichtbaar op mobiel (`lg:hidden`)
  - `Footer`: `hidden md:block` — dus verborgen op mobiel (<768px)
  - `AppLayout` `<main>`: `pb-16` op mobiel (64px padding)
  
- **Probleem**: 
  - Op mobiel: De `pb-16` zou de overlap moeten voorkomen, maar mogelijk werkt dit niet correct omdat het via AppLayout direct op `<main>` zit en niet op de footer/content.
  - Mogelijk scenario: De Footer wordt toch ergens zichtbaar gemaakt (b.v. via media query aanpassing) en overlapt met BottomNav.
  
### Oplossing
**1. Controleer en verifieer in de preview** wat er werkelijk gebeurt op mobiel (footer zichtbaar ja/nee?)

**2. Voeg `safe-bottom` toe aan AppLayout `<main>`** (naast existing `pb-16`)
   - Dit voegt extra padding toe voor devices met home indicators (iPhone)
   - `pb-16 lg:pb-0` → `pb-16 lg:pb-0 safe-bottom`

**3. Zorg dat Footer alleen op `md` en hoger zichtbaar is** (dubbel checken)
   - `hidden md:block` is al correct ingesteld
   - Geen wijziging nodig tenzij footer ergens anders in de HTML voorkomt

**4. Optioneel: Verhoog padding-bottom als `pb-16` onvoldoende is**
   - Huidige: `pb-16` = 64px
   - Als probleem blijft: verhoog naar `pb-20` of `pb-24`

### Bestanden
| Bestand | Wijziging |
|---------|-----------|
| `src/layouts/AppLayout.tsx` | Voeg `safe-bottom` toe aan `<main>` className |
| (Optioneel) | Verhoog `pb-16` naar `pb-20` als vereist |




## Plan: Logo altijd rood maken

Twee regels in `src/layouts/Header.tsx` bevatten een ternary die het logo wit maakt op de transparante homepage-header. Deze worden vervangen door een vaste `text-primary` class.

### Wijzigingen in `src/layouts/Header.tsx`

- **Regel 52** (mobiel logo): `isTransparent ? "text-white" : "text-primary"` → altijd `"text-primary"`
- **Regel 66** (desktop logo): `isTransparent ? "text-white" : "text-primary"` → altijd `"text-primary"`

Het zoekicoon op mobiel blijft wel wit/donker wisselen op basis van de achtergrond.


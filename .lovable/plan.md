# Favoriet-hartje duidelijker zichtbaar maken op ListingCard

De hart-knop toont nu al dat een wagen favoriet is (gevuld hartje, primary achtergrond), maar het visuele signaal kan sterker zodat het opvalt bij het scrollen door listings.

## Wijzigingen

### `src/modules/listings/ListingCard.tsx`

Beide card-varianten (`horizontal` en `default`) — de **Favorite Button** krijgt een opvallender favoriet-state:

- **Glow-effect**: `shadow-[0_0_12px_rgba(225,29,72,0.35)]` wanneer favoriet, zodat het hartje subtiel "gloeit".
- **Groter hart-icoon**: `scale-110` → `scale-125` wanneer favoriet.
- **Dikkere stroke**: `strokeWidth={favorite ? 2.5 : 2}` voor een voller uiterlijk.
- **Behoud bestaand**: primary achtergrond, ring, filled heart — die blijven.

## Niet gewijzigd
- Geen logica-aanpassingen (`useFavorites`, toggle, etc.)
- Geen andere componenten — ListingCard is het enige weergavepunt.

## Verificatie
- TypeScript compileert zonder errors.
- Preview-check: wagen als favoriet markeren → hartje gloeit subtiel en is duidelijk gevuld op alle kaarten waar deze wagen verschijnt.
# Favorietstatus overal consistent

## Oorzaak

`ListingGrid` geeft altijd `isFavorite={favorites.includes(id)}` door aan `ListingCard`, ook als de ouder géén `favorites`-prop meegeeft (default `[]`). In `ListingCard` staat:

```ts
const favorite = isFavorite ?? isFavGlobal(listing.id);
```

`false` is niet nullish, dus de globale `useFavorites`-context wordt genegeerd. Op `Search.tsx` en `DealerInventory.tsx` wordt `favorites` niet doorgegeven → harticoon staat altijd "uit", ook al staat de wagen in favorieten.

Het is dus geen visueel probleem maar een verkeerde fallback-laag.

## Oplossing — globale context als enige bron van waarheid

### 1. `src/modules/listings/ListingCard.tsx`
- Verwijder de props `isFavorite` en `onFavoriteToggle` volledig.
- Gebruik uitsluitend `useFavorites()` (`isFavorite(id)` + `toggle(id)`) voor lezen en wijzigen.
- Geen extra badges, borders of card-highlights — alleen het bestaande hartje (gevuld + primary achtergrond) blijft de visuele indicator.

### 2. `src/modules/listings/ListingGrid.tsx`
- Verwijder de props `favorites` en `onFavoriteToggle` en geef ze niet meer door aan `ListingCard`.
- Component wordt simpeler: alleen `listings`, `variant`, `columns`, `className`.

### 3. Call sites opschonen
Verwijder de nu overbodige `favorites=` / `onFavoriteToggle=` props (geen gedragsverandering, alleen dode props):
- `src/pages/Index.tsx` (regel 318-322 en regel 338)
- `src/pages/Favorites.tsx` (regel 139-143) — `handleFavoriteToggle` kan weg als hij nergens anders gebruikt wordt
- `src/components/home/CategoryGrid.tsx` (regel 98-103, props `favorites`/`onToggle` van `CategorySections` worden ongebruikt en kunnen weg)
- `src/pages/Search.tsx`, `src/pages/DealerInventory.tsx`, `src/pages/ListingDetail.tsx` — geen wijziging nodig (gaven al niets door), profiteren automatisch van de fix.

### Resultaat
- Eén bron van waarheid: `FavoritesProvider` (al gemount in `App.tsx`).
- `toggle()` update de context-state optimistisch → alle gemounte `ListingCard`-instanties re-renderen onmiddellijk, ongeacht pagina.
- Zoekresultaten, gerelateerde voertuigen, dealer-inventory, categorieën: allemaal automatisch in sync.
- Geen lokale state per pagina meer voor favorieten.

### Verificatie
- Build + bestaande tests (35/35) groen.
- Manueel: favoriet toevoegen op homepagina → openen `/zoeken` → hartje is gevuld op dezelfde wagen; unfaven op detail werkt direct terug op alle zichtbare kaarten.

## Plan: Favorieten persistent per gebruiker

Probleem: Op de homepage, zoekresultaten, gerelateerde wagens en detailpagina is het hartje puur lokaal — er wordt niets opgeslagen. Alleen de `/favorieten`-pagina kent de echte status. Daardoor lijken favorieten "weg" zodra je een andere pagina opent.

### Aanpak

1. **Nieuwe hook `src/hooks/useFavorites.tsx`** (Context + Provider)
   - Laadt bij login alle `favorites` van de huidige gebruiker uit Supabase (`select listing_id`).
   - Houdt de set lokaal bij als `Set<string>`.
   - `isFavorite(id)`, `toggle(id)` (optimistic update + insert/delete in `favorites`-tabel).
   - Bij uitgelogde gebruiker: toast met melding "Log in om favorieten op te slaan" en doorverwijzen naar `/auth`.
   - Reset state bij logout.

2. **`src/App.tsx`**: `<FavoritesProvider>` toevoegen binnen `<AuthProvider>`.

3. **`src/modules/listings/ListingCard.tsx`**: gebruik `useFavorites()` direct in plaats van interne `useState`. `isFavorite`/`onFavoriteToggle` props blijven optioneel als override (voor de Favorites-pagina die items moet verwijderen uit de lijst).

4. **`src/modules/listings/ListingGrid.tsx`**: `favorites`/`onFavoriteToggle` props blijven werken; default tap door naar de hook.

5. **`src/pages/ListingDetail.tsx`**: vervang lokale `useState` voor `isFavorite` door `useFavorites()` (beide hartje-knoppen, regels 238 en 531).

6. **`src/pages/Favorites.tsx`**: blijf eigen lijststate gebruiken voor het verwijderen uit de view, maar roep `toggle` van de hook aan zodat alle andere pagina's gesynced blijven. Listings worden bij mount opnieuw opgehaald.

### Technische details
- Hook gebruikt bestaande RLS-policies (`Users can view/add/remove own favorites`) — geen DB-wijzigingen nodig.
- Optimistic update + rollback bij Supabase-error.
- Geen wijziging aan `favorites`-schema.

### QA
- Uitgelogd: klikken op hart → toast + redirect naar /auth.
- Ingelogd: hart aanklikken op homepage/zoeken/detail → blijft rood na page reload, verschijnt op `/favorieten`.
- Op `/favorieten` verwijderen → verdwijnt uit lijst én andere kaarten elders worden niet meer als favoriet gemarkeerd.
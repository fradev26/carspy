# Fix "Volledig dealeraanbod"-knop → echte dealerpagina

## Probleem

De knop in `src/pages/ListingDetail.tsx` linkt naar `/dealer/{slug}` waar `slug = slugify(seller.name)`. `DealerInventory` zoekt die slug echter alleen op in `mockListings` via `findDealerBySlug` / `getDealerListings`. Voor listings uit Supabase (de echte data) faalt die lookup → `<Navigate to="/zoeken" replace />`. De knop voelt daardoor stuk.

## Oplossing

`/dealer/:slug` ook laten werken voor dealers uit Supabase, door de slug te resolven tegen `profiles.dealer_name` en daarna listings op `user_id` op te halen. Mock-pad blijft als fallback voor demo-data.

### `src/lib/dealers.ts`

Twee nieuwe async helpers naast de bestaande mock-helpers:

- `findDealerBySlugAsync(slug)` — eerst `findDealerBySlug(slug)` (mock). Niet gevonden? Query `profiles` `select id, dealer_name, full_name, avatar_url, created_at, city, province where is_dealer = true`, slugify `dealer_name` client-side en match. Geef een `DealerSummary` terug met `seller.id = profile.id`.
- `getDealerListingsAsync(slug, sellerId?)` — als `sellerId` bekend is, query `listings where user_id = sellerId and status = 'active'`, map via dezelfde `mapRow`-pipeline. Voor mock-fallback gewoon `getDealerListings(slug)`.

Om duplicatie te vermijden: exporteer `mapRow` + `fetchWithProfileFallback` uit `useListings.ts` (of verplaats ze naar een neutrale `src/lib/listingMapper.ts`) en gebruik die in de nieuwe helper. **Kies** voor named export uit `useListings.ts` — kleinste diff.

### `src/pages/DealerInventory.tsx`

- Vervang sync `findDealerBySlug` / `getDealerListings` door state + `useEffect` die `findDealerBySlugAsync` en `getDealerListingsAsync` aanroept.
- Toon spinner tijdens loading; alleen `<Navigate to="/zoeken" replace />` als beide bronnen leeg blijven.
- Rest van filtering/sorting/paginering blijft ongewijzigd.

### `src/pages/ListingDetail.tsx`

Geen wijziging nodig — de twee bestaande `<Link to={\`/dealer/${dealerSlugFor(listing.seller)}\`}>` blijven werken zodra de pagina ze kan oplossen.

## Out of scope

- Geen nieuwe routes, geen schema-wijzigingen, geen UI-redesign van DealerInventory.
- Mock-data en demo-dealers blijven werken.
- `/dealers` overzichtspagina blijft mock-only (apart ticket indien gewenst).

## Verificatie

- Open een Supabase-listing met dealer-seller → klik "Volledig dealeraanbod bekijken" → land op `/dealer/{slug}` met de volledige actieve voorraad van die dealer.
- Open een mock-listing van een dealer → idem, vanuit mockListings.
- Onbestaande slug → redirect naar `/zoeken`.

# Fix: dealeradvertenties tonen als "Particulier" bij niet-eigenaars

## Hoofdoorzaak

De RLS-policy op `public.profiles` staat alleen lezen van het **eigen** profiel toe (`auth.uid() = id`). Alle advertentie-fetches doen een join `profiles!listings_user_id_fkey` om `is_dealer`, `dealer_name`, `full_name`, `avatar_url` op te halen. Voor elke bezoeker die niet de eigenaar is — particulier, andere dealer, of niet-ingelogd — geeft die join `profiles = null` terug. De mappers (`src/hooks/useListings.ts` en `src/hooks/useSearchListings.ts`) vallen dan terug op `is_dealer = false` en zetten `seller.type = 'private'`, met "Verkoper" als naam. Hierdoor verschijnen dealeradvertenties als particulier voor iedereen behalve de eigenaar zelf. Logica baseren op `useProfile()` van de bezoeker is dus niet eens nodig — de mapping zelf is al stuk.

## Aanpak

Twee delen: (1) backend levert publieke verkoperinfo onafhankelijk van wie ingelogd is, (2) frontend gebruikt overal één helper die de eigenaar als bron van waarheid neemt.

### 1. Backend: publieke verkoperinfo

Migratie (apart, vereist goedkeuring):
- View `public.public_profiles` met enkel niet-PII velden: `id, full_name, dealer_name, is_dealer, avatar_url, created_at`. Gemaakt met `security_invoker = on` zodat de view zelf RLS van de eigenaar respecteert — en daarbovenop een nieuwe SELECT-policy op `profiles`: "Anyone can read public profile via view" voor `anon, authenticated` (omdat de view enkel veilige kolommen exporteert). Alternatief en veiliger: view als `SECURITY DEFINER` functie `get_public_profiles(user_ids uuid[])` die een tabel teruggeeft. Kies de view-variant met dedicated policy + expliciete column GRANT enkel op de zes safe kolommen — zo blijven PII-kolommen (phone, email) ontoegankelijk via REST.
- GRANT SELECT op `public.public_profiles` aan `anon` en `authenticated`.
- Foreign-key alias toevoegen zodat PostgREST embed `public_profiles!listings_user_id_fkey` werkt, of de join op clientzijde doen via een tweede query op `public_profiles`.

### 2. Frontend: centrale helper

Nieuwe file `src/lib/sellerType.ts`:
```ts
export type SellerType = 'dealer' | 'private';
export function getListingSellerType(listing: { seller?: { type?: SellerType } }): SellerType {
  return listing.seller?.type === 'dealer' ? 'dealer' : 'private';
}
export function getSellerLabel(listing): string {
  return getListingSellerType(listing) === 'dealer' ? 'Dealer' : 'Particulier';
}
```

Refactor alle plekken die `listing.seller.type === 'dealer'` of `isDealer` (van `useProfile`) gebruiken om de advertentie te beschrijven:
- `src/modules/listings/ListingCard.tsx` (2x label)
- `src/pages/ListingDetail.tsx` (8 plekken: JSON-LD, badges, contactgegevens, dealer-link, verificatie)
- `src/lib/dealers.ts`

Alle plekken die `useProfile().isDealer` van de **bezoeker** gebruiken voor advertentieweergave krijgen review; momenteel zijn dat enkel layout/nav beslissingen (`Header`, `BottomNav`, `DesktopNav`, `Dashboard`-banner, `Sell` redirect) — die mogen blijven want ze gaan over de bezoeker, niet over advertenties. Bevestigen dat geen advertentie-component `useProfile` injecteert.

### 3. Mapping aanpassen

`useListings.ts` en `useSearchListings.ts`:
- Vervang de join `profiles:profiles!...` door `public_profiles:public_profiles!listings_user_id_fkey (...)` (of fallback-query op `public_profiles` met `.in('id', userIds)`).
- `fetchWithProfileFallback` gebruikt nu `public_profiles` i.p.v. `profiles`.
- `mapRow` blijft hetzelfde — krijgt nu wel voor élke bezoeker correcte data.
- Behoud `get_my_profile` RPC voor het eigen profiel (PII).

`src/lib/dealers.ts` `resolveDealerProfile`: switch naar `public_profiles`.

`src/pages/Messages.tsx` profielfetch: switch naar `public_profiles` (anders zien gebruikers "Verkoper" in plaats van dealer/particulier naam in conversaties).

### 4. Regressietests

`src/lib/sellerType.test.ts`: unit-tests op de helper.

`src/hooks/useSearchListings.sellerType.test.ts`: mock supabase client, test mapping voor:
- Particulier bezoekt dealeradvertentie → `seller.type === 'dealer'`, label "Dealer"
- Dealer bezoekt dealeradvertentie → idem
- Particulier bezoekt particuliere → `'private'`, label "Particulier"
- Dealer bezoekt particuliere → idem
- Niet-ingelogd bezoekt beide → idem als hierboven

Tests rendert mockdata door `mapRow` met de eigenaar-`public_profiles`-row en bevestigt dat de output identiek is ongeacht een gesimuleerde `useProfile`-context.

`src/modules/listings/ListingCard.test.tsx`: render dealer-listing in een wrapper die `useProfile` mockt als particulier én als dealer; in beide gevallen moet "Dealer" badge zichtbaar zijn.

## Out of scope

- Geen wijzigingen aan permissies voor `phone`/`email` — die blijven via `get_my_profile`.
- Geen redesign van de detailpagina of cards.
- Geen wijziging aan bezoeker-rol-gebaseerde nav/layout (correct gedrag).

## Volgorde van uitvoering

1. Migratie `public_profiles` view + grants + FK alias → wacht op goedkeuring.
2. Helper `sellerType.ts` + refactor componenten.
3. Mappers en `dealers.ts` overzetten naar `public_profiles`.
4. Tests toevoegen, vitest runnen.
5. Handmatig verifiëren in preview met een particulier account dat een dealeradvertentie bekijkt.

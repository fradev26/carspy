
# Admin invite user — backend toevoegen

De admin app roept een edge function aan om nieuwe gebruikers (incl. dealers en admins) uit te nodigen via email. Deze function en de bijhorende audit tabel moeten in **dit** project (vatuur) staan, want de admin app deelt deze backend.

## 1. Migratie — `admin_actions` tabel

Nieuwe tabel voor audit logging van alle admin acties (invites, role changes, listing edits, bulk imports, etc.).

Kolommen:
- `id` uuid PK
- `admin_id` uuid — wie de actie deed
- `action` text — bv. `user.invited`, `role.granted`, `listing.deleted`
- `target_type` text — `user` / `listing` / `profile` / ...
- `target_id` uuid — referentie naar het object
- `details` jsonb — extra context (email, oude/nieuwe waarde, ...)
- `created_at` timestamptz

GRANTs: alleen `authenticated` + `service_role` (geen anon).
RLS: alleen admins kunnen SELECT/INSERT via `has_role(auth.uid(), 'admin')`.

## 2. Edge function `admin-invite-user`

Op basis van de code die de admin app aanlevert, met deze aanpassingen om consistent te blijven met de twee bestaande admin functions:

- CORS uit `npm:@supabase/supabase-js@2/cors` (zelfde patroon als `admin-bulk-import`)
- Zod-validatie op de request body (`email`, `full_name?`, `is_dealer?`, `dealer_name?`, `make_admin?`)
- `getClaims(token)` ipv `getUser()` (zelfde patroon als bestaande admin functions, sneller en werkt met JWT signing keys)
- Admin-check via `has_role` RPC op de service-role client
- Stappen: validate → invite via `auth.admin.inviteUserByEmail` → update `profiles` (dealer info) → optioneel admin-rol toekennen → audit log naar `admin_actions`
- `verify_jwt = false` in `supabase/config.toml` (we valideren JWT in-code, conform projectstandaard)

## 3. Frontend admin project

In het admin project roept de UI gewoon aan:

```ts
await supabase.functions.invoke('admin-invite-user', {
  body: { email, full_name, is_dealer, dealer_name, make_admin }
})
```

Geen service-role key nodig in de admin frontend — alle privilege werk gebeurt server-side in deze function.

## Wat ik nodig heb van jou

Bevestiging om door te gaan, dan:
1. Maak ik de migratie aan voor `admin_actions`
2. Maak ik `supabase/functions/admin-invite-user/index.ts`
3. Geef ik je de exacte prompt om in het admin project te plakken zodat het de invite-knop tegen deze function laat werken

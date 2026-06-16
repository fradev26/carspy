# autoscout-sync edge function

Deployt automatisch op het VATUUR Lovable Cloud project.
Vereiste secrets zijn al beschikbaar: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Wachtwoordopslag — Vault

Wachtwoorden worden NIET in `autoscout_credentials.password_secret` opgeslagen.
In plaats daarvan zit het wachtwoord versleuteld in `vault.secrets` en bewaart
`autoscout_credentials.password_secret_id` de Vault-UUID.

Twee server-side helpers regelen dit (beide `SECURITY DEFINER`, alleen `service_role`):

- `public.autoscout_save_password(_user_id uuid, _password text) RETURNS uuid`
  Maakt of werkt het Vault-secret bij; gebruikt door `save_credentials`.
- `public.autoscout_get_password(_secret_id uuid) RETURNS text`
  Decrypteert het wachtwoord; gebruikt door `test_connection`, `sync` en
  `cron_sync_all`.

## Acties

POST JSON body `{ action, ... }`:

- `save_credentials` — `{ dealer_user_id, customer_id, username, password? }`
  (password optioneel bij update — laat leeg om bestaand wachtwoord te behouden)
- `test_connection` — `{ dealer_user_id }`
- `sync` — `{ dealer_user_id, trigger?: 'manual'|'cron' }`
- `cron_sync_all` — iterates all stored credentials (service-role only)
- `publish` — `{ internal_listing_id }` zet interne advertentie op `active`

## Cron

`cron_sync_all` wordt elk uur uitgevoerd via `pg_cron` job
`autoscout-cron-sync-all-hourly` (zie migratie `*_autoscout_cron.sql`).

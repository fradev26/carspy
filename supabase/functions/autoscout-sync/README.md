# autoscout-sync edge function

Deploy on the VATUUR Supabase project (jgrxbjkeordnqgqaocbi) as
`supabase/functions/autoscout-sync/index.ts`. Required secrets are auto-present
in Lovable Cloud: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`.

Set `verify_jwt = false` is **not** required — the function validates the
caller's JWT itself for user actions and accepts the service-role key for the
cron action.

## Actions

POST JSON body `{ action, ... }`:

- `save_credentials` — `{ dealer_user_id, customer_id, username, password }`
- `test_connection` — `{ dealer_user_id }`
- `sync` — `{ dealer_user_id, trigger?: 'manual'|'cron' }`
- `cron_sync_all` — iterates all stored credentials (service-role only)
- `publish` — `{ internal_listing_id }` flips internal listing to `active`
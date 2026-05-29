## Plan: Upgrade `admin-bulk-import` met per-rij tracking

Het admin-project wil per-rij feedback, auto-invite van eigenaars, image-validatie en optionele upsert. Daarvoor breiden we de backend uit.

### 1. Database migratie

**Nieuwe tabel `import_job_rows`** (per-rij resultaat):
- `id`, `job_id` (→ import_jobs), `row_index` (int), `status` ('ok' | 'failed' | 'skipped'), `listing_id` (uuid, nullable), `error` (jsonb, nullable), `payload` (jsonb), `created_at`
- RLS: alleen admins kunnen lezen/schrijven via `has_role(auth.uid(), 'admin')`
- GRANTs voor `authenticated` + `service_role`
- Index op `job_id`

**Optioneel (alleen op verzoek):** kolom `external_ref text` op `listings` met unieke index `(user_id, external_ref)` voor échte upsert. Standaard slaan we dit over en valt upsert terug op `(user_id, title)`-match.

### 2. Edge function `admin-bulk-import` uitbreiden

Huidige function vervangen door versie met:

- **Admin-check** via `has_role` RPC op service-role client (bestaat al)
- **Body schema** uitgebreid met:
  - `mode`: `'insert' | 'upsert'` (default `insert`)
  - `target_user_id` blijft, plus optioneel `target_email` + `auto_invite` (boolean)
- **Owner-resolve met auto-invite:**
  - Als `target_user_id` niet bestaat en `target_email` + `auto_invite=true`: roep intern dezelfde flow als `admin-invite-user` aan (`auth.admin.inviteUserByEmail` + profile upsert), gebruik nieuwe id als `user_id`
- **Image URL HEAD-check:**
  - Per rij: `fetch(url, { method: 'HEAD' })` op elke image, content-type moet `image/*` zijn en status 2xx; ongeldige URLs worden uit `images` gefilterd en gerapporteerd in de row-error (rij blijft 'ok' tenzij alle images falen — dan 'failed' alleen als geen geldige images en images verplicht zijn, anders 'ok' met warnings)
- **Batches van 50** (i.p.v. 100) om HEAD-checks beheersbaar te houden
- **Upsert-modus:** voor elke rij eerst `select id from listings where user_id=$1 and title=$2`; bij match → `update`, anders `insert`
- **Per rij**: schrijf record in `import_job_rows` met status + listing_id of error
- **`admin_actions`** logregel bij start en einde (`action: 'bulk_import.started' / 'bulk_import.completed'`, details met counts)
- **Response** bevat `job_id`, `succeeded`, `failed`, `skipped`, en eerste 100 row-errors (frontend kan rest paginatie ophalen via job_id)

### 3. `supabase/config.toml`

`admin-bulk-import` blijft op default (`verify_jwt = false` is niet nodig — JWT wordt in code gevalideerd via `getClaims`). Geen wijziging.

### Technische details

- `npm:@supabase/supabase-js@2` + `npm:@supabase/supabase-js@2/cors` + `npm:zod@3`
- HEAD-fetch met `AbortSignal.timeout(3000)` om langzame URLs niet de hele import te blokkeren
- HEAD-failures worden parallel per rij uitgevoerd met `Promise.all`
- Batch-insert via `admin.from('listings').insert(rows).select('id')` zodat we per rij de listing_id kunnen mappen naar `import_job_rows`
- In upsert-modus per rij sequentieel (kan niet als batch), maar wel parallel binnen de batch via `Promise.all`

### Vraag aan jou

Wil je dat ik ook `external_ref` toevoeg aan `listings` (met unieke index op `user_id, external_ref`) voor echte upsert? Of houden we het op title-match fallback?

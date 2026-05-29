
# Admin Panel voor VATUUR.

Apart Lovable project op `admin.vatuur.be`, dat dezelfde Lovable Cloud / Supabase backend deelt als de publieke app. Zo blijft admin-code volledig gescheiden van de publieke bundle (veiliger), maar werk je op dezelfde database.

## 1. Backend wijzigingen (in dit project, `vatuur`)

Alle DB en edge functions blijven in dit project, omdat het admin project enkel als front-end op dezelfde backend draait.

### 1a. Rollen-systeem (security-correct)
Nieuwe migratie:

- `app_role` enum: `admin`, `moderator`
- Tabel `user_roles (id, user_id, role)` met RLS
- Security definer functie `public.has_role(_user_id uuid, _role app_role)` — voorkomt recursie in policies
- Eerste admin (`admin@vatuur.be`) wordt na signup toegekend via een eenmalige insert

### 1b. Nieuwe / aangepaste RLS policies
Admins krijgen volledige toegang via `has_role(auth.uid(), 'admin')` op:
- `listings` (SELECT/UPDATE/DELETE/INSERT op alle rijen, ook andermans)
- `profiles` (SELECT/UPDATE alle profielen, incl. is_dealer toggle)
- `conversations`, `messages` (read-only voor support)
- `user_roles` (alleen admins kunnen rollen toekennen)

### 1c. Nieuwe tabellen
- `import_jobs (id, user_id, source, status, total, succeeded, failed, error_log jsonb, created_at)` — voor bulk import logging
- `autoscout_sync_config (id, dealer_user_id, autoscout_dealer_id, api_key_secret_ref, enabled, last_sync_at, last_status, frequency_minutes)` — per dealer config voor auto-refresh

### 1d. Edge functions
- `admin-bulk-import` — accepteert CSV/JSON array van listings, valideert per rij met Zod, schrijft naar `listings` + logt naar `import_jobs`. Gebruikt service role, controleert eerst `has_role(caller, 'admin')`.
- `admin-create-listing` — manuele invoer namens een gekozen `user_id`/dealer.
- `autoscout-sync` — haalt voertuigen op via AutoScout24 API (per dealer config), upsert naar `listings` met externe ID matching. Verify_jwt off, intern beveiligd met admin check + cron secret.
- `autoscout-sync-scheduler` — pg_cron job die elke X minuten alle `enabled` configs afgaat.

Secrets nodig: `AUTOSCOUT_API_BASE`, en per dealer eventueel hun eigen credentials (opgeslagen in `autoscout_sync_config` of als named secret).

## 2. Nieuw Lovable project: `vatuur-admin`

Apart project, gehost op `admin.vatuur.be`. Bevat:

### 2a. Setup
- Eigen `.env` met dezelfde `VITE_SUPABASE_URL` + anon key als dit project (kopie uit `.env`)
- Login-only landing: alleen users met rol `admin` mogen door (`has_role` check via RPC bij login, anders forced sign-out)
- Custom domain in Lovable: `admin.vatuur.be` → DNS CNAME bij domain provider

### 2b. Schermen
- **Dashboard**: KPI's (totaal listings, actieve users, dealers, premium count, import jobs vandaag, AutoScout sync status)
- **Listings beheer**: tabel met filters (status, brand, user), inline edit, bulk select voor status/premium/boost/delete
- **Gebruikers & dealers**: lijst profielen, toggle `is_dealer`, rollen toekennen, account deactiveren
- **Manuele listing invoer**: formulier op basis van bestaande Sell-wizard velden, met user/dealer dropdown
- **Bulk import**:
  - Upload CSV of plak JSON
  - Vóór import: column mapping UI (auto-detect + handmatige override naar listing-schema)
  - Preview eerste 10 rijen + validatie errors
  - Run → roept `admin-bulk-import` edge function, toont live progress + error log
  - Downloadbare CSV met afgewezen rijen
- **AutoScout sync**:
  - Lijst van dealers met sync config
  - Per dealer: enable/disable, frequency, last sync result, "Sync nu"-knop
  - Logs van laatste runs

### 2c. Bulk import schema
Aangezien er nog geen voorbeeld is, ondersteunen we het volledige `listings` schema als flexibele import: alle velden uit de tabel (`title, brand, model, year, price, mileage, fuel_type, transmission, body_type, color, power, engine_size, doors, seats, description, features[], images[], city, province`). Verplichte velden: `title, brand, model, year, price, mileage, fuel_type, transmission, body_type, user_id` (of dealer-selectie in UI). Onbekende kolommen → genegeerd met waarschuwing.

## 3. Stappenplan (volgorde van uitvoer)

```
Stap 1 — Backend in dit project
  • Migratie: app_role, user_roles, has_role(), import_jobs, autoscout_sync_config, admin RLS policies
  • Insert van admin@vatuur.be als admin (na eerste signup)
  • Edge functions: admin-bulk-import, admin-create-listing, autoscout-sync, scheduler
  • Secrets: AUTOSCOUT_API_BASE (+ per-dealer credentials zodra bekend)

Stap 2 — Nieuw project vatuur-admin aanmaken
  • Lovable Cloud activeren met dezelfde Supabase URL/anon
  • Auth + admin role guard
  • Schermen bouwen (zie 2b)

Stap 3 — Domain
  • Custom domain admin.vatuur.be koppelen in Lovable project settings
  • DNS CNAME aanmaken bij je registrar

Stap 4 — AutoScout integratie
  • Echte API credentials toevoegen
  • Eerste dealer mappen, sync testen, cron activeren
```

## 4. Technische notes

- We delen 1 Supabase project tussen publieke app en admin app — dat is de aanbevolen aanpak en vermijdt data-duplicatie.
- Admin rollen check gebeurt zowel client-side (UI guard) als server-side (RLS + edge function `has_role` check). Nooit alleen client-side.
- AutoScout24 publieke API: ik check de exacte endpoint/auth-vorm zodra je de credentials klaar hebt (varieert per partnership: Listing API vs. Dealer API).
- Bulk import draait in batches van 100 rijen om timeouts te vermijden.

## 5. Wat ik bij implementatie nodig heb

1. Bevestiging dat ik mag starten met **Stap 1 (backend in dit project)** — daarna maak je zelf het tweede Lovable project aan en zeg je "klaar", dan zet ik de admin UI op.
2. Op termijn: AutoScout24 API credentials + dealer ID(s).

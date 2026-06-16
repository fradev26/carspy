
# Sprint 5 (gewijzigd) — Admin Hub integratie op VATUUR

De Admin Hub vroeg om `sprint1-critical.sql` te draaien en 2 edge functions te deployen. Onderzoek van de huidige VATUUR-DB en de functie-broncode laat zien dat **dit niet 1-op-1 kan**. Onderstaand het plan om het in 3 fases veilig uit te voeren.

## Diagnose — waarom de migratie nu zou breken

| # | Conflict | Gevolg |
|---|---|---|
| 1 | `public.companies` tabel bestaat **niet** op VATUUR | `ALTER TABLE listings ADD COLUMN company_id REFERENCES companies(id)` faalt |
| 2 | `profiles.company_id` bestaat **niet** | Backfill `UPDATE listings SET company_id = p.company_id` faalt |
| 3 | `import_job_rows` bestaat al, maar met kolom **`row_index`** i.p.v. `row_number` (en zonder `payload`) | `CREATE TABLE IF NOT EXISTS` skipt, maar `admin-bulk-import` schrijft `row_number` + `raw` → runtime-error bij elke import |
| 4 | Huidige `listings`-policies heten `Anyone can view active listings`, `Users can create/update/delete own listings`, `Admins can ...` — niet `active listings public` / `owners manage listings` | `DROP POLICY IF EXISTS` raakt niets; daarna **dubbele policies** naast elkaar (oude scoping + nieuwe company-scoping) → verwarrende, te ruime toegang |
| 5 | `profiles` heeft géén `"profiles public read"` policy (al scoped sinds Sprint 1) | DROP heeft geen effect; nieuwe `"profiles scoped read"` komt erbij — geen schade, maar overbodig |
| 6 | `autoscout-sync/index.ts` schrijft naar tabellen `autoscout_credentials`, `autoscout_listings`, `autoscout_sync_runs` — bestaan **niet** | Functie crasht direct bij elke actie |
| 7 | Bestaande tabel `autoscout_sync_config` (met `api_key_secret_ref`, `autoscout_dealer_id`, `frequency_minutes`) wordt **niet** door de Admin Hub-functie gebruikt | Twee parallelle schema-werelden |

Kortom: de Admin Hub gaat uit van een **multi-tenant company-model** dat VATUUR nog niet heeft, plus een ander AutoScout-schema dan we hebben.

## Voorgestelde aanpak — 3 fases

### Fase A — Schema-foundation (blokkerend, ~1u)
Eén migratie die alles wat ontbreekt aanmaakt, mét GRANTs en RLS:

1. **`public.companies`** tabel (`name`, `vat_number`, `created_at`) + GRANT + RLS (leden + admin SELECT, admin INSERT/UPDATE).
2. **`profiles.company_id uuid REFERENCES companies(id) ON DELETE SET NULL`** + index.
3. **`import_job_rows.row_number int`** als generated/alias kolom toevoegen (of `import_job_rows` migreren: rename `row_index` → `row_number` + voeg `payload jsonb` toe). Aanbeveling: rename + voeg `payload` toe, en update `import_job_rows.test`/queries indien aanwezig.
4. **AutoScout-tabellen voor Admin Hub-functie**:
   - `autoscout_credentials (user_id PK, customer_id, username, password_secret, last_sync_at, last_sync_status, last_sync_error)` — `password_secret` als `text` (versleutel in app, niet plaintext bewaren) of refereer naar Vault-key.
   - `autoscout_listings (id, user_id, autoscout_listing_id, internal_listing_id, content_hash, raw_data jsonb, publication_status, sync_status, sync_error, last_seen_at, last_changed_at)` met `UNIQUE (user_id, autoscout_listing_id)`.
   - `autoscout_sync_runs (id, user_id, trigger, status, totals jsonb, error_message, started_at, finished_at)`.
   - Allemaal RLS: eigenaar + admin/stock_manager.
5. **`user_roles`** enum uitbreiden met `'stock_manager'` als die nog niet bestaat (functie checkt erop).

### Fase B — Sprint1-critical (~30 min)
Pas pas dán een **aangepaste versie** van `sprint1-critical.sql` draaien — alleen de delen die nog relevant zijn:
- Indexen (#1) → veilig, idempotent.
- `listings.company_id` policies (#2) → herschreven om bestaande policies eerst correct te DROPpen op de **echte** namen.
- Skip #3 (profiles is al scoped).
- Skip #4 (`import_job_rows` regelen we in Fase A).

Plus een verificatie-block die we ook echt uitvoeren.

### Fase C — Edge functions deploy + secrets (~30 min)
1. **`admin-bulk-import`** kopiëren naar `supabase/functions/admin-bulk-import/index.ts` (Lovable Cloud deploy't auto). Patch alleen de Deno `serve`-import naar `Deno.serve` of laat std@0.224.0 zoals is — onze stack ondersteunt beide. CORS via gedeelde header — file van Admin Hub gebruikt eigen CORS-const wat OK is.
2. **`autoscout-sync`** + `mapping.ts` kopiëren. Vereist daarna per dealer credentials via de `save_credentials` action — geen project-wide secret nodig.
3. **Cron**: optioneel een `*/30 * * * *` schedule die `cron_sync_all` aanroept (analoog aan de bestaande boost-expiry cron). Doe ik alleen als je 'ja' zegt — anders moet de Admin Hub manueel triggeren.

## Open vragen vóór ik kan starten

1. **Company-model**: VATUUR heeft nu losse `is_dealer` + `dealer_name` op `profiles`. Akkoord dat ik een aparte `companies`-tabel toevoeg en dealers daaraan koppel via `profiles.company_id`? (Dit verandert niets aan de UI tot Admin Hub er gebruik van maakt.)
2. **AutoScout password opslag**: plaintext-kolom (`text`, RLS-beveiligd, service_role-only read) of via Supabase Vault? Plaintext is wat de Admin Hub-functie momenteel verwacht (`password_secret` als string). Voor MVP volstaat plaintext + strikte RLS.
3. **`import_job_rows` migratie**: kolom rename `row_index` → `row_number` (breekt evt. bestaande readers in VATUUR-app) **of** dubbele kolom (`row_number` als generated alias van `row_index`)? Ik raad rename aan en check tegelijk of de VATUUR-app deze kolom gebruikt.
4. **AutoScout cron**: meteen plannen of pas activeren als de Admin Hub UI klaar is?
5. **Rooktest-reminder**: nog steeds open uit Sprint 2 — meenemen in deze sprint of na publish?

## Technische details

### Voor de migratie (Fase A) maken we
- 5 nieuwe tabellen / kolommen, allemaal met GRANT + RLS in dezelfde migratie (volgens de public-schema-grants regel).
- 2 nieuwe indexen (`autoscout_listings UNIQUE` + `autoscout_sync_runs(user_id, started_at DESC)`).
- 0 wijzigingen aan `auth.*` / `storage.*` / triggers op gereserveerde schemas.

### Voor de aangepaste sprint1-critical (Fase B)
Concreet de DROPs herschrijven naar:
```sql
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can create own listings"   ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings"   ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings"   ON public.listings;
-- Admins-policies blijven staan: die zijn al correct.
```
en daarna de twee nieuwe combined policies (`listings public read` + `owners manage listings`) zoals in het origineel.

### Edge functions
- Beide functies gebruiken `https://deno.land/std@0.224.0/http/server.ts` en `esm.sh/@supabase/supabase-js@2.45.0`. Werkt in Lovable Cloud edge runtime; geen wijziging nodig.
- Geen extra project-secrets — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` zijn al aanwezig.

### Wat we **niet** doen in Sprint 5
- Geen UI-wijzigingen in VATUUR (Admin Hub doet de UI).
- Geen rooktest (blijft openstaande reminder).
- Geen E2E tests uit het oorspronkelijke Sprint 5 voorstel — die schuiven naar Sprint 6.

## Volgorde van uitvoering na approval
1. Bevestig de 5 open vragen (kort, 1-regel antwoorden volstaan).
2. Migratie Fase A (1 SQL-call via migration tool, vraagt je approval).
3. Migratie Fase B (1 SQL-call, vraagt je approval).
4. Edge function files kopiëren (3 bestanden, auto-deploy).
5. Verificatie-queries draaien + terugkoppeling.
6. (Optioneel) cron schedulen.

## Doel

Dealers moeten zelf hun AutoScout24-koppeling kunnen beheren en synchroniseren vanuit hun zakelijk dashboard, met dezelfde `autoscout-sync` edge function die de Admin Hub gebruikt. Geen achtergrond-cron — sync gebeurt op verzoek (dealer of admin).

## Wat er nu mis is

- `autoscout-sync` autoriseert enkel `admin` of `stock_manager`. Een dealer (`profiles.is_dealer = true`, geen rol) krijgt 401.
- De geplande pg_cron (`autoscout-cron-sync-all-hourly`) past niet meer bij deze keuze en de Vault-secret-setup is daardoor overbodig.
- VATUUR heeft nog géén UI voor dealers om credentials op te slaan of een sync te starten.

## Aanpak in 3 stappen

### 1. Edge function autorisatie verbreden (`supabase/functions/autoscout-sync/index.ts`)

Voeg een derde caller-type `"dealer"` toe naast `service` / `user`:

- Caller is ingelogd én `profiles.is_dealer = true` (of heeft rol `admin` / `stock_manager`).
- Voor `save_credentials`, `test_connection`, `sync`, `publish`: dealer mag enkel als `dealer_user_id === auth.uid()` (of zijn eigen `internal_listing_id` bij publish). Admin/stock_manager mag voor elke dealer.
- `cron_sync_all` blijft `service`-only (ongebruikt na stap 3, maar laten staan voor toekomst).
- Verwijder ook de `CRON_SECRET`-bypass die we net toevoegden (niet meer nodig).

### 2. Cron + ongebruikte Vault-state opruimen

- `cron.unschedule('autoscout-cron-sync-all-hourly')` via insert-tool.
- `CRON_SECRET` edge-function-secret laten staan (kost niets) of via `delete_secret` opruimen — voorkeur opruimen.
- README van `autoscout-sync` updaten: geen cron meer, dealer-flow toegevoegd.

### 3. Dealer-UI: AutoScout-tab in BusinessDashboard

Nieuwe sectie `src/modules/dealer/AutoScoutPanel.tsx`, ingehaakt in `src/pages/BusinessDashboard.tsx` (achter `is_dealer`-guard):

- **Credentials-form**: customer_id, username, password (laat password leeg om bestaand te behouden). Verstuurt `action: 'save_credentials'` met `dealer_user_id = auth.uid()`.
- **Test-knop**: `action: 'test_connection'` → toast met resultaat.
- **Sync-knop**: `action: 'sync'` → loading-state + toast met totals (`new/changed/unchanged/errors`).
- **Laatste run + status**: lees `autoscout_credentials.last_sync_at / last_sync_status / last_sync_error` + laatste 5 runs uit `autoscout_sync_runs` (RLS staat dealer al toe via eigen `user_id`).
- **Geïmporteerde listings**: link naar `/zakelijk` voorraadtab met filter op recent geïmporteerd (optioneel — buiten scope deze sprint indien tijd kort).

### 4. Verificatie

- Vitest blijft groen (35/35).
- Manueel: ingelogd als dealer → tab opent → save_credentials → test_connection → sync → run verschijnt in lijst.
- Edge function logs checken op 401's.

## Technische details

**Auth-check in edge function** (vereenvoudigd):

```ts
// in getCaller(): naast admin/stock_manager
const { data: profile } = await svc.from('profiles').select('is_dealer').eq('id', userId).maybeSingle();
const isDealer = !!profile?.is_dealer;
if (!isAdmin && !isStockManager && !isDealer) return { kind: 'none' };
return { kind: 'user', userId, isAdmin, isStockManager, isDealer };
```

**Per-action scoping** in elke `case`:

```ts
if (!caller.isAdmin && !caller.isStockManager && caller.userId !== dealer_user_id) {
  return json({ error: 'Forbidden' }, 403);
}
```

**RLS-impact**: geen. `autoscout_credentials`, `autoscout_listings`, `autoscout_sync_runs` worden alleen door de service-role client in de edge function gemuteerd; RLS-policies blijven ongewijzigd. Dealer ziet zijn eigen rijen via de bestaande policies (eigenaar + admin).

**Wijzigingen aan files**:
- `supabase/functions/autoscout-sync/index.ts` — uitgebreide `getCaller` + per-action scoping, weghalen CRON_SECRET-bypass.
- `supabase/functions/autoscout-sync/README.md` — sectie cron weghalen, dealer-flow uitleggen.
- `src/modules/dealer/AutoScoutPanel.tsx` (nieuw) — UI.
- `src/pages/BusinessDashboard.tsx` — extra tab/sectie inhaken.
- Eén insert-call: `cron.unschedule(...)`.
- Eén `delete_secret('CRON_SECRET')`.

## Wat we NIET doen

- Geen pg_cron achtergrondsync.
- Geen wijziging aan `autoscout_credentials` schema (Vault-flow blijft).
- Geen Admin Hub UI-aanpassingen (die orchestreert via dezelfde function met service-role).
- Geen E2E rooktest (blijft open reminder).
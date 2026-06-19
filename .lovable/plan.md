# Voorraadvoorkeuren — wizard met slimme defaults op `/zakelijk/voorraad-instellingen`

## Vertaling naar de auto-context

VATUUR werkt met unieke voertuigen (1 stuk per advertentie). De originele wizard is e-commerce-geïnspireerd, dus elke sectie wordt hergebruikt maar inhoudelijk vertaald zodat ze écht zinvol zijn voor dealers — geen lege stuksaantallen.

| Origineel concept | Vertaling voor VATUUR |
| --- | --- |
| Stuksvoorraad per product | Vervalt; voorraad = aantal actieve advertenties (dealerniveau) |
| Verkocht = verminderen | Markeer advertentie automatisch als "Verkocht" na bevestiging in messaging |
| Voorraad 0 → actie | Wagen verkocht → blijf zichtbaar / verberg / archiveer na N dagen |
| Lage voorraad | Waarschuwing wanneer actief aanbod onder drempel zakt |
| Opnieuw aanbieden | Bij annulering van reservatie de advertentie automatisch heractiveren |
| Reserveringen | Reserveer advertentie tijdens lopend gesprek (lock op contactname) |

## 1. Route & navigatie

Nieuwe route `/zakelijk/voorraad-instellingen` (lazy in `src/App.tsx`), beschermd door `SettingsRouteGuard requires="dealer"`. Update de "Voorraadvoorkeuren"-link in `src/pages/dealer/Settings.tsx` (regel 135) en voeg een knop "Voorkeuren" toe naast de header van `src/pages/dealer/Inventory.tsx`. `/zakelijk/voorraad` blijft de advertentielijst.

## 2. Database

Nieuwe tabel `public.dealer_inventory_preferences` (één rij per dealer, `user_id` PK), bevat alle wizard-velden met defaults zodat een eerste bezoek meteen "slimme defaults" toont:

```text
auto_update_enabled bool default true
update_method text default 'manual'           -- 'manual' | 'autoscout'
default_listing_status text default 'active'  -- 'active' | 'draft'
auto_mark_sold bool default true
on_sold_action text default 'keep_visible'    -- 'keep_visible' | 'hide' | 'archive_after_days'
archive_after_days int default 30
low_stock_threshold int default 3
low_stock_push bool default true
low_stock_email bool default true
auto_relist_on_cancel bool default true
relist_delay_minutes int default 5
reservation_enabled bool default true
reservation_minutes int default 30
allow_negative_stock bool default false       -- placeholder advanced
allow_backorders bool default false           -- placeholder advanced
auto_generate_vin_ref bool default false
sync_interval_minutes int default 60
```

RLS: dealer beheert eigen rij; helper-RPC `get_or_create_inventory_preferences()` initialiseert defaults on-demand. GRANT op `authenticated` en `service_role`.

Uitbreiding `public.listings` voor reservatie + auto-archive:
```text
reserved_by uuid references auth.users(id)
reserved_until timestamptz
auto_archive_at timestamptz
```
RLS-policies blijven gelden; reserved-velden alleen beschrijfbaar via edge function (zie §5).

## 3. UI-architectuur

Nieuw bestand `src/pages/dealer/InventoryPreferences.tsx` met:
- Tweekoloms-layout op desktop: links wizard-kaarten, rechts sticky live-preview ("iPhone 15"-style maar voor wagen — gebruik dummy voorbeeld "BMW 320d · status actief → na verkoop: gearchiveerd"). Op mobiel: enkel kolom, preview vervalt.
- Sticky onderbalk: "Wijzigingen niet opgeslagen · Annuleren · Opslaan" (toont enkel bij `isDirty`). Bouw met `useFormState`-achtige hook (React state, geen extra lib). Primair-knop in VATUUR-roze.
- Sectie-kaarten in dezelfde stijl als `Subscription.tsx` (rounded-xl, border-border/60, p-5, gradient hero).
- Elke optie heeft 1-regel context-tekst onder het label (geen info-iconen).
- Toggles via `Switch` (radix-ui) voor alle aan/uit-keuzes; radio's blijven enkel voor 3-staat-keuzes ("Bij verkoop"-actie).

### Kaartstructuur

1. **Overzicht** — hero met `Voorraadbeheer actief`-badge, `Switch` voor "Automatisch voorraad bijwerken", `RadioGroup` voor methode (Handmatig / Automatisch via AutoScout24). Verwijst naar AutoScout-instellingen als methode = automatisch.
2. **Bij nieuwe advertenties** — `RadioGroup` standaard status (Actief / Concept).
3. **Wanneer een wagen verkocht is** — `Switch` auto-markeren als verkocht na bevestiging in messaging + `RadioGroup` voor wat erna gebeurt (Zichtbaar laten · Verbergen uit zoekresultaten · Archiveer na N dagen) met conditionele `Input` voor N.
4. **Lage voorraad** — `NumberInput` drempel + `Switch` pushmelding + `Switch` email. Live-tekst: "Je hebt nu X actieve advertenties" (count uit listings).
5. **Automatisch heractiveren** — `Switch` + `NumberInput` minuten vertraging. Tekst beschrijft: bij geannuleerde reservatie of teruggetrokken bod.
6. **Reserveringen** — `Switch` + `NumberInput` vervaltijd. Toont uitleg: bij eerste contactname wordt advertentie X minuten geblokkeerd voor andere geïnteresseerden.
7. **Bulkacties** — apart kaartblok met 5 grote knoppen (`Pauzeren`, `Heractiveren`, `Markeer als verkocht`, `Importeren via CSV`, `Exporteren CSV`). Knoppen openen bestaande flows (`/zakelijk/import` voor import) of een nieuw `BulkActionDialog` met multi-select uit listings.
8. **Geavanceerd** — `<Collapsible>` standaard dicht. Bevat: negatieve voorraad toestaan, backorders, automatisch VIN-referentie genereren, sync-interval (slider 15/30/60/120/240 min). Subtiele "Power user"-badge.

Validatie via `zod` (`InventoryPrefsSchema`). State-hook `useInventoryPreferences()` in `src/hooks/` voor load + save (TanStack Query mutation, optimistic).

## 4. Achtergrondlogica (cron + triggers)

Edge functions in `supabase/functions/`:

- **`inventory-reservation-expire`** — cronjob elke minuut via `pg_cron` + `pg_net`. Zet `reserved_by/reserved_until` terug op `null` waar `reserved_until < now()`. Als `auto_relist_on_cancel` aan staat en de listing was tijdelijk verborgen → status terug op `active` na `relist_delay_minutes`.
- **`inventory-low-stock-check`** — dagelijkse cron + getriggerd door listing-status-mutaties (Postgres trigger met `pg_net.http_post`). Telt actieve listings per dealer; als < drempel: respect `notification_preferences` én voorkeuren in nieuwe tabel, verstuur via bestaande notificatie-pipeline (push + email).
- **`inventory-auto-archive`** — cronjob dagelijks. Voor listings met `status='sold'` en `sold_at < now() - archive_after_days` → status `archived` (vereist enum-uitbreiding indien niet aanwezig; check eerst, anders gebruik bestaande `inactive`).
- **DB-trigger `on_message_sale_confirmed`** — wanneer messaging een verkoop-bevestiging registreert (bestaand mechanisme; controleer eerst, anders sla deze trigger over en laat de "Markeer verkocht"-knop in `ListingOperating` de voorkeur respecteren).

Bulk-import herbruikt bestaande `import_jobs`-tabel + `/zakelijk/import` route. Export = nieuwe edge function `inventory-export` die CSV streamt op basis van filters.

## 5. Reservatiemechanisme in messaging

In `src/pages/Messages.tsx`: bij eerste outbound bericht van koper naar dealer over een listing → check prefs; als `reservation_enabled`, roep `reserve-listing` edge function aan die `reserved_by` + `reserved_until = now() + reservation_minutes` zet en concurrent reservaties verhindert (`reserved_by IS NULL OR reserved_by = auth.uid()`). UI toont "Gereserveerd tot HH:MM" op `ListingDetail`. Andere bezoekers zien "Tijdelijk gereserveerd"-badge en kunnen alleen alert instellen.

## 6. Out of scope (deze sprint)

- Echte AutoScout24 push-sync interval-wijziging — voorkeur wordt opgeslagen, sync-job leest hem bij volgende run.
- Verfijnde permissions voor bulkacties met >100 listings (batched via job, simpele cap).
- Visuele Excel-template-builder — gebruik bestaande importflow.
- Notificatie-translaties voor andere talen dan NL-BE.

## 7. Bestanden

**Nieuw:**
- `src/pages/dealer/InventoryPreferences.tsx`
- `src/hooks/useInventoryPreferences.ts`
- `src/lib/inventoryPrefsSchema.ts`
- `src/components/inventory/PreferenceCard.tsx`
- `src/components/inventory/InventoryPreview.tsx`
- `src/components/inventory/StickySaveBar.tsx`
- `src/components/inventory/BulkActionDialog.tsx`
- `supabase/functions/inventory-reservation-expire/index.ts`
- `supabase/functions/inventory-low-stock-check/index.ts`
- `supabase/functions/inventory-auto-archive/index.ts`
- `supabase/functions/reserve-listing/index.ts`
- `supabase/functions/inventory-export/index.ts`

**Gewijzigd:**
- `src/App.tsx` (route + lazy import + guard)
- `src/pages/dealer/Settings.tsx` (linkpad)
- `src/pages/dealer/Inventory.tsx` (knop "Voorkeuren")
- `src/pages/Messages.tsx` (reservatie-call bij eerste contact)
- `src/pages/ListingDetail.tsx` (reservatie-badge)

**Migraties:**
1. Tabel `dealer_inventory_preferences` + GRANTs + RLS + `get_or_create_inventory_preferences()`.
2. Kolommen op `listings`: `reserved_by`, `reserved_until`, `auto_archive_at` (+ index op `reserved_until`).
3. `pg_cron`-jobs registreren via `insert`-tool (user-specifieke URL/anon-key, geen migratie).

## 8. Verificatie

- Build groen + 0 TS-errors.
- Playwright: open `/zakelijk/voorraad-instellingen` als dealer, toggle drie velden, verwacht "Wijzigingen niet opgeslagen"-bar, klik Opslaan, reload → waarden persistent.
- Mobiele snapshot (375px) — geen horizontale scroll, secties in opgegeven volgorde.
- DB-check: tweede dealer kan voorkeuren van eerste dealer niet lezen (RLS-test via `psql`).
- Cron-jobs handmatig getriggerd via `supabase.functions.invoke`-knop in dev om expiratie + low-stock te valideren.

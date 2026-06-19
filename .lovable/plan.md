# Plan: Publicatie-instellingen per koppeling

## Doel
Verwijder "Automatische publicatie" als losse stub uit Settings en geef elke koppeling zijn eigen kaart "Publicatie-instellingen". AutoScout24 krijgt een werkende kaart; Marktplaats / Mobile.de / Facebook Marketplace krijgen visueel dezelfde kaart in een disabled "Binnenkort"-staat.

## 1. Settings opruimen — `src/pages/dealer/Settings.tsx`
- Verwijder `<SettingsRow icon={Send} label="Automatische publicatie" onClick={soon} />` (regel 137).
- Verwijder `Send`-import als nergens anders gebruikt.
- Onder "Koppelingen" worden Marktplaats / Mobile.de / Facebook nu links naar hun eigen sheet (in plaats van enkel `disabled`), die de read-only stub-kaart toont.

## 2. Database — uitbreiden `autoscout_credentials`
`autoscout_sync_config` is admin-only en niet door de panel gebruikt; `autoscout_credentials` is wél de bron van waarheid voor de dealer (RLS: per `user_id`). We breiden die tabel uit met de publicatie-velden zodat dealers ze zelf kunnen beheren binnen bestaande RLS.

Migratie voegt kolommen toe met veilige defaults (publicatie uit, alleen import, handmatige sync):

```
ALTER TABLE public.autoscout_credentials
  ADD COLUMN auto_publish            boolean NOT NULL DEFAULT false,
  ADD COLUMN sync_direction          text    NOT NULL DEFAULT 'import_only'
    CHECK (sync_direction IN ('import_only','export_only','both')),
  ADD COLUMN publish_new_vehicles    boolean NOT NULL DEFAULT false,
  ADD COLUMN sync_price              boolean NOT NULL DEFAULT true,
  ADD COLUMN sync_photos             boolean NOT NULL DEFAULT true,
  ADD COLUMN sync_description        boolean NOT NULL DEFAULT true,
  ADD COLUMN sync_specs              boolean NOT NULL DEFAULT true,
  ADD COLUMN remove_on_sold          boolean NOT NULL DEFAULT true,
  ADD COLUMN sync_stock              boolean NOT NULL DEFAULT true,
  ADD COLUMN draft_mode              boolean NOT NULL DEFAULT false,
  ADD COLUMN sync_schedule           text    NOT NULL DEFAULT 'manual'
    CHECK (sync_schedule IN ('manual','15min','hourly','daily')),
  ADD COLUMN sync_priority           text    NOT NULL DEFAULT 'normal'
    CHECK (sync_priority IN ('low','normal','high'));
```

Geen nieuwe RLS nodig — bestaande "Dealers manage own AutoScout creds" policy dekt alles.

## 3. Generiek UI-component — `src/components/dealer/ConnectionPublicationCard.tsx`
Eén herbruikbare kaart met sectiestructuur uit het briefing-document:
- Statusbalk bovenaan: 🟢 Actief / 🟡 Alleen import / 🔵 Alleen export / ⚪ Uitgeschakeld — afgeleid uit `auto_publish` + `sync_direction`.
- Secties: Publicatie inschakelen (Switch), Synchronisatierichting (RadioGroup), Nieuwe voertuigen (Switch), Wijzigingen (4 switches: prijs/foto's/omschrijving/specs), Verkoop (2 switches: verwijderen/voorraad), Conceptmodus (Switch), Planning (RadioGroup), Prioriteit (RadioGroup).
- Onder elke optie een korte uitlegregel (geen info-iconen).
- Onderaan "Live samenvatting" — lijst van ✓/✕-regels die de actieve combinatie samenvatten ("Nieuwe voertuigen publiceren", "Prijzen synchroniseren", "Tweeweg synchronisatie", …).
- Props: `value`, `onChange`, `onSave`, `saving`, `disabled` (voor stub-koppelingen), `disabledMessage`.

VATUUR-stijl: donkere kaarten met `border-border/60`, primaire roze "Opslaan"-CTA, toggles overal i.p.v. dropdowns.

## 4. AutoScoutPanel — `src/modules/dealer/AutoScoutPanel.tsx`
- Laad publicatie-velden mee in `load()` uit `autoscout_credentials`.
- Voeg derde kaart toe (na credentials, vóór "Recente sync-runs"): `<ConnectionPublicationCard ... />`.
- "Opslaan" doet `update(...).eq('user_id', user.id)`.
- "Sync nu" en cron-driven sync respecteren voortaan `sync_direction`, `sync_schedule`, en de granulaire toggles in de edge function (zie volgende sectie).

## 5. Stub-sheets voor Marktplaats / Mobile.de / Facebook
Nieuwe lichte component `src/components/dealer/ComingSoonConnectionPanel.tsx` die de `ConnectionPublicationCard` rendert in disabled-state met een banner "Deze koppeling komt binnenkort beschikbaar." Settings opent voor elk een Sheet die deze component toont, zodat het visuele patroon één lijn loopt.

## 6. Edge function — `supabase/functions/autoscout-sync/index.ts`
Laad `autoscout_credentials` row, en respecteer:
- `auto_publish === false` → cron-trigger slaat sync over (manual trigger blijft werken).
- `sync_direction`: `import_only` doet enkel pull, `export_only` enkel push, `both` doet beide.
- Per-veld toggles bepalen welke kolommen in `listings` worden bijgewerkt bij een pull (prijs/foto's/omschrijving/specs).
- `remove_on_sold`/`sync_stock` bepaalt of een listing op "sold/archived" wordt gezet wanneer ze in de AS24-feed verdwijnt.
- `draft_mode === true` → nieuwe listings krijgen `status='draft'` in plaats van `'active'`.

Geen fallback naar oude globale instellingen — die bestonden alleen als stub.

## 7. Cron-schema
Bestaande AutoScout-cron blijft draaien, maar de functie skipt early wanneer `auto_publish=false` of `sync_schedule='manual'`. `15min`/`hourly`/`daily` wordt gerespecteerd door `last_sync_at` te checken vóór een nieuwe run start.

## Out of scope
- Echte werkende koppelingen voor Marktplaats / Mobile.de / Facebook (blijven stubs).
- Migratie van bestaande "Automatische publicatie"-data: er bestaat geen data om te migreren (was een onaangesloten stub).
- Per-listing publicatie-overrides.

## Acceptatie
- "Automatische publicatie"-rij is weg uit Settings.
- AutoScout24-sheet toont werkende Publicatie-instellingen-kaart + live samenvatting.
- Marktplaats / Mobile.de / Facebook-sheets tonen dezelfde kaart disabled met "Binnenkort"-banner.
- AutoScout-sync respecteert per-koppeling de nieuwe toggles; cron skipt wanneer uit.
- Nieuwe koppelingen starten met `auto_publish=false`, `sync_direction='import_only'`, `sync_schedule='manual'`.

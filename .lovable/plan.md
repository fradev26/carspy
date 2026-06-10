
# VATUUR Listing datacontract — implementatie

Het doel: één schema voor manuele én AutoScout24-listings, en een detail- + kaart- + filterweergave die de nieuwe velden + eenheden respecteert.

## 1. Database — migratie op `public.listings`

De huidige tabel mist het grootste deel van de contract-kolommen. Eén migratie voegt alles toe (allemaal nullable, geen breaking change voor bestaande rijen).

**Nieuwe kolommen** (idempotent, `ADD COLUMN IF NOT EXISTS`):

- Identificatie & herkomst: `source text default 'manual'`, `as24_listing_id text`, `as24_publication_status text`, `vin text`, `licence_plate text`, `cross_reference_id text`, `offer_reference_id text`, `vehicle_type text`, `condition_type text`, `model_version text`
- Eenheden + extra specs: `mileage_unit text default 'km'`, `power_unit text default 'kW'`, `alloy_wheel_size int`, `alloy_wheel_size_unit text default 'inch'`, `empty_weight int`, `empty_weight_unit text default 'kg'`, `door_count int`, `seat_count int`
- Motor & aandrijving: `additional_fuel_types text[]`, `cylinder_capacity int`, `cylinder_capacity_unit text default 'ccm'`, `cylinder_count int`, `drivetrain text`, `gear_count int`
- Verbruik & emissies: `co2_emissions numeric`, `co2_emissions_unit text default 'g/km'`, `consumption_combined numeric`, `consumption_city numeric`, `consumption_country numeric`, `combined_unit text default 'l/100km'`, `emission_class text`, `emission_sticker text`, `efficiency_class text`, `particle_filter bool`
- Registratie & ownership: `first_registration_date date`, `previous_owner_count int`, `country_version text`
- Prijs & btw: `price_public int`, `price_dealer int`, `price_negotiable bool`, `vat_deductible bool`, `vat_rate numeric`
- Garantie & inspectie: `warranty_months int`, `warranty_unit text default 'months'`, `warranty_type text`, `warranty_details text`, `inspection_date date`, `next_inspection_date date`
- Vrije lijsten: `equipment text[]`, `highlights text[]`, `included_services text[]`, `publication_channels text[]`
- Geneste jsonb: `service_history jsonb`, `leasing_offers jsonb`, `marketing jsonb`, `publication jsonb`, `availability jsonb`, `condition jsonb`
- Catch-all: `specs jsonb`, `raw_autoscout jsonb`

**Trigger**: bij INSERT/UPDATE `price_public spiegelen naar price` (en omgekeerd als enkel `price` gezet is) zodat oude code blijft werken.

**RLS**: bestaande policies blijven. Eén extra restrictieve regel: kolom `raw_autoscout` wordt nooit naar anon gestuurd — in de client expliciet niet selecteren (RLS kan geen column-level masking voor anon zonder view; we lossen dit op door in `useListings` / detail-query enkel whitelisted kolommen te selecteren, en `raw_autoscout` enkel achter een admin-check te halen).

Indexen: `CREATE INDEX IF NOT EXISTS` op `(source)`, `(as24_listing_id)`, `(vin)`, `(brand, model)`.

## 2. Types — `src/types/listing.ts`

Uitbreiden van de `Listing` interface met optionele velden die de UI gebruikt:

```text
modelVersion?, mileageUnit?, powerUnit?, source?, asPublicationStatus?,
vin?, licencePlate?, vehicleType?, conditionType?,
drivetrain?, cylinderCapacity?, cylinderCount?, gearCount?, additionalFuelTypes?[],
co2Emissions?, consumptionCombined?, consumptionCity?, consumptionCountry?,
emissionClass?, emissionSticker?, efficiencyClass?, particleFilter?,
firstRegistrationDate?, previousOwnerCount?, countryVersion?,
pricePublic?, priceNegotiable?, vatDeductible?, vatRate?,
warrantyMonths?, warrantyType?, warrantyDetails?, inspectionDate?, nextInspectionDate?,
equipment?[], highlights?[], includedServices?[],
serviceHistory?, leasingOffers?, marketing?, availability?, condition?, specs?
```

`features` blijft als alias voor `equipment` (backward compat).

## 3. Data-laag — `src/hooks/useListings.ts` + nieuwe `useListing(id)`

- `useListings`: blijft `status = 'active'`, maar `select(...)` met whitelist (geen `raw_autoscout`). Mapper uitbreiden zodat nieuwe kolommen → camelCase props op `Listing`. `price` valt terug op `price_public` als `price` null is.
- Nieuwe hook `useListing(id)` (Supabase) vervangt `getListingById` uit mockdata. Filter `status = 'active'` voor anon. Haalt profiel via dezelfde fallback-join.

## 4. UI — `src/pages/ListingDetail.tsx`

Vervangt mock-fetch door `useListing`. Secties volgens contract:

1. **Hero**: `title`, `brand model modelVersion`, `pricePublic ?? price`, premium badge, badge "AutoScout24 import" als `source === 'autoscout'`, hoofdafbeelding.
2. **Specs-grid**: bouwjaar, km (`mileage` + `mileageUnit`), brandstof, transmissie, vermogen (`kW + pk` afgeleid via `Math.round(kW * 1.36)`), carrosserie, kleur, deuren (`doorCount ?? doors`), zetels (`seatCount ?? seats`), drivetrain.
3. **Verbruik & emissies**: alleen rendered als minstens één van `consumptionCombined/city/country`, `co2Emissions`, `emissionClass`, `efficiencyClass`, `emissionSticker`, `particleFilter` is gezet.
4. **Uitrusting + Highlights**: chips uit `equipment` (fallback `features`) en `highlights`.
5. **Beschrijving**: `description`, `whitespace-pre-line`.
6. **Garantie & inspectie**: card als `warrantyMonths` / `warrantyType` / `inspectionDate` / `nextInspectionDate` ingevuld zijn.
7. **Dealer-info** uit `profiles` (al via mapper).
8. Badges: "Btw aftrekbaar" als `vatDeductible`, "Prijs bespreekbaar" als `priceNegotiable`.

Helpers (in `src/lib/units.ts`, nieuw bestand): `formatPower(kw)`, `formatConsumption(value, unit)`, `formatNumberWithUnit(value, unit)`, `kwToPk(kw)`.

JSON-LD `Vehicle` aanvullen met `vehicleIdentificationNumber` (VIN), `bodyType`, `fuelConsumption`, `emissionsCO2`, `dateVehicleFirstRegistered`, `vehicleConfiguration`.

## 5. UI — `src/modules/listings/ListingCard.tsx`

Toevoegen onder titel: `modelVersion` (klein, muted). Naast `Top`-badge:

- "AutoScout24" badge bij `source === 'autoscout'`
- "Btw aftrekbaar" badge bij `vatDeductible`

Vermogen-chip met kW + pk als `power` aanwezig.

## 6. Filtering — `src/pages/Search.tsx` + `FilterPanel`

Bestaande filters (merk, model, brandstof, transmissie, carrosserie, prijs-, km-, jaar-range, premium-only) zijn al aanwezig. Toevoegen / verifiëren:

- Premium-only checkbox (al aanwezig — alleen verifiëren dat `isPremium OR boost_until > now()`).
- Sort default `created_at desc`, opties `price asc/desc`, `mileage asc` (al aanwezig).

Geen nieuwe filters in scope tenzij gevraagd — het contract zegt "minstens", en de huidige set voldoet.

## 7. Mockdata / cleanup

`src/data/mockListings.ts` blijft enkel voor `getRelatedListings` op detailpagina; vervangen door Supabase-query "zelfde merk, andere id, limit 3, status=active". `getListingById` wordt verwijderd uit gebruik.

## 8. Tests

- Snapshot/unit voor `formatPower(120) === '120 kW · 163 pk'`.
- Detail-pagina rendert "Verbruik & emissies"-sectie alleen als data aanwezig.
- AS24-badge zichtbaar als `source === 'autoscout'`.

## Technische details

- TypeScript-types in `src/integrations/supabase/types.ts` worden door Lovable Cloud geregenereerd na de migratie — code die nieuwe kolommen leest komt pas dáárna.
- `raw_autoscout` wordt nooit in een client-side `select('*')` opgenomen; whitelist gebruikt.
- Eenheden komen altijd uit de bijhorende `*_unit` kolom; nooit hardcoden behalve voor de kW→pk afleiding.
- Backward compat: oude rijen zonder `price_public` blijven werken via `price`-fallback.

## Out of scope

- AutoScout24 import-pipeline zelf (admin-platform schrijft direct).
- Schrijven naar nieuwe velden via de wizard `Sell.tsx` — apart op te pakken; deze plan dekt enkel lezen/tonen.
- Aparte view voor `raw_autoscout` admin-debug.

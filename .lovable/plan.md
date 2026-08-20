# Zoekfunctionaliteit /zoeken optimaliseren

Doel: /zoeken dichter bij AutoScout24 brengen op zes punten, zonder de bestaande architectuur te wijzigen (één doorlopende sidebar, live filtering, geen popovers, chips + sectiebadges, URL-state blijft leidend).

## 1. Facetten met telling per optie (hoogste impact)

- Nieuwe database-functie `public.search_facets(_filters jsonb)` die in één query per dimensie (brandstof, carrosserie, transmissie, aandrijving, kleur, provincie, verkopertype, staat, opties) het aantal actieve advertenties teruggeeft.
- Semantiek: voor elke dimensie tellen we mét alle actieve filters behalve die dimensie zelf (zo blijft "Diesel (128)" zichtbaar naast een al aangevinkte "Benzine").
- Nieuwe hook `useSearchFacets(filters, query)` met TanStack Query, 250 ms debounce op de filterinput en `keepPreviousData`, zodat snel klikken geen flikkering of vertraging geeft.
- FilterPanel toont `Label (n)`; opties met 0 blijven staan maar krijgen `opacity-50`, `disabled` en `aria-disabled`. Al aangevinkte opties blijven altijd klikbaar (anders kan de gebruiker niet meer deselecteren).

## 2. Zoekveld in lange optielijsten

- Zoekinput boven "Opties & Extra's" (en elke lijst > 15 opties). Filtert live op label binnen de bestaande categoriegroepen; lege categorieën worden verborgen.
- Typen klapt automatisch de volledige lijst uit (bestaande "Meer opties tonen" blijft bestaan en gaat terug naar ingeklapt zodra het zoekveld leeg is).

## 3. Meerdere merken/modellen combineren

- `SearchFilters.brand`/`model` worden `brands: string[]` en `models: string[]` (opgeslagen als `merk:model`), met back-compat parsing van oude `brand=`/`model=` URL's.
- UI: doorzoekbare merkenlijst met checkbox per merk; onder een aangevinkt merk verschijnen de modellen met bovenaan "Alle modellen van [merk]".
- URL: `brands=bmw,audi&models=bmw:3%20Reeks,audi:A4` (comma-separated, blijft deelbaar). Chips tonen per merk/model een aparte verwijderbare chip.
- Querylaag: `.in('brand', brands)` plus een OR-groep voor merk/model-combinaties.

## 4. Bouwjaar als dropdown

- Van/Tot worden Selects met aflopende reeks van huidig jaar tot 1990. De "Tot"-lijst toont alleen jaren >= gekozen "Van"; bij een conflict wordt "Tot" gereset.

## 5. Ontbrekende filtercategorieën

- **Staat** (nieuw / tweedehands / beschadigd) — checkboxlijst in Basis, mapt op `condition_type`.
- **Uitvoering** — vrij tekstveld in Basis, zoekt in `model_version` (ilike).
- **Milieu/emissie** — nieuwe subsectie in Aandrijving & Prestaties: emissieklasse (euro4–euro6d) via `emission_class`, plus max. CO2 (g/km) en max. verbruik op de bestaande kolommen.
- **Garantie & historiek** — checkboxgroep in Historiek & Zekerheid: Car-Pass aanwezig, fabrieksgarantie (`warranty_months > 0` / `warranty_type`), ongevalsvrij (bestaande `noDamageHistory`, nu echt aangesloten op `condition->damage->present`).

## 6. kW/pk-toggle bij Vermogen

- Toggle (pk / kW) naast Min/Max. Waarden worden bij het wisselen omgerekend (1 kW = 1,36 pk, bestaande `kwToPk` in `src/lib/units.ts`). Intern blijft alles kW; de eenheidskeuze staat in de URL als `powerUnit=pk`.

## Technisch

- Bestanden: `src/modules/search/FilterPanel.tsx`, `FilterChips.tsx`, `src/lib/searchFilters.ts` (+ tests), `src/types/listing.ts`, `src/hooks/useSearchListings.ts`, nieuwe `src/hooks/useSearchFacets.ts`, nieuwe componenten `BrandModelFilter.tsx` en `OptionSearchList.tsx`.
- Migratie: `search_facets(jsonb)` als `STABLE SECURITY INVOKER` functie met `SET search_path = public`, `EXECUTE` aan `anon` en `authenticated`; leest alleen `status='active'` advertenties.
- Filterlogica wordt gecentraliseerd zodat de facettelling en de resultatenquery dezelfde predikaten gebruiken (één bron van waarheid).
- Unit tests uitbreiden in `src/lib/searchFilters.test.ts` (multi-merk round-trip, back-compat, powerUnit) en een test op de facet-hook mapping.

## Uitvoering

Punt 1 en 2 eerst in één iteratie, daarna 3–4, daarna 5–6. Niets aan popovers, apply-knoppen, sectiegroepering of chips-patroon wijzigen.

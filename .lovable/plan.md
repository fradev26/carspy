# Testadvertenties vervangen door 5 volledig uitgewerkte cases

## Wat er nu in de database staat

- 25 advertenties in `listings`, allemaal seeddata van 12/17/20 juni 2026, verdeeld over twee accounts:
  - 13 op `tvc@live.be` (Thomas Vancoillie, particulier)
  - 11 op `bglbxksefoiocpjsrj@jbsze.com` (Ibra's Garage / Test garage, dealer)
  - 1 op `admin@vatuur.be`
- Afhankelijke rijen die naar een listing verwijzen: 3 favorieten, 3 gesprekken, 1 bericht, 1 view-event, 1 boost, 1 vehicle_lead. Geen AutoScout- of importrijen.
- Storage: één publieke bucket `listing-images`.
- Geen enkele advertentie heeft echte klantdata; alles is seed/mock.

## 1. Opruimen

- Alle 25 bestaande advertenties verwijderen (inclusief de Peugeot 3008 GT Hybrid met de foute foto).
- Eerst de afhankelijke rijen opruimen in deze volgorde: `messages` → `conversations` → `favorites` → `listing_view_events` → `boost_usage` → `vehicle_leads.listing_id` op leeg zetten (die rij blijft bestaan als lead).
- Daarna de advertenties zelf verwijderen en de bestaande objecten in de `listing-images` bucket wissen.
- Profielen, bedrijven, gebruikers en rollen blijven ongemoeid.

## 2. Vijf nieuwe advertenties

Uit `VATUUR_testadvertenties.xlsx`:

| # | Advertentie | Type | Eigenaar |
|---|---|---|---|
| 1 | Volkswagen Golf GTD 2.0 TDI DSG | particulier | Test Gebruiker |
| 2 | Peugeot 2008 GT Line PureTech 130 | dealer | Test Business (Test Bedrijf) |
| 3 | Tesla Model 3 Long Range Dual Motor | particulier | Test Jackie |
| 4 | BMW 3 Reeks Touring 320d M Sport | dealer | Test Business (Test Bedrijf) |
| 5 | Renault Kangoo Van Grand Confort dCi 95 | particulier | Test Gebruiker |

De drie particuliere advertenties komen op bestaande testaccounts te staan (geen nieuwe gebruikers), zodat "Stuur bericht" werkt: de knop maakt een gesprek met de eigenaar en dat kan alleen met een echt auth-account.

Per advertentie worden gevuld:

- Basisvelden: titel, merk, model, uitvoering, jaar, eerste registratiedatum (jaar + maand uit het bestand), kilometerstand, brandstof, transmissie, carrosserie, vermogen in kW (`power_unit='kW'`), prijs + `price_public`, `price_negotiable`, `vat_deductible`, `condition_type`, verkooptekst, gemeente, uitrusting als platte labellijst, `status='active'`.
- JSON-kolommen: `condition` (algemene staat, schade, technische problemen), `availability` (beschikbaar vanaf), `specs` (checklist voertuiginformatie, oorspronkelijk vermogen in pk, contactgegevens incl. postcode).
- Extra schemavelden die de wizard nu niet wegschrijft, zodat filters en het EmissionsPanel kloppen: provincie, kleur, deuren/zitplaatsen, VIN, nummerplaat, CO2-uitstoot, verbruik (voor de Tesla kWh/100 km en CO2 = 0), garantie en keuringsdatum.
- Voor de twee dealeradvertenties bovendien `company_id` en `cost_price` (realistische marge onder de vraagprijs).
- De BMW krijgt schade- én technische probleembeschrijving plus verlopen keuring, zodat de detailpagina die blokken toont.

## 3. Afbeeldingen

De 15 foto's uit `afbeeldingen/` gaan naar de bucket `listing-images` onder een eigen map per advertentie, en komen in de volgorde voor → zij → interieur in `images[]`. Zo tonen de carrousel en het cameratelletje op de kaarten drie foto's.

## 4. Verifiëren

- Live preview: homepage (uitgelichte advertenties), `/zoeken` met en zonder filters, detailpagina van de BMW voor de schadeblokken, en of alle foto's laden.
- Typecheck en de volledige testsuite draaien.
- Afsluitend een kort overzicht van wat verwijderd en toegevoegd is.

## Technische notities

- Verwijderen en invoegen gebeurt via data-tools (geen schemawijziging nodig; alle gebruikte kolommen bestaan al).
- Uploaden van de 15 foto's via de storage-upload tool; publieke URL's uit de bestaande publieke bucket.
- Geen wijziging aan `/verkopen`: het formulier blijft zoals het is, de extra kolommen worden alleen voor deze testdata direct gevuld.

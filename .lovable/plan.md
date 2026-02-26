

# Uitbreiding mockdata met realistische afbeeldingen

## Doel
De mockdata uitbreiden met meer listings en alle afbeeldingen vervangen door Unsplash-foto's die daadwerkelijk overeenkomen met het juiste automerk en model. Dit maakt de demo presenteerbaar voor investeerders.

## Wat er verandert

### 1. Bestaande 12 listings: afbeeldingen vervangen
Alle huidige afbeeldingen worden vervangen door Unsplash-foto's die het juiste merk/model tonen. Per listing worden 2-3 afbeeldingen gebruikt (verschillende hoeken) waar mogelijk.

Voorbeelden:
- **VW Golf** -- Unsplash foto's van een VW Golf
- **BMW 3-serie** -- Unsplash foto's van een BMW 3-serie
- **Tesla Model 3** -- Unsplash foto's van een Tesla Model 3
- Enzovoort voor alle 12 bestaande listings

### 2. 8 nieuwe listings toevoegen (totaal: 20)
Nieuwe listings met diverse merken, prijsklassen en brandstoftypes voor een realistisch aanbod:

| # | Auto | Prijs | Brandstof | Type |
|---|------|-------|-----------|------|
| 13 | Hyundai IONIQ 5 Project 45 | 45.900 | Elektrisch | SUV |
| 14 | Renault Clio 1.0 TCe Intens | 16.950 | Benzine | Hatchback |
| 15 | Porsche Taycan 4S | 89.500 | Elektrisch | Sedan |
| 16 | Opel Corsa-e Electric | 24.750 | Elektrisch | Hatchback |
| 17 | Seat Leon 1.5 TSI FR | 27.900 | Benzine | Hatchback |
| 18 | Volkswagen ID.4 Pro | 39.950 | Elektrisch | SUV |
| 19 | BMW X3 xDrive30e | 48.500 | Plug-in hybride | SUV |
| 20 | Mercedes-Benz A-Klasse A200 AMG | 31.450 | Benzine | Hatchback |

### 3. Bestand dat wordt aangepast
- `src/data/mockListings.ts` -- alle wijzigingen zitten in dit ene bestand

### 4. Afbeeldingsstrategie
Alle afbeeldingen komen van Unsplash met de `?w=800` parameter voor consistente laadsnelheid. Er worden zoektermen gebruikt die het exacte merk en model bevatten zodat de foto's herkenbaar zijn.

## Technische details
- Geen nieuwe dependencies nodig
- Geen type-wijzigingen nodig (bestaande `Listing` interface dekt alles)
- De `popularBrands` array en hulpfuncties (`getListingById`, `getRelatedListings`, `getPriceAnalysis`) blijven ongewijzigd maar werken automatisch met de extra data
- Homepage toont de eerste 6 listings; zoekpagina toont alle 20


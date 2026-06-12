# Plan: Mock-voertuigen toevoegen voor categorie-secties

## Doel
12 mock-listings invoegen (3 per categorie) zodat de 4 nieuwe categorie-secties op de homepage zichtbaar zijn.

## Aanpak
Eén `INSERT` in `public.listings` met `status='active'`, gekoppeld aan de bestaande gebruiker `40ff791c-9dc7-44c1-bd31-3bd02ebeb456` (eigenaar van de huidige actieve Golf GTI).

## Categorieën
- **SUV's** (`body_type='suv'`): Volvo XC60, Audi Q5, Toyota RAV4
- **Elektrisch** (`fuel_type='elektrisch'`): Tesla Model 3, Hyundai Kona Electric, Volkswagen ID.4
- **Budget < €10.000**: Opel Corsa (€7.950), Peugeot 208 (€8.500), Renault Clio (€9.250)
- **Sportief** (`body_type='coupe'`): BMW 4-serie, Audi A5, Ford Mustang

## Velden per listing
`title, brand, model, year, price, mileage, fuel_type, transmission, body_type, color, power, images, city, province, status='active'`. Voor `images` gebruiken we `/placeholder.svg` (al door `ListingCard` afgehandeld), zodat we geen externe hosts hoeven te raken.

## Niet in scope
- Geen schema-wijzigingen.
- Geen aanpassingen aan frontend code.
- Echte afbeeldingen — placeholders zijn voldoende voor zichtbaarheidstest.

# Plan: ListingDetail herstructureren

Doel: bestaande VATUUR-styling behouden, maar de detailpagina herordenen en 3 nieuwe secties toevoegen om vertrouwen en conversie te verhogen. Alle wijzigingen gebeuren in `src/pages/ListingDetail.tsx`. Geen nieuwe data, alleen bestaande velden uit `Listing`.

## Wat blijft ongewijzigd
- `ImageGallery`, mobiele titel/prijs-blok, KeySpecs-grid, `PriceIndicator`, `EquipmentDialog`, AI-analyse card, sticky desktop price/seller card, mobile contact bar, breadcrumbs, SEO/JSON-LD, related listings.
- Alle huidige tokens, cards (`border-border/60 shadow-card`), spacing, iconen, kleuren.

## Nieuwe volgorde main-column (mobiel = primair)

1. Gallery *(bestaand)*
2. Mobiele titel + prijs + badges *(bestaand)*
3. KeySpecs grid — uitbreiden zodat verplichte 6 altijd eerst staan: Bouwjaar · Km-stand · Brandstof · Transmissie · Vermogen · Carrosserie. Kleur/Deuren/Aandrijving schuiven naar de detail-specs sectie.
4. **NIEUW – "Waarom deze auto"** (`Sparkles` icoon). Compacte card met 3–5 bullets, automatisch afgeleid uit beschikbare data (hp+jaar, lage km, garantie, premium opties uit `highlights`/`equipment`, eerste eigenaar, recent gekeurd). Geen extra API-call; pure client-side samenvatting met fallback naar bestaande AI-analyse-bullets als die geladen is.
5. **NIEUW – Vertrouwensblok** (`ShieldCheck`). Eén card die bundelt: dealer-verificatie, aantal eigenaren, laatste/volgende keuring, garantie (maanden + type), onderhoudshistorie-indicator (uit `serviceHistory` jsonb of `included_services`). Vervangt de losse "Garantie & inspectie"-card.
6. `PriceIndicator` *(bestaand, verplaatst hierheen)*
7. **NIEUW – Totale kostprijs** card: vraagprijs, geschatte maandlast (eenvoudige formule: prijs × 0.0185 over 60 mnd, label "indicatief"), BTW-indicatie (`vatDeductible`/`vatRate`), eventuele transportkost-placeholder weggelaten als data ontbreekt.
8. **Hoogtepunten uitrusting** — bestaande highlights-badges blijven; daaronder een gecureerde "premium options"-strip die uit `equipment` matcht op een whitelist (panoramadak, adaptive cruise, head-up, stoelverwarming, 360-camera, premium audio, matrix LED, …). "Toon meer" opent bestaande `EquipmentDialog`.
9. **NIEUW – Voertuiggeschiedenis** als verticale tijdlijn. Items uit: `firstRegistrationDate`, `previousOwnerCount`, `inspectionDate`, `nextInspectionDate`, `serviceHistory` (jsonb mappen indien array). Skip als <2 items.
10. **Verbruik & emissies** *(bestaand)* — verplaatst naar gedetailleerde specs-groep.
11. **Gedetailleerde specificaties** — bestaande dl-velden hergroeperen in subsecties: Motor & Prestaties · Afmetingen & Gewicht · Verbruik & Emissies · Identificatie. Eén card, accordeon-stijl groepen via `<details>` of statische headers.
12. **Beschrijving verkoper** *(bestaand)* — alleen lichte typografische opschoning (max-w, leading), tekst onaangetast.
13. **Dealerinformatie** (alleen mobiel; desktop heeft sticky sidebar). Compacte card met dealernaam, locatie, "Bekijk volledig aanbod", verificatiebadge.
14. **Vergelijkbare auto's** *(bestaand)* — mobiel: horizontale scroll (`flex overflow-x-auto snap-x`) i.p.v. grid; desktop blijft grid.

## Code-aanpak

- Refactor in dezelfde file (`src/pages/ListingDetail.tsx`). Geen nieuwe componenten extracten tenzij nodig voor leesbaarheid; lokale helpers `WhyBuy`, `TrustBlock`, `TotalCost`, `VehicleTimeline`, `SpecsGrouped` als kleine functies binnen het bestand.
- Hergebruik `Card`/`CardContent`, `Badge`, `Separator`, lucide-iconen (`ShieldCheck`, `Wrench`, `History`, `Calculator`, `Sparkles`, `Crown`).
- Helpers: `formatPrice`, `formatDate`, `formatNumberWithUnit` zijn al beschikbaar.
- Maandlast-formule: const monthlyEstimate = Math.round(price * 0.0185); — label expliciet "indicatief, 60 mnd".
- Premium-options whitelist als constante array van lowercase substrings; match case-insensitive tegen `equipment`.
- Tijdlijn: simpele `<ol>` met `border-l border-border/60 pl-4` + dot-marker per item.

## Niet in scope
- Geen nieuwe API/edge-function.
- Geen DB-wijzigingen.
- Geen aanpassingen aan sidebar, header, of andere pagina's.
- Geen redesign van bestaande componenten.

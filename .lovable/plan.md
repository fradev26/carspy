# Optimalisatie verkoopproces & listingdetail

## Doel
Vervang het huidige 5-staps verkoopformulier (`src/pages/Sell.tsx`) door een conversiegerichte 6-staps wizard met rijkere voertuiginformatie, en toon die nieuwe data op de listingdetailpagina als een ingeklapte gecategoriseerde optielijst — zonder de bestaande VATUUR-stijl, componenten of detailpagina-architectuur te breken.

## 1. Verkoopwizard — `src/pages/Sell.tsx`

Herstructureren naar 6 stappen met behoud van: bestaande progress-strip (cirkels + check), Card-wrapper, Vorige/Volgende-knoppen, draftId-flow, AI-analyse op prijsstap, foto-upload-pipeline en submit-logica.

**Stap 1 – Basisgegevens**: merk (zoekbare dropdown via Command/Popover), model (dynamisch obv merk uit `CAR_BRANDS`), eerste registratie (jaar + maand → `first_registration_date`), carrosserie, brandstof, transmissie, vermogen (pk/kW toggle → `power` + `power_unit`), uitvoering (`model_version`), kilometerstand.

**Stap 2 – Uitrusting & extra's**: vier categorieën (veiligheid, comfort, multimedia, exterieur) + blok "Voertuiginformatie" (onderhoudsboekje, eerste eigenaar, niet-roker, btw aftrekbaar, ongevalvrij, dealer-onderhouden, Car-Pass, keuringsattest, reserve sleutel). Renderen als responsive checkbox-cards (bestaande Card + Check-icoon, grid `sm:grid-cols-2 lg:grid-cols-3`). State in één geneste structuur (zie §4).

**Stap 3 – Staat van het voertuig**: radiogroep algemene staat → `condition_type`. Conditionele velden voor schade en technische problemen (alleen tonen bij "Ja"). Opgeslagen in `condition` jsonb.

**Stap 4 – Foto's**: drag-and-drop (HTML5 `onDrop`), suggestiechecklist met aanbevolen shots, sorteerbare thumbnails (pijltjes links/rechts), eerste foto = hoofdfoto met badge, client-side compressie via canvas (max 1920px, jpeg q=0.82), max 20, per-bestand progressbar.

**Stap 5 – Verkoopinformatie**: prijs (`price` + `price_public`), onderhandelbaar radio (`price_negotiable`), beschikbaar vanaf (date → `availability` jsonb), opmerkingen, behoud AI-marktwaarde-card.

**Stap 6 – Contactgegevens**: naam, e-mail, telefoon, postcode, gemeente (prefill uit profiel). Twee verplichte checkboxen (correctheid + privacy) — Volgende disabled tot beide aangevinkt.

**Samenvatting**: na stap 6 een review-scherm met secties + "Bewerken" knoppen die `setCurrentStep(n)` aanroepen. "Definitief verzenden" triggert bestaande submit.

**Algemeen**: progress-tekst "Stap X van 6", autosave naar `localStorage` (key per `draftId`/user) bij elke wijziging + "Concept opslaan" knop die naar `listings` schrijft met `status='draft'`, per-stap validatie behouden via uitgebreide `validateStep`.

## 2. Listingdetail — `src/pages/ListingDetail.tsx`

- **Quick action** onder Kerngegevens-grid: full-width subtiele `Button variant="outline"` met ChevronDown — "Bekijk volledige optielijst (N)". Klik → smooth scroll naar accordion en open hem (state lift).
- **Vervang** de huidige "Gedetailleerde specificaties"-kaart-titel niet, maar **vervang de huidige "Hoogtepunten uitrusting → EquipmentDialog"-trigger** door een echte `Accordion` (shadcn, single, collapsible, default closed) met titel `Bekijk optielijst (N)`. Binnen de accordion vier subsecties (Veiligheid / Comfort / Multimedia / Exterieur) + Voertuiginformatie, gerenderd uit `listing.specs.vehicle_features` met fallback naar de platte `equipment[]` array onder "Overig" voor oude listings. `EquipmentDialog` blijft beschikbaar maar wordt niet meer als primaire entry getoond.
- Gedetailleerde technische specs-kaart (motor/afmetingen/emissies/identiteit) blijft ongewijzigd.

## 3. Na verzending
Bestaand bevestigingsscherm + toast behouden. Toevoegen: invoke bestaande edge function voor bevestigingsmail (`send-transactional-email`, template `listing-submitted` — nieuw template aanmaken in `supabase/functions/_shared/transactional-email-templates/`). AI-marktwaarde uit stap 5 wegschrijven naar `specs.estimated_market_value`.

## 4. Datamodel
Geen nieuwe kolommen nodig — gebruik bestaande `specs jsonb` met sleutel `vehicle_features`:
```json
{
  "vehicle_features": {
    "safety": ["ABS","ESP",...],
    "comfort": [...],
    "multimedia": [...],
    "exterior": [...],
    "vehicle_information": ["onderhoudsboekje","eerste_eigenaar",...]
  }
}
```
Bestaande `equipment[]` blijft gevuld als platte unie (voor zoek/AS24-compat). `condition` jsonb krijgt `{ overall, damage: {present, description}, technical: {present, description} }`. Geen migratie vereist.

## 5. Bestanden
- Edit: `src/pages/Sell.tsx` (volledige refactor wizard)
- Edit: `src/pages/ListingDetail.tsx` (quick-action knop + accordion-optielijst met categorieën)
- Nieuw: `src/modules/sell/` helpers — `BrandModelPicker.tsx`, `FeatureCheckboxGrid.tsx`, `PhotoUploader.tsx`, `SummaryReview.tsx`, `featureCatalog.ts` (categorieën + labels)
- Nieuw (optioneel email): `supabase/functions/_shared/transactional-email-templates/listing-submitted.tsx` + registry-entry

## Buiten scope
Header, bottom-nav, breadcrumbs, AI-chat, related-listings layout, kerngegevens-grid, prijsindicator, vertrouwensblok, totale-kostprijs-kaart, voertuiggeschiedenis-timeline, dealerinformatie — allemaal ongewijzigd.

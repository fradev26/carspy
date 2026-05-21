# CTA-knoppen op homepage naast elkaar als één actiegroep

## Doel
De knoppen "Zoek auto's" en "Plaats advertentie" staan al onder de HeroSearch op `/`, maar gebruiken `flex-wrap` met `gap-4`, wat op smalle mobielen leidt tot stacking en ongelijke breedtes. Ze moeten op élk schermformaat naast elkaar staan, met gelijke breedte, als één duidelijke actiegroep.

## Wijziging
Eén bestand: `src/pages/Index.tsx` — de container op regel 185 en de twee `Button`-componenten erbinnen.

- Container: vervang `flex flex-wrap items-center justify-center gap-4` door een grid van 2 gelijke kolommen met `max-w-md mx-auto`, bv. `grid grid-cols-2 gap-3 max-w-md mx-auto`. Dit garandeert:
  - Naast elkaar op alle viewports (geen stacking)
  - Exact gelijke breedte
  - Centrale uitlijning onder de zoekbalk
- Beide buttons krijgen `w-full` zodat ze hun gridcel vullen.
- Padding `px-8` vervangen door `px-4` zodat de tekst op mobiel niet overflowt.
- Visuele hiërarchie blijft: primary (rood) voor "Zoek auto's", outline/glass voor "Plaats advertentie".

Geen wijzigingen aan andere secties of business logic.

## Resultaat
Twee gelijke knoppen direct onder de zoekvelden, altijd naast elkaar, binnen één viewport zichtbaar.

## Plan: SEO-landingspagina "Wat is mijn auto waard?"

Een nieuwe publieke pagina op `/wat-is-mijn-auto-waard` die dient als SEO backlink-asset én lead generator richting de verkoopflow.

### Route & navigatie
- Nieuwe route in `src/App.tsx`: `/wat-is-mijn-auto-waard` → lazy loaded `AutoWaarde` page (publiek, geen auth).
- Toevoegen aan `public/sitemap.xml` zodat Google de pagina indexeert.
- Footer-link onder "Verkopen" sectie naar de nieuwe pagina (interne backlink).

### Pagina structuur (`src/pages/AutoWaarde.tsx`)

**1. Hero**
- H1: *"Wat is mijn auto waard?"* (rode punt zoals brand-stijl)
- Subtitel + CTA-knoppen *"Bereken mijn autowaarde"* (scrollt naar tool) en *"Direct verkopen"* → `/verkopen`
- Trust-badge "Gratis & vrijblijvend"

**2. Hoe werkt het** — 5 cards met icoon
- Merk & model · Bouwjaar · Kilometerstand · Staat van de wagen · Marktdata vergelijking

**3. Waardetool** (interactief formulier, sectie-id `#waardetool`)
- Velden: Merk (Select uit `CAR_BRANDS`), Model (Select uit `CAR_MODELS[brand]` of vrij), Bouwjaar, Km-stand
- Knop *"Bereken waarde"* → toont indicatieve range (vanaf / richtprijs / tot)
- Heuristische schatting client-side: basis per merk-segment (premium vs mainstream) × leeftijds-depreciatie (~12%/jaar) × km-factor — duidelijk gelabeld als "indicatie op basis van marktdata"
- Na resultaat: CTA-knoppen *"Verkoop nu via Vatuur"* (`/verkopen`), *"Bekijk vergelijkbare wagens"* (`/zoeken?brand=...&model=...`), *"Nieuwe waardebepaling"*

**4. Trust sectie** — 3 cards
- Live marktdata · Onafhankelijk (geen opkoper) · AI-gestuurd

**5. Final CTA**
- *"Auto verkopen"* + *"Vergelijkbare wagens bekijken"* + link naar homepage

### SEO
- `SEOHead` met:
  - Title: *"Wat is mijn auto waard? | Gratis autowaarde berekenen | VATUUR."*
  - Meta description gericht op zoekwoorden "auto waarde bepalen", "wat is mijn auto waard", "auto taxatie online"
  - Canonical: `https://vatuur.be/wat-is-mijn-auto-waard`
  - JSON-LD: BreadcrumbList (Home > Wat is mijn auto waard) + FAQPage (4 Q&A's over autotaxatie)
- Correcte H1 (één), H2's per sectie
- Mobile-first via bestaande Tailwind responsive classes

### Bestanden
**Nieuw:**
- `src/pages/AutoWaarde.tsx` — volledige landingspagina (geen DB, alle logica client-side)

**Aangepast:**
- `src/App.tsx` — lazy import + Route binnen `AppLayout`
- `src/layouts/Footer.tsx` — link toevoegen "Wat is mijn auto waard?"
- `public/sitemap.xml` — URL toevoegen

### Geen backend nodig
- 100% client-side (heuristiek voor de schatting, geen edge function)
- Geen DB-wijzigingen, geen secrets

Klaar om te bouwen?
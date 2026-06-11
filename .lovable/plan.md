## Plan: Verberg trustsectie en verkoop-CTA op mobiel

### Wijzigingen

**Bestand:** `src/pages/Index.tsx`

1. **Trustsectie "Waarom VATUUR?"** (regels 328-364)  
   Voeg `hidden lg:block` toe aan het `<section>`-element zodat deze sectie alleen op desktop (≥1024px) zichtbaar is.

2. **CTA "Auto verkopen in 2 minuten"** (regels 366-388)  
   Voeg `hidden lg:block` toe aan het `<section>`-element zodat deze call-to-action alleen op desktop (≥1024px) zichtbaar is.

### Technische details
- Gebruik van `hidden lg:block` volgt het bestaande responsieve patroon in het project (bijv. hero-sectie regel 152).
- Geen impact op desktop-layout.
- Geen wijzigingen aan interne componenten, props of navigatie.

### QA-checks
- 320px t/m 1023px: beide secties zijn niet zichtbaar.
- ≥1024px (lg): beide secties tonen normaal.
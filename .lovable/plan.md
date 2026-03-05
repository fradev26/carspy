

# Hero Section Redesign — Premium & Conversiegericht

## Overzicht

De hero wordt compleet herwerkt met een sterkere headline, betere visuele hiërarchie, social proof, en branded zoekkaart. De bestaande SearchBar component blijft intact — alleen de wrapper in `Index.tsx` verandert.

## Wijzigingen

### `src/pages/Index.tsx` — Hero section herschrijven

**Headline & subheadline:**
- H1: "De slimste manier om een tweedehands auto te vinden"
- Sub: "Vergelijk duizenden tweedehands auto's van betrouwbare dealers en particulieren in Nederland en België."
- Grotere typografie: `text-4xl md:text-5xl lg:text-6xl` met meer `leading-tight`

**Zoekformulier als floating card:**
- De SearchBar zit al in een `glass rounded-2xl p-6 shadow-floating` container — dit blijft, maar we voegen een label toe boven het formulier: "Zoek jouw auto" als kleine heading in de card

**Trust badges direct onder zoekbalk (prominenter):**
- Checkmark-iconen i.p.v. Shield/Car/Users
- Tekst aanpassen: "Geverifieerde dealers", "25.000+ auto's online", "Dagelijks nieuwe advertenties"
- Alle drie altijd zichtbaar (verwijder `hidden sm:flex`)
- Groene checkmarks voor vertrouwens-signaal

**Social proof toevoegen:**
- Regel onder trust badges: "⭐ 4.8/5 op basis van 1.200+ reviews" (statisch, marketing-getal)

**Secundaire CTA:**
- Onder de zoekbalk, naast of onder de trust badges: link "of verkoop je auto gratis →"

**Spacing:**
- Meer verticale ruimte: `py-24 lg:py-36`
- Max-width zoekkaart: `max-w-4xl` (al aanwezig)

**Populaire keuzes chips:**
- Brandstoftype-chips zitten al in SearchBar (FUEL_TYPES). Deze zijn al aanwezig en goed gepositioneerd.

### Samenvatting

| Onderdeel | Wijziging |
|-----------|-----------|
| Headline | "De slimste manier om een tweedehands auto te vinden" |
| Subheadline | Specifieker, waardepropositie |
| Trust badges | Prominenter, checkmarks, altijd zichtbaar |
| Social proof | Sterren + review-aantal |
| Secundaire CTA | "Verkoop je auto gratis" link |
| Spacing | Meer lucht, grotere typografie |

Alleen `src/pages/Index.tsx` wordt aangepast. SearchBar en andere componenten blijven ongewijzigd.


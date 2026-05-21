# SEO-geoptimaliseerde FAQ uitbreiden

## Doel
De bestaande FAQ-sectie op de homepage (`src/pages/Index.tsx`) uitbreiden van 5 naar 26 vragen, gegroepeerd per thema, en de FAQPage JSON-LD structured data automatisch laten meegroeien voor maximale SEO/AEO-waarde.

## Scope
- Alleen `src/pages/Index.tsx` wijzigen.
- Geen nieuwe routes, geen backend wijzigingen.
- Visuele stijl (Accordion-cards) blijft identiek; alleen sectiekoppen per categorie worden toegevoegd.

## Structuur

8 categorieën, 26 vragen totaal:

1. **Gebruik & platform** (3)
2. **Zoeken naar auto's** (5)
3. **Auto's vergelijken & kiezen** (3)
4. **Prijs & waarde** (2)
5. **Betrouwbaarheid & dealers** (3)
6. **Auto-informatie** (3)
7. **Kopen & contact** (3)
8. **Account & technisch** (2)
9. **Privacy & veiligheid** (1)
10. **Toekomst & platform** (1)

## Implementatie

### Data
Vervang de `faqItems` array door een `faqCategories` array:
```ts
const faqCategories = [
  { title: "Gebruik & platform", items: [{ question, answer }, ...] },
  ...
]
```

Antwoorden:
- Kort (2-4 zinnen), Nederlands, natuurlijke schrijftaal voor AEO (AI Answer Engines).
- Bevatten kernzoekwoorden: "tweedehands auto", "occasion", "geverifieerde dealer", "Nederland en België", "AI", "slim zoeken", "prijsindicatie".
- Eerlijk en concreet (geen marketingpraat) — in lijn met VATUUR-tone.

### Rendering
- Per categorie een `<div>` met `<h3>` (sectietitel) + eigen `<Accordion>`.
- Behoud bestaande card-styling (`bg-card rounded-xl border border-border/60 px-6 shadow-sm`).
- Container blijft `max-w-3xl`, ruimere `space-y-10` tussen categorieën.

### JSON-LD
- `FAQPage.mainEntity` wordt gebouwd door `faqCategories.flatMap(c => c.items)` — alle 26 Q&A's blijven in één FAQPage schema (Google best practice: één FAQPage per pagina).
- Houdt bestaande `WebSite` + `Organization` JSON-LD intact.

## Out of scope
- Aparte `/faq` route (kan later als SEO-landing als gewenst).
- Categorie-filter/zoekveld binnen FAQ.
- Vertalingen.

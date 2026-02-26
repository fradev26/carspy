
# SEO en AI-optimalisatie voor AutoSpy

## Overzicht
Volledige SEO-implementatie en AI-zoekmachine-optimalisatie (AEO) voor AutoSpy, zodat de site goed vindbaar is in Google, Bing, en AI-assistenten zoals ChatGPT en Google Gemini.

## Wat wordt gebouwd

### 1. SEO Helmet Component
Een herbruikbare `<SEOHead>` component die per pagina de juiste meta tags instelt via `document.title` en dynamische `<meta>` tags:
- Title, description, canonical URL
- Open Graph tags (og:title, og:description, og:image, og:type, og:url)
- Twitter Card tags

### 2. Per-pagina SEO
Elke pagina krijgt unieke, Nederlandse SEO-content:

| Pagina | Title | Description |
|--------|-------|-------------|
| Homepage | AutoSpy - Tweedehands auto's kopen en verkopen in Nederland en Belgie | Doorzoek 25.000+ occasions. Vind jouw perfecte auto bij geverifieerde dealers. |
| Zoeken | Auto's zoeken - AutoSpy | Zoek en filter tweedehands auto's op merk, prijs, bouwjaar en meer. |
| Detail | {title} - AutoSpy | Dynamische beschrijving met prijs, km-stand, bouwjaar |
| Verkopen | Auto verkopen - AutoSpy | Plaats gratis je advertentie en bereik duizenden kopers. |
| Vergelijken | Auto's vergelijken - AutoSpy | Vergelijk tweedehands auto's op prijs, specificaties en uitrusting. |

### 3. Structured Data (JSON-LD)
Schema.org markup voor AI-crawlers en rich snippets:
- **WebSite** schema op homepage (met SearchAction voor sitelinks searchbox)
- **Vehicle** / **Product** schema op detailpagina's (prijs, merk, model, km-stand, conditie)
- **Organization** schema in de layout
- **BreadcrumbList** schema op detail- en zoekpagina's

### 4. Sitemap en Robots.txt
- Dynamische sitemap-achtige structuur via `robots.txt` update
- Verbetering van `index.html` met lang-attribuut en betere standaard meta tags

### 5. AI-optimalisatie (AEO)
- **llms.txt** bestand in `/public` - speciaal voor AI-crawlers, beschrijft de site in plain text
- Semantic HTML verbetering (article, nav, main, section met aria-labels)
- FAQ-achtige structured data voor veelgestelde vragen

---

## Technische Details

### Bestanden die worden aangemaakt
1. **`src/components/SEOHead.tsx`** - Herbruikbare SEO component met `useEffect` voor document.title en meta tag management
2. **`public/llms.txt`** - AI-crawler informatie bestand
3. **`public/sitemap.xml`** - Statische sitemap voor de bekende pagina's

### Bestanden die worden aangepast
1. **`index.html`** - `<html lang="nl">`, verbeterde standaard meta tags, title "AutoSpy"
2. **`public/robots.txt`** - Sitemap referentie toevoegen
3. **`src/pages/Index.tsx`** - SEOHead + JSON-LD WebSite/Organization schema
4. **`src/pages/Search.tsx`** - SEOHead + BreadcrumbList schema
5. **`src/pages/ListingDetail.tsx`** - SEOHead + Vehicle/Product JSON-LD met dynamische data
6. **`src/pages/Sell.tsx`** - SEOHead
7. **`src/pages/Compare.tsx`** - SEOHead
8. **`src/pages/Favorites.tsx`** - SEOHead (noindex)
9. **`src/pages/Dashboard.tsx`** - SEOHead (noindex)
10. **`src/pages/Auth.tsx`** - SEOHead (noindex)
11. **`src/layouts/Footer.tsx`** - Semantic HTML verbetering met `<nav>` tags

### SEOHead Component API
```typescript
<SEOHead 
  title="AutoSpy - Tweedehands auto's kopen en verkopen"
  description="Doorzoek 25.000+ occasions..."
  canonical="https://autospy.nl/"
  ogImage="https://autospy.nl/og-default.png"
  noindex={false}  // true voor dashboard/auth pagina's
  jsonLd={schemaObject}  // optioneel JSON-LD object
/>
```

### JSON-LD voorbeeld voor detailpagina
```json
{
  "@context": "https://schema.org",
  "@type": "Vehicle",
  "name": "Volkswagen Golf 1.4 TSI Highline",
  "brand": { "@type": "Brand", "name": "Volkswagen" },
  "model": "Golf",
  "vehicleModelDate": "2021",
  "mileageFromOdometer": { "@type": "QuantitativeValue", "value": 45000, "unitCode": "KMT" },
  "fuelType": "Benzine",
  "vehicleTransmission": "Automaat",
  "offers": {
    "@type": "Offer",
    "price": 24950,
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock"
  }
}
```

### llms.txt inhoud
Een gestructureerd plain-text bestand dat AI-modellen informeert over:
- Wat AutoSpy is en doet
- Welke functies beschikbaar zijn
- Hoe de zoekfunctie werkt
- Prijsindicatie en vergelijkingsfuncties

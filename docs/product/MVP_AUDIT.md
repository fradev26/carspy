# MVP-audit (Sprint 0)

Status per functie uit [`PRODUCTFRAMEWORK.md`](./PRODUCTFRAMEWORK.md). Legende: ✅ aanwezig · 🟡 gedeeltelijk · ❌ ontbreekt.

## Laag A — Pariteit

### A1. Zoeken & vinden

| # | Functie | Status | Codepointers | Kloof |
|---|---|---|---|---|
| A1.1 | Facetzoeken | ✅ | `src/modules/search/FilterPanel.tsx`, `src/hooks/useSearchListings.ts` | — |
| A1.2 | Locatie + straal | 🟡 | `useSearchListings.ts` | Straalzoeken vanuit postcode verifiëren/uitbouwen |
| A1.3 | Sortering & paginering | ✅ | `src/pages/Search.tsx` | 24/pagina, prijs/datum/km-sort |
| A1.4 | Bewaarde zoekopdrachten + alerts | 🟡 | `src/hooks/useSavedSearches.ts` | E-mailalerts bij nieuw aanbod nog niet aangesloten |
| A1.5 | Favorieten + prijsdaling-melding | 🟡 | `src/hooks/useFavorites.tsx` | Prijsdaling-notificatie ontbreekt |
| A1.6 | Vergelijker (Could) | ✅ | `src/pages/Compare.tsx`, `src/hooks/useCompare.tsx` | — |
| A1.7 | SEO-landingspagina's | 🟡 | `public/sitemap.xml`, `src/components/SEOHead.tsx` | Merk/model/regio long-tail-pagina's nog uitbouwen |
| A1.8 | Tweetalig NL/FR | ❌ | — | Geen i18n-scaffold aanwezig |

### A2. Advertentiedetail

| # | Functie | Status | Codepointers | Kloof |
|---|---|---|---|---|
| A2.1 | Fotogalerij | ✅ | `src/modules/listings/ImageGallery.tsx` | Bevestigen dat 20–40 foto's ondersteund zijn |
| A2.2 | Volledige specificaties | 🟡 | `listings`-tabel (100 kolommen), `src/pages/ListingDetail.tsx` | Euronorm/CO2/LEZ-velden expliciet tonen |
| A2.3 | Prijslabel | ✅ | `src/modules/listings/PriceIndicator.tsx`, `supabase/functions/price-analysis` | — |
| A2.4 | Dealerprofiel | 🟡 | `src/pages/Dealers.tsx` | Openingsuren + route + reviews |
| A2.5 | Contactopties | 🟡 | lead form in detail | Click-to-call + WhatsApp-link + logging verifiëren |
| A2.6 | Deelbare URL's | ✅ | slug-based routing | — |

### A3. Dealeromgeving

| # | Functie | Status | Codepointers | Kloof |
|---|---|---|---|---|
| A3.1 | Voorraadbeheer | ✅ | `src/pages/dealer/Inventory.tsx`, `src/components/inventory/*` | — |
| A3.2 | Datafeed / DMS-import | 🟡 | `supabase/functions/autoscout-sync`, `src/pages/dealer/Import.tsx` | DMS-shortlist bepalen; mapping-lib generaliseren |
| A3.3 | Leadinbox | ✅ | `src/components/MyLeadsPanel.tsx`, `vehicle_leads` | — |
| A3.4 | Statistieken per voertuig | 🟡 | `src/pages/dealer/Analytics.tsx`, `useDealerAnalytics` | Per-voertuig drilldown (views/fav/leads/dagen online) |
| A3.5 | Multi-user & rollen (Could) | ✅ | `company_members`, `usePermissions`, `Can` | — |
| A3.6 | CSV-export leads | ❌ | — | Export-endpoint + UI-knop |

### A4. Particulier & basics

| # | Functie | Status | Codepointers | Kloof |
|---|---|---|---|---|
| A4.1 | Gratis particulier zoekertje | ✅ | `src/pages/Sell.tsx`, `src/modules/sell/*` | — |
| A4.2 | Mobile-first / PWA | 🟡 | `public/manifest.webmanifest` | PWA-audit (service worker, offline shell) |
| A4.3 | Accountbeheer & GDPR | 🟡 | `src/hooks/useAuth.tsx`, `AccountSettings.tsx` | Dataverwijdering-flow + cookiebeleid-pagina verifiëren |
| A4.4 | Moderatie & anti-fraude basis | ❌ | — | Handmatige review-queue + AI-prijsplausibiliteitscheck |

## Laag B — Differentiatie

| # | Functie | Status | Codepointers | Kloof |
|---|---|---|---|---|
| B1 | AI-prijsanalyse dealer | 🟡 | `supabase/functions/price-analysis`, `dealer-analytics` | Percentiel + verwachte statijd toevoegen |
| B2 | AI-stockadvies | 🟡 | `supabase/functions/dealer-analytics`, `dealer-sales-summary` | Afprijsadvies + inkoopadvies expliciet |
| B3 | AI-koopassistent | ✅ | `supabase/functions/chat`, `smart-search`, `src/modules/chat/*` | Begeleide flow met vragenlijst (gezin/EV/LEZ/TCO) uitbouwen |
| B4 | AI-advertentiegenerator | 🟡 | `supabase/functions/generate-listing` | FR-versie ontbreekt |
| B5 | Radicale prijstransparantie | ❌ | `src/pages/dealer/Subscription.tsx` bestaat, geen publieke prijspagina | Publieke `/prijzen` + tier-dashboard "X van Y voertuigen" |
| B6 | Verkoopboosts self-service | ✅ | `src/components/boost/BoostDialog.tsx`, `boost_packages`, `activate_boost` | — |
| B7 | Vertrouwenslaag | ❌ | — | Car-Pass, KBO-verificatie, verified-badge, garantie/keuring gestructureerd |
| B8 | Migratietool AS24 → VATUUR | ❌ | — | Import AS24-export/feed, wizard |
| B9 | Gratis particuliere zoekertjes | ✅ | `src/pages/Sell.tsx` | C2B-brug = post-lancering |

## Samenvatting

- **Klaar (✅)**: 12 items — solide pariteitsbasis en boosts.
- **Gedeeltelijk (🟡)**: 12 items — vooral rond alerts, notifications, statistiek-drilldown, FR-copy en spec-velden.
- **Ontbreekt (❌)**: 6 items — kritisch: B5 (transparantie), B7 (vertrouwen), B8 (migratie), moderatie, i18n, CSV-export.

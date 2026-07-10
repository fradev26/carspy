
# Productframework als Single Source of Truth

Dit document (VATUUR Productframework — juli 2026) wordt de leidende bron voor alle verdere ontwikkeling. Onderstaand plan verankert het in de codebase én in het geheugen van de assistent, en vertaalt het naar een concrete audit + backlog. Geen bestaande werkende functionaliteit wordt verwijderd in deze stap.

## 1. Verankering van het framework

**In de repo (leesbaar voor mens én agent):**
- `docs/product/PRODUCTFRAMEWORK.md` — volledige Nederlandse tekst van het document (secties 1–9), inclusief MoSCoW-tabellen A1–A4 en B1–B9. Wordt de canonieke bron.
- `docs/product/README.md` — korte index + regel: "Bij conflict wint dit document van bestaande implementatie."
- `.lovable/reminders.md` — nieuwe regel: elke PR/feature refereert naar A#/B# waar relevant.

**In persistent memory (`mem://`):**
- Update `mem://index.md` Core met één regel: *Productframework (docs/product/PRODUCTFRAMEWORK.md) is source of truth; A-laag = pariteit, B-laag = differentiatie, C-laag = fundament.*
- Nieuwe memory `mem://product/framework-summary` — samenvatting van de drie lagen, MoSCoW-prioriteiten, fasering (Sprint 0 → Fase 4), succesmetrics en de "bewust NIET bouwen"-scope.
- Nieuwe memory `mem://product/scope-guardrails` — expliciete "niet bouwen"-lijst (native apps, veiling, escrow, nieuwe wagens, leasing, extra talen, eigen certificering) als `constraint`.

## 2. MVP-audit (Sprint 0)

Aparte pagina `docs/product/MVP_AUDIT.md` met per A/B-item één rij:
- Status: ✅ aanwezig / 🟡 gedeeltelijk / ❌ ontbreekt
- Codepointers (`src/…`, `supabase/functions/…`)
- Kloof t.o.v. framework

Initiële audit op basis van huidige codebase:

```text
A1 Zoeken & vinden
  Facetzoeken            ✅  src/modules/search/FilterPanel.tsx, useSearchListings
  Locatie + straal       🟡  postcode aanwezig; straal verifiëren
  Sortering/paginering   ✅  Search.tsx (24/pagina)
  Bewaarde zoeken+alert  🟡  useSavedSearches; e-mailalerts ontbreken
  Favorieten+prijsdaling 🟡  useFavorites; prijsdaling-notificatie ontbreekt
  Vergelijker            ✅  Compare.tsx (Could-item, al aanwezig)
  SEO-landingspagina's   🟡  merk/model/regio long-tail nog uit te bouwen
  Tweetalig NL/FR        ❌  i18n-architectuur nog niet voorzien

A2 Advertentiedetail
  Fotogalerij            ✅  ImageGallery (verifieer 20–40 slots)
  Volledige specs        🟡  Euronorm/CO2/LEZ-velden checken op listings
  Prijslabel             ✅  PriceIndicator + price-analysis
  Dealerprofiel          🟡  Dealers.tsx; volledige voorraad+uren+route?
  Contactopties          🟡  lead form ok; click-to-call/WhatsApp verifiëren
  Deelbare URL's         ✅

A3 Dealeromgeving
  Voorraadbeheer         ✅  dealer/Inventory.tsx
  DMS/feed-import        🟡  AutoScout-sync aanwezig; DMS-shortlist ontbreekt
  Leadinbox              ✅  MyLeadsPanel, vehicle_leads
  Statistieken/voertuig  🟡  dealer/Analytics.tsx; per-voertuig-drilldown?
  Multi-user & rollen    ✅  company_members + Can/usePermissions
  CSV-export leads       ❌

A4 Particulier & basics
  Gratis zoekertje       ✅  Sell.tsx wizard
  Mobile-first / PWA     🟡  responsive ok; manifest aanwezig, PWA-audit nodig
  Account & GDPR         🟡  auth ok; dataverwijdering-flow verifiëren
  Moderatie/anti-fraude  ❌  handmatige review + prijsplausibiliteit ontbreekt

B1 AI-prijsanalyse dealer         🟡  price-analysis; percentiel+statijd toevoegen
B2 AI-stockadvies                  🟡  dealer-analytics; afprijs/inkoop-advies uitbouwen
B3 AI-koopassistent                ✅  chat + smart-search; begeleide flow uitbreiden
B4 AI-advertentiegenerator         🟡  generate-listing NL; FR ontbreekt
B5 Radicale prijstransparantie     ❌  publieke prijspagina + tier-dashboard
B6 Verkoopboosts self-service      ✅  BoostDialog + boost_packages
B7 Vertrouwenslaag                 ❌  Car-Pass, KBO-check, verified badge
B8 Migratietool AS24→VATUUR        ❌  import van AS24-feed/export
B9 Gratis particuliere zoekertjes  ✅  (C2B-brug = post-lancering)
```

Elke 🟡/❌ krijgt een GitHub-issue-achtige entry in `docs/product/BACKLOG.md`, gegroepeerd per fase (Pre-pilot / Pilot / Lancering / Opschaling).

## 3. Backlog & fasering

`docs/product/BACKLOG.md` met vier secties overeenkomend met §6 van het framework:
- **Pre-pilot** — DMS-shortlist bevestigen, migratietool (B8), prijstransparantie-UX (B5), SEO-long-tail, GDPR-dataverwijdering, moderatiebasis.
- **Pilot** — e-mailalerts voor saved searches, prijsdaling-notificaties, per-voertuig-statistieken drilldown, vertrouwenslaag (B7), iteratie B1–B3, FR-i18n-scaffold.
- **Lancering (Q1–Q2 2027)** — B4 FR-copy, CSV-export leads, boost-uitbreiding, performance/schaal.
- **Opschaling** — C2B-brug (B9), partnerships, reviews, vergelijker-uitbreiding.

Bewust NIET op de backlog (guardrail): native apps, veiling, escrow, nieuwe wagens, leasing, extra talen, eigen certificering.

## 4. Openstaande vragen aan de gebruiker (§8 van het document)

Vastgelegd in `docs/product/OPEN_QUESTIONS.md`, niet automatisch geïmplementeerd:
1. Welke 2–3 DMS/feedformaten prioriteren voor B8/A3?
2. Car-Pass API-toegang (B7): bevestigd of handmatige vermelding?
3. Telefoontracking-strategie: eigen nummer-proxy of externe dienst?
4. FR-activatietiming: pilot of pas lancering?

## 5. Wat deze stap NIET doet

- Geen wijzigingen aan bestaande UI, edge functions, database of routing.
- Geen verwijdering van huidige features.
- Geen nieuwe migraties.
- Alleen documentatie + memory-updates. Concrete feature-implementaties volgen in aparte, per-item plannen (B8, B5, B7, alerts, enz.) zodra deze basis is goedgekeurd.

## Technische details

- Bestanden aangemaakt: `docs/product/PRODUCTFRAMEWORK.md`, `docs/product/README.md`, `docs/product/MVP_AUDIT.md`, `docs/product/BACKLOG.md`, `docs/product/OPEN_QUESTIONS.md`.
- Memory writes: `mem://product/framework-summary`, `mem://product/scope-guardrails`, update `mem://index.md`.
- Update `.lovable/reminders.md` met A#/B#-referentieregel.
- Geen code- of schema-changes in deze fase.

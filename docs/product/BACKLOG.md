# Backlog per fase

Afgeleid uit [`PRODUCTFRAMEWORK.md`](./PRODUCTFRAMEWORK.md) §6 en [`MVP_AUDIT.md`](./MVP_AUDIT.md). Elk item verwijst naar A#/B# in het framework.

## Fase 1 — Pre-pilot (tot datafeed gereed)

- **[B8] Migratietool AS24 → VATUUR** — importer voor AS24-export/feed (foto's + teksten + specs) + onboarding-wizard.
- **[A3.2] DMS/feed-import — shortlist** — bevestig 2–3 DMS-formaten bij BE-dealers en generaliseer `autoscout-sync/mapping.ts`.
- **[B5] Radicale prijstransparantie** — publieke `/prijzen`-pagina + tier-dashboard in dealeromgeving (verbruik "X van Y voertuigen") + self-service up/downgrade + maandelijkse opzegging.
- **[A1.7] SEO-long-tail** — merk/model/regio-landingspagina's, sitemap-uitbreiding, `schema.org/Vehicle` verifiëren op detailpagina.
- **[A4.3] GDPR-dataverwijdering** — flow voor accountverwijdering + cookiebeleid-pagina.
- **[A2.2] Spec-velden zichtbaar** — Euronorm, CO2, LEZ-compatibiliteit expliciet in detail-UI.

## Fase 2 — Pilot (3 maanden)

- **[A1.4] E-mailalerts bewaarde zoekopdrachten** — cron + `send-transactional-email` template.
- **[A1.5] Prijsdaling-melding favorieten** — trigger + notificatie.
- **[A3.4] Per-voertuig statistieken** — drilldown views/favorieten/leads/dagen online in dealer/Analytics.
- **[B7] Vertrouwenslaag** — Car-Pass-vermelding [TE BEVESTIGEN API], KBO-verificatie, verified-badge, gestructureerde keuring/garantie.
- **[B1] AI-prijsanalyse iteratie** — percentiel t.o.v. BE-aanbod + verwachte statijd op advertentiedetail.
- **[B2] AI-stockadvies iteratie** — afprijs- en inkoopadvies expliciet in dealer-AI.
- **[B3] AI-koopassistent begeleide flow** — gezin/EV/LEZ/TCO-vragenlijst, jargonuitleg.
- **[A4.4] Moderatiebasis** — review-queue particuliere zoekertjes + AI-prijsplausibiliteitscheck.
- **[A1.8] FR-i18n-scaffold** — architectuur klaar, activatie later.

## Fase 3 — Commerciële lancering (Q1–Q2 2027)

- **[B4] AI-advertentiegenerator FR** — Franse copy naast NL in `generate-listing`.
- **[A3.6] CSV-export leads** — dealer-export voor eigen CRM.
- **[B6] Boost-uitbreiding** — homepage-blok, topzoekertje-varianten.
- **[A1.8] FR-activatie** — publieke NL/FR-versie voor Wallonië.
- **Performance & schaal** — LCP-budget, CDN-assets, DB-indexen op hot paths.

## Fase 4 — Opschaling (2027–2028)

- **[B9] C2B-brug** — particuliere verkoper krijgt overnamebod-aanvragen van dealers.
- **Partnership-integraties** — financiering + verzekering (gesprekken vroeger starten, integratie na pilot).
- **Dealer-reviews** — reviews per dealer.
- **Vergelijker-uitbreiding** — richting Benelux.

## Guardrails — bewust NIET op de backlog

Zie framework §5. Niet bouwen vóór commerciële lancering: native apps, veiling/biedmodule, escrow, nieuwe-wagensegment, leasing-marktplaats, andere talen dan NL/FR, eigen fysiek certificeringsprogramma.

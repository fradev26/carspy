# VATUUR. — Productframework

> **Werkdocument voor productontwikkeling — Juli 2026 — Vertrouwelijk**
> Bron: `VATUUR_Productframework.pdf` (juli 2026).
> **Dit document is de single source of truth voor alle verdere productontwikkeling.**
> Bij conflict met bestaande implementatie wint dit document.

---

## 1. Doel en gebruik van dit document

Dit framework vertaalt de concurrentieanalyse (juli 2026) naar een concreet productplan. Het beantwoordt twee vragen: welke functies moet VATUUR overnemen van AutoScout24 omdat dealers en kopers ze als vanzelfsprekend beschouwen (**pariteitslaag**), en welke functies moeten VATUUR onderscheiden van de volledige markt — AutoScout24, Touring CarSelect, 2dehands, Okasie en Gocar (**differentiatielaag**). Elke functie krijgt een prioriteit (MoSCoW: Must/Should/Could) en een fase, afgestemd op de go-to-market-fasering: pre-pilot → pilot met founding dealers → commerciële lancering (Q1–Q2 2027, indicatief).

## 2. Positioneringsprincipe: drie lagen

- **Laag A — Pariteit** ("geen excuus"): een dealer die van AutoScout24 komt mag functioneel niets essentieels missen. Zelfde kernworkflow, eenvoudiger uitgevoerd.
- **Laag B — Differentiatie** (reden om over te stappen): AI-tools inbegrepen in élk abonnement, radicale prijstransparantie ín het product, een vertrouwenslaag en een migratiepad weg van AutoScout24.
- **Laag C — Fundament**: datamodel, feeds, SEO en meetbaarheid. Onzichtbaar voor de gebruiker, bepalend voor liquiditeit, schaalbaarheid en investeerderspitch.

---

## 3. Laag A — Pariteitsfuncties

### A1. Zoeken & vinden (consument)

| Functie | Toelichting | Prio | Fase |
|---|---|---|---|
| Facetzoeken | Merk, model, prijs, bouwjaar, km-stand, brandstof (incl. EV/hybride), transmissie, carrosserie, vermogen, zetels, kleur | Must | Pre-pilot |
| Locatie + straal | Postcode/gemeente met straalzoeken; liquiditeit is lokaal | Must | Pre-pilot |
| Sortering & paginering | Prijs, datum, km, relevantie; <1s resultaten | Must | Pre-pilot |
| Bewaarde zoekopdrachten + alerts | E-mailmelding bij nieuw aanbod binnen criteria | Must | Pilot |
| Favorieten + prijsdaling-melding | Bewaarlijst + notificatie bij prijswijziging | Must | Pilot |
| Vergelijker | 2–4 voertuigen naast elkaar | Could | Post-lancering |
| SEO-landingspagina's | Merk/model/regio (long-tail), sitemap, schema.org/Vehicle | Must | Pre-pilot |
| Tweetalig NL/FR | Vlaanderen eerst (NL), FR-architectuur voorzien vanaf dag één (i18n) | Should | Pilot |

### A2. Advertentiedetail

| Functie | Toelichting | Prio | Fase |
|---|---|---|---|
| Fotogalerij | 20–40 foto's, zoom, volgorde beheerbaar | Must | Pre-pilot |
| Volledige specificaties | Gestandaardiseerd (uitrusting, opties, verbruik, CO2, Euronorm — LEZ) | Must | Pre-pilot |
| Prijslabel | Marktvergelijking per voertuig (hergebruik van B1-motor) | Should | Pilot |
| Dealerprofiel | Voorraad, openingsuren, reviews (later), route | Must | Pre-pilot |
| Contactopties | Leadformulier, click-to-call, WhatsApp; alles gelogd | Must | Pre-pilot |
| Deelbare URL's | Nette permalinks per voertuig | Must | Pre-pilot |

### A3. Dealeromgeving

| Functie | Toelichting | Prio | Fase |
|---|---|---|---|
| Voorraadbeheer | CRUD, pauzeren, bulkacties, concept | Must | Pre-pilot |
| Datafeed / DMS-import | Automatische voorraadimport — startvoorwaarde pilot. Prioriteer 2–3 meest gebruikte DMS/feedformaten [TE BEVESTIGEN] | Must | Pre-pilot |
| Leadinbox | Centraal: formulier + call + WhatsApp; status; notificatie | Must | Pre-pilot |
| Statistieken per voertuig | Views, favorieten, leads, dagen online — leesbaar dashboard | Must | Pilot |
| Multi-user & rollen | Meerdere medewerkers per dealeraccount | Could | Post-lancering |
| CSV-export leads | Voor dealers met eigen CRM | Should | Lancering |

### A4. Particulier verkopen & platform-basics

| Functie | Toelichting | Prio | Fase |
|---|---|---|---|
| Gratis particulier zoekertje | Flow <10 min met prijsindicatie (pariteit + liquiditeit, zie B9) | Must | Pilot |
| Mobile-first responsive web | PWA volstaat in fase 1, geen native apps | Must | Pre-pilot |
| Accountbeheer & GDPR | Registratie, wachtwoord, dataverwijdering, cookiebeleid | Must | Pre-pilot |
| Moderatie & anti-fraude basis | Handmatige review particuliere zoekertjes; prijsplausibiliteit via AI | Must | Pilot |

---

## 4. Laag B — Differentiatiefuncties

Kernprincipe: **AI-tools zitten inbegrepen in élk abonnement.**

| # | Functie | Wat het doet / waarom het onderscheidt | Prio | Fase |
|---|---|---|---|---|
| B1 | AI-prijsanalyse (dealer) | Reeds in MVP. Uitbouwen: percentiel t.o.v. BE-aanbod, adviesprijs, verwachte statijd. Fastback bedient enkel B2B. | Must | Pilot (iteratie) |
| B2 | AI-stockadvies (dealer) | Reeds in MVP. Welke voertuigen te lang staan (afprijs), welke segmenten roteren (inkoop). Beslissingstool → retentie. | Must | Pilot (iteratie) |
| B3 | AI-koopassistent (consument) | Reeds in MVP. Begeleide zoektocht: gezin, EV-laden, LEZ, TCO, jargonuitleg. PR-verhaal. | Must | Pilot (iteratie) |
| B4 | AI-advertentiegenerator | Foto's + kenteken/VIN → volledige advertentietekst NL én FR. Gratis in elk abonnement, tweetalig. | Should | Lancering |
| B5 | Radicale prijstransparantie in product | Publieke prijspagina, tier-dashboard (X van Y voertuigen), self-service up/downgrade, maandelijks opzegbaar, geen verborgen kosten. Anti-AS24-statement in UX. | Must | Pre-pilot |
| B6 | Verkoopboosts self-service | €10–35 per voertuig: hogere positie, homepage-blok, topzoekertje. Tweede omzetpijler. | Should | Lancering |
| B7 | Vertrouwenslaag | Car-Pass-vermelding [TE BEVESTIGEN API], keuring & garantie gestructureerd, dealerverificatie (KBO) + verified badge. | Should | Pilot |
| B8 | Migratietool 'switch in één dag' | Import AS24-export/feed of DMS, incl. foto's en teksten; wizard. Verlaagt overstapdrempel. BMA-precedent dataportabiliteit. | Must | Pre-pilot |
| B9 | Gratis particuliere zoekertjes als liquiditeitsmotor | Voedt koperverkeer (vs. betalend 2dehands). Latere C2B-brug: overnamebod-aanvragen van dealers. | Must | Pilot |

**Bewust uitgesteld (post-funding, na validatie koperverkeer):** geïntegreerde financiering & verzekering (partnerships gesprekken vroeger starten), dealer-reviews, voorraadfinanciering.

---

## 5. Bewust NIET bouwen (scope-discipline)

Vóór de commerciële lancering **geen**:
- Native iOS/Android-apps (PWA volstaat, halveert onderhoudslast)
- Veilings- of biedmodule
- Eigen betaal- of escrowsysteem
- Nieuwe-wagensegment
- Leasing-marktplaats
- Andere talen dan NL/FR
- Eigen certificeringsprogramma met fysieke inspecties (B7 gebruikt bestaande bronnen zoals Car-Pass)

Elk item verdubbelt de scope zonder het kernprobleem — koperliquiditeit en dealerwaarde — te dienen.

---

## 6. Fasering

| Fase | Timing | Inhoud | Klaar wanneer |
|---|---|---|---|
| **Sprint 0 — MVP-audit** | Week 1–2 | MVP toetsen aan A/B; techschuld + datamodel; MoSCoW-backlog | Gedeelde backlog + planning |
| **Fase 1 — Pre-pilot** | Tot datafeed gereed | Datafeed/DMS (A3), migratietool (B8), pariteit A1–A3, prijstransparantie (B5), SEO-fundament, GDPR | 10–15 founding dealers live, onboarding <1 dag |
| **Fase 2 — Pilot** | 3 maanden | Statistieken per voertuig, alerts & favorieten, particuliere flow + moderatie, iteratie B1–B3, vertrouwenslaag (B7) | Pilot-KPI's: AI-gebruik, onboardingsnelheid, 3-mnd-retentie |
| **Fase 3 — Commerciële lancering** | Q1–Q2 2027 | Boosts live (B6), AI-advertentiegenerator (B4), CSV-export, FR-activatie, performance & schaal | Betalende dealers; boosts als 2e omzetbron |
| **Fase 4 — Opschaling** | 2027–2028 | C2B-brug (B9), partnerships financiering/verzekering, multi-user, vergelijker, reviews | Benelux-gereed |

---

## 7. Succesmetrics per laag

- **Pariteit**: onboardingtijd <1 dag; ≥95% dealerstock via feed; leadaflevering <1 minuut.
- **Differentiatie**: wekelijks actief AI-gebruik door ≥60% pilotdealers; % prijsadvies opgevolgd; NPS founding dealers.
- **Fundament/liquiditeit**: organisch SEO-verkeer, alert-conversie, leads per voertuig per maand (kern-metric richting investeerders, gekoppeld aan koper-CAC).

---

## 8. Openstaande punten

Zie [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md). Kernpunten [TE BEVESTIGEN]:
1. Actuele featurelijst MVP vs. laag A → zie [`MVP_AUDIT.md`](./MVP_AUDIT.md).
2. Welke DMS/feedformaten prioriteren.
3. Car-Pass API-toegang of handmatige vermelding.
4. Techstack no-code/AI: wat herbouwen vs. uitbouwen.
5. Telefoontracking: eigen nummer-proxy of externe dienst.

---

## 9. Bronnen

- VATUUR Concurrentieanalyse (juli 2026)
- AIM Group — 'AutoScout24 launches dealer dashboard' (okt 2025)
- Automotive Online (jan 2026)
- AutoScout24.be — prijslabels, pakketten, dealeraanbod, alerts
- VATUUR Bijlage D — Go-to-market strategie (juni 2026)
- VATUUR Onepager Investeringsvoorstel (juli 2026): pricing STARTER/DEALER/PRO, boosts €10–35

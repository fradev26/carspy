

## Plan: Betaalde Boost & Premium advertenties met Stripe

### Aanbevolen provider: Stripe
Uit de geschiktheidscheck blijkt dat **Stripe** de beste fit is voor VATUUR. Paddle (Merchant of Record) is niet geschikt omdat het platform transacties rond fysieke goederen (auto's) faciliteert. Stripe geeft je volledige controle, ondersteunt eenmalige betalingen perfect, en is kostenefficiënt voor de Belgische/Nederlandse markt (~1,5% + €0,25 voor Europese kaarten).

Goed nieuws: je hebt **geen eigen Stripe-account nodig** om te starten — Lovable's ingebouwde Stripe-integratie werkt direct met een testomgeving. Voor live betalingen claim je later een Stripe-account (eenmalige verificatie).

---

### Wat we gaan bouwen

**Twee betaalde producten (eenmalige aankopen):**

| Product | Prijs (voorstel) | Looptijd | Effect |
|---|---|---|---|
| **Boost** | €9,95 | 7 dagen | Listing krijgt prioriteit in zoekresultaten + "Boosted" badge |
| **Premium** | €19,95 | 30 dagen | Boven Boost in resultaten + gouden kroon + uitgelicht op homepage |

De `listings`-tabel heeft hiervoor al de juiste velden: `is_premium` (boolean) en `boost_until` (timestamp). Geen schema-aanpassingen nodig.

---

### Implementatiestappen (3 fases)

**Fase 1 — Stripe activeren** (deze stap)
- `enable_stripe_payments` aanroepen → testomgeving wordt automatisch klaargezet
- Edge functions, secrets en webhook-infrastructuur worden geconfigureerd

**Fase 2 — Producten aanmaken**
- "Boost 7 dagen" en "Premium 30 dagen" als eenmalige producten in Stripe
- Prijzen instellen in EUR

**Fase 3 — Checkout & activatie inbouwen**
- "Promoot deze advertentie"-knop op het dashboard van de verkoper bij elke listing (en in `DealerDashboard` bulk-actie blijft werken)
- Modal met keuze Boost/Premium → Stripe Checkout opent
- Webhook handler activeert na betaling automatisch:
  - Boost → `boost_until = now() + 7 dagen`
  - Premium → `is_premium = true` + `boost_until = now() + 30 dagen` (auto-uitschakelen via cron of bij volgende fetch-check)
- Bevestigingspagina na succesvolle betaling
- Aankoophistoriek zichtbaar in dashboard

---

### Wat er gebeurt na het activeren
1. Een testomgeving (`sandbox`) is direct beschikbaar — je kan testen met test-creditcards zonder echt geld
2. Voor live betalingen: Stripe-account claimen + identiteitsverificatie (eenmalig, ~10 min)
3. **BTW**: Je beheert dit zelf. Stripe Tax is optioneel activeerbaar voor automatische BTW-berekening (raden we aan voor BE/NL)

### Vereisten
- ✅ Lovable Cloud is actief
- ⚠️ **Pro plan vereist** voor payments — bevestig dat dit klaar is

Klaar om Stripe te activeren?


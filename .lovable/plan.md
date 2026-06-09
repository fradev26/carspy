
# Plan: Conversie-landingspagina voor particulieren

Bouw verder op de bestaande `/wat-is-mijn-auto-waard` pagina en vul de ontbrekende vereisten in: AI-gedreven prijsanalyse in de hero, sterkere conversiefunnel naar accountcreatie en advertentieplaatsing, social proof, marketing-events en retargeting-hook.

## Funnel-flow

```
Hero (waardepropositie + analyse-form)
  → AI-analyse loader (event: analysis_started)
  → Resultaat-card met richtprijs, range, verkooptijd, AI-verdict (event: analysis_completed)
       ├── Primary CTA: "Maak gratis account aan" → /auth?intent=sell&prefill=… (event: account_intent)
       ├── Secondary CTA: "Plaats advertentie" → /verkopen?prefill=… (event: ad_intent)
       └── Tertiary: "Bekijk vergelijkbare wagens" → /zoeken?…
  → Exit-intent / scroll-bottom: retargeting-card "Bewaar mijn waardebepaling per e-mail" (event: retargeting_opt_in)
```

Bij elke meaningful step pushen we een rij naar `public.marketing_events` (anoniem trackbaar via een `session_id` cookie), zodat later doelgroepen te bouwen zijn (bv. "wagens > €20k waarvan eigenaar geen account heeft").

## Wijzigingen per laag

### 1. UI / Page (`src/pages/AutoWaarde.tsx` — uitgebreid, route blijft)
- Hero behoudt H1 maar krijgt vertrouwens-chips ("Gratis · Geen registratie · AI-gedreven · 2 min").
- Waardetool-form blijft (merk/model/jaar/km), aangevuld met optionele velden brandstof + transmissie zodat `vehicle-analysis` rijkere output geeft.
- Submit roept `vehicle-analysis` edge function aan (al bestaand) i.p.v. lokale formule. Lokale schatting blijft als fallback bij API-fout.
- Resultaat-card toont: richtprijs (groot), prijsrange (min/max), geschatte verkooptijd, AI-verdict, betrouwbaarheidsscore. Hergebruikt visuele taal van `PriceIndicator` (zelfde range-bar, badges, kleuren).
- Onder resultaat: 2 conversie-CTA's (account primary, advertentie secondary) + "Bewaar resultaat" e-mail capture (1 inputveld + knop) voor retargeting van afhakers.
- Nieuwe secties tussen tool en FAQ:
  - **Social proof**: 3 testimonials + statistieken-strip (X actieve kopers, Y wagens verkocht, gem. verkooptijd) in bestaande Card-stijl.
  - **3-stappen-funnel**: "Analyseer → Maak account → Verkoop" met genummerde badges.
  - **Vertrouwen**: bestaande trust-blok blijft.
- Sticky mobile CTA-balk (`lg:hidden`) onderaan: "Bereken mijn waarde" tot er een resultaat is, daarna "Maak account aan".

### 2. Tracking (nieuwe tabel + helper)
- Migratie: `public.marketing_events` met kolommen `event_name`, `session_id`, `user_id` (nullable), `page`, `payload jsonb`, `utm_source/medium/campaign`, plus standaardvelden.
  - GRANT INSERT op `anon` + `authenticated` (open insert want anoniem trackbaar), GRANT ALL op `service_role`, SELECT enkel voor admins via `has_role`.
  - RLS: insert toegestaan voor iedereen, select alleen voor `admin`-role.
- Nieuwe hook `src/hooks/useMarketingEvents.ts`:
  - Genereert/leest `vatuur_session_id` in `localStorage`.
  - Leest `utm_*` uit `URLSearchParams` (1× per sessie cachen).
  - Exporteert `trackEvent(name, payload)` die naar de tabel inserted én optioneel `window.dataLayer.push` doet zodat GTM later eenvoudig aansluit.
- Gebruikt op AutoWaarde voor: `page_view`, `analysis_started`, `analysis_completed`, `account_intent`, `ad_intent`, `retargeting_opt_in`.

### 3. Retargeting (lead capture)
- "Bewaar mijn waardebepaling" inputveld stuurt naar bestaande `dealer-lead` patroon? Nee — particulieren. Maak nieuwe simpele edge function `consumer-lead` of hergebruik `marketing_events` met `event_name='retargeting_opt_in'` + `payload.email`. Kies de tweede optie (geen nieuwe edge function nodig, alle data in 1 tabel queryable). E-mail wordt gevalideerd met zod-achtige regex client-side.

### 4. Prefill naar volgende stap
- Bij klik op CTA's serialiseren we wagengegevens (`brand`, `model`, `year`, `mileage`, `suggested_price`) naar query-string zodat `/auth` en `/verkopen` deze later kunnen oppikken (bestaande pagina's lezen ze nog niet — dat blijft scope voor later, parameters worden enkel meegegeven en blijven inert tot opgepikt).

### 5. SEO
- `SEOHead` aangevuld: og:type "website", og:title/description identiek, voeg `Service` JSON-LD toe ("Gratis autotaxatie").
- H1 blijft uniek, semantische `<section aria-labelledby>` per blok.

## Bestanden

**Nieuw**
- `supabase/migrations/<ts>_marketing_events.sql` — tabel + GRANTs + RLS (insert open, select admin-only) + update-trigger.
- `src/hooks/useMarketingEvents.ts` — session_id, utm capture, `trackEvent` helper.

**Aangepast**
- `src/pages/AutoWaarde.tsx` — herwerkte hero/result-card, AI-call, nieuwe secties, sticky mobile CTA, event-tracking, e-mail capture.
- Geen wijzigingen aan `vehicle-analysis` edge function (bestaande contract volstaat).

## Technische details

- `vehicle-analysis` verwacht een `listing`-object met `title/brand/model/year/mileage/fuelType/transmission/features/price`. We sturen een geconstrueerde stub mee zonder `price` zodat de functie zelf `suggestedPrice` voorstelt (dat code-pad bestaat al).
- Loader-state: skeleton-card met shimmer in resultaatsectie tijdens AI-call (~3-6s).
- E-mail validatie client-side met regex; server-side via `marketing_events` insert (alle velden optioneel/jsonb, dus geen DB-validatie nodig — wel max-lengte op email TEXT kolom).
- Sticky CTA respecteert `.bottom-nav-above` utility voor safe-area + bottom-nav clearance (conform memory).
- Geen nieuwe kleurtokens of fonts. Hergebruik `bg-primary`, `bg-accent`, `text-muted-foreground`. Geen grote rode vlakken (conform memory).
- Geen schema-impact op `listings` of `profiles`.

## Out of scope

- `/auth` en `/verkopen` consumeren de nieuwe prefill-querystrings nog niet — die feature kan in een vervolgvraag indien gewenst.
- GA4/Meta-pixel installatie — `dataLayer.push` is voorbereid, externe tags volgen later.
- Exit-intent modal — voorlopig vervangen door e-mail capture in resultaatcard; volwaardig exit-intent kan later toegevoegd worden.

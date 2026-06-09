# Van waardebepaling → advertentie in 1 klik + dealer-pool

## Doel

1. Na de AI-analyse op `/wat-is-mijn-auto-waard` moet een particulier in **zo min mogelijk klikken** zijn auto online hebben.
2. Elke geanalyseerde wagen wordt opgeslagen als **lead**, zodat we hem later (na 2 weken zonder verkoop of na een afgelopen boost) automatisch kunnen aanbieden aan dealers.

## 1. Snelste verkoop-flow (frictie weghalen)

Vandaag stuurt de resultaten-kaart naar `/auth` of `/verkopen` met query-params. Dat zijn 2 schermen extra. Nieuwe flow:

**Eén primaire CTA in de resultaat-kaart:** `Plaats gratis advertentie →`

Gedrag afhankelijk van auth-status:

- **Ingelogd:** klik creëert direct een `listings`-rij met `status='draft'`, prijs = `suggestedPrice`, brand/model/year/mileage/fuel/transmission uit het form. Redirect naar `/verkopen?draftId=…&step=2` (foto's & beschrijving). Geen formulier-stappen meer herhalen.
- **Niet ingelogd:** inline mini-form in dezelfde kaart (alleen e-mail + wachtwoord, geen volledige redirect naar `/auth`). Bij submit:
  - `signUp` met meta `intent: 'sell'`
  - direct daarna draft-listing inserten via dezelfde call
  - redirect naar `/verkopen?draftId=…&step=2`
  
  Eén secundaire link "Ik heb al een account" → opent kleine login-popover die hetzelfde doet na inloggen.

Resultaat: van resultaat naar foto-upload in **1 klik (ingelogd)** of **1 formulier-submit (nieuw account)**.

Bij-aanpassingen in `src/pages/Sell.tsx`:
- Bij `?draftId=…` in URL: laad de bestaande draft, vul `formData` in, start op stap 2 (foto's).
- Bij `Publiceren`: `update` op de draft i.p.v. `insert`, zet `status='active'`.

## 2. Vehicle leads opslaan (dealer-aanbod pool)

Elke voltooide analyse wordt bewaard, ook als de gebruiker niets verder doet. Dit voedt de toekomstige dealer-marktplaats.

Nieuwe tabel `public.vehicle_leads`:
- `brand, model, year, mileage, fuel_type, transmission`
- `estimated_price, price_min, price_max`
- `email` (nullable, alleen als opt-in)
- `user_id` (nullable, gevuld zodra account)
- `listing_id` (nullable, gevuld zodra advertentie aangemaakt)
- `session_id, utm_source, utm_medium, utm_campaign`
- `status` enum: `analyzed | account_created | listed | sold | offered_to_dealers`
- `offer_eligible_at` timestamp (= moment waarop hij naar de dealer-pool mag)

RLS:
- `INSERT` open voor anon/authenticated (analyses moeten kunnen worden vastgelegd zonder login)
- `SELECT` alleen voor `admin` en (later) `dealer` rol
- `UPDATE` alleen via security definer functies / edge functions

Hook `useMarketingEvents` blijft events loggen; daarnaast schrijft `AutoWaarde.tsx` na `analysis_completed` één rij in `vehicle_leads`.

## 3. Auto-promotie naar dealer-pool

Een wagen is "dealer-eligible" als:
- gekoppelde `listings`-rij bestaat, status nog `active`, **en**
- `(now() - listings.created_at) > 14 days` **of** `boost_until` voorbij zonder verkoop

Implementatie:
- DB-functie `public.mark_dealer_eligible_leads()` die alle `vehicle_leads` met bijhorende listing die aan bovenstaande voldoet op `status='offered_to_dealers'` en `offer_eligible_at=now()` zet.
- Cron-job (pg_cron) draait dagelijks en roept deze functie aan. Geen edge function nodig — pure SQL.
- Wanneer een listing `status='sold'` krijgt, trigger zet de lead op `status='sold'` (geen aanbieding meer aan dealers).

Het dealer-marktplaats UI zelf valt buiten scope van deze taak — de pool is enkel datavoorbereiding.

## Technische wijzigingen

**Nieuw:**
- `supabase/migrations/<ts>_vehicle_leads.sql` — tabel + GRANT + RLS + `mark_dealer_eligible_leads()` + trigger op `listings.status` + pg_cron schedule
- Helper-functie in `src/lib` om een lead te inserten vanuit de browser

**Aangepast:**
- `src/pages/AutoWaarde.tsx`
  - Schrijf `vehicle_leads`-rij bij `analysis_completed`
  - Vervang dubbele CTA-kaart door één primaire "Plaats gratis advertentie" + inline auth/draft-creatie
  - Verwijder/relegate de losse "Maak account" + "Plaats advertentie" knoppen
- `src/pages/Sell.tsx`
  - Ondersteun `?draftId=…&step=2`: bestaande draft laden, op stap 2 starten
  - Submit doet `update` i.p.v. `insert` als er een draftId is
- `src/hooks/useMarketingEvents.ts` — geen wijziging nodig

**Niet gewijzigd:** `vehicle-analysis` edge function, dealer-pagina's, bestaande tracking-tabel.

## Out of scope (later)
- Dealer-zijde UI om de pool te bekijken / bieden
- E-mail-notificatie naar de verkoper wanneer dealers een bod doen
- Anonimiseren/maskering van persoonsgegevens richting dealers

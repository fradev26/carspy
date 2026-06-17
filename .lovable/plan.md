# Boost & Abonnement systeem

## 1. Instellingen-pagina (snelle UI-wijziging)

`src/pages/dealer/Settings.tsx` — bedrijfskaart:
- "Profiel bewerken" knop op `w-1/2` (of in `grid grid-cols-2 gap-2`).
- Nieuwe knop ernaast: **"Boosten"** (zelfde stijl, secondary). Opent `BoostDialog` met overzicht + selectie van een wagen uit eigen voorraad.
- Nieuwe rij in sectie **Account**: "Abonnement" → `/zakelijk/abonnement` (vervangt huidige `soon()`-actie).

## 2. Database (migration)

Nieuwe tabellen in `public`:

```text
subscription_plans         (catalogus, seeded)
  id, code, name, monthly_price_cents,
  included_turbo, included_nitro

boost_packages             (catalogus, seeded)
  id, code, name, duration_days, price_cents

dealer_subscriptions       (1 actief per user)
  id, user_id, plan_id, status, period_start, period_end

boost_usage                (logregel per geactiveerde boost)
  id, user_id, listing_id, package_code (turbo|nitro),
  source (included|extra), price_cents, duration_days,
  starts_at, ends_at, billing_period (date)
```

Seed-data:
- Plans: `premium_dealer` €49,95 / 10 turbo / 0 nitro · `premium_plus` €149,95 / 40 / 10 · `enterprise` €299,95 / 100 / 30.
- Packages: `turbo` 7d €4,95 · `nitro` 14d €7,95.

RLS: alle 4 tabellen `enable RLS`. Catalogus (`subscription_plans`, `boost_packages`) → `SELECT` voor `authenticated`. `dealer_subscriptions` + `boost_usage` → user mag enkel eigen rijen lezen/schrijven; `service_role` volledige toegang. GRANTs per regels in projectinstructies.

RPC `public.activate_boost(_listing_id uuid, _package_code text)` (security definer):
1. Check listing eigendom (`is_listing_owner`).
2. Bepaal huidige periode-verbruik vs. plan-quota.
3. `source = 'included'` als quota over, anders `'extra'` met `price_cents` uit `boost_packages`.
4. Insert `boost_usage` + update `listings.boost_until = now() + duration_days` + `is_boosted = true` (bestaande trigger `sync_listing_boost_status` regelt vlag).
5. Returnt `{ source, remaining_turbo, remaining_nitro, extra_cost_cents }`.

View / helper-functie `public.get_current_billing(_user_id uuid)` → maandkost = `plan.monthly_price + sum(extra boost_usage in periode)`.

## 3. Frontend

### `BoostDialog` (nieuw, `src/components/boost/BoostDialog.tsx`)
- Header: "Boost een wagen"
- Toont 2 pakketkaarten (Turbo / Nitro) met prijs + duur + badge "Inclusief in je abonnement" of "+€X,XX extra".
- Wagen-selector (Combobox van eigen actieve listings).
- Actieknop → roept RPC `activate_boost` aan, toast met resultaat + eventuele extra kost.

### Voorraad
- `src/pages/dealer/Inventory.tsx`: per kaart een **"Boost"** knop (opent `BoostDialog` met listing prefilled).
- Bulk: checkboxes + actiebalk "Boost geselecteerde" → opent `BoostDialog` in bulk-modus (looped).

### Nieuwe pagina `/zakelijk/abonnement` (`src/pages/dealer/Subscription.tsx`)
- Huidig plan-overzicht met inclusieve boosts en gebruik (`x van y turbo gebruikt`).
- Lijst van extra boost-aankopen deze periode + totaal extra kost.
- **Totale maandkost = basis + extra's** prominent bovenaan.
- Plan-wisselaar (UI; schrijft naar `dealer_subscriptions`).
- Verwijst naar bestaande Instellingen → "Boosten" voor activatie.

## 4. Niet in scope
- Echte betaling/Stripe.
- Admin facturatiemodule (komt later — data wordt nu wel correct opgeslagen zodat dit bovenop kan).
- E-mailmeldingen rond boost-verloop.

## Technische details
- Geen wijziging aan `BottomNav`, routes elders, of bestaande AutoScout-integratie.
- Hergebruikt `is_listing_owner`, `sync_listing_boost_status`, `refresh_boosted_status`.
- Periode-grens: `period_start`/`period_end` op `dealer_subscriptions`; bij ontbrekende sub fallback naar `date_trunc('month', now())`.
- Bedragen overal in cents (`integer`) opgeslagen, geformatteerd in NL-locale in UI.

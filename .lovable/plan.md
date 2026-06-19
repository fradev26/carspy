# Redesign /zakelijk/abonnement — premium en conversie-gericht

## Probleem

Huidige pagina toont een eenvoudige opsomming van plannen + quota, met de globale "Auto verkopen"-sticky bovenop, geen duidelijke focus-CTA, geen facturatieblok, geen FAQ, geen hiërarchie tussen status / aanbod / verbruik. De abonnementenkaarten missen vergelijking, voordelen-bullets en aanbevelingsbadges. Op mobiel concurreert de "Auto verkopen"-CTA met de abonnements-CTA.

## Aanpak

### 1. Focus & navigatie (P1)

`src/layouts/DealerLayout.tsx`: verberg de sticky "Auto verkopen"-knop op `/zakelijk/abonnement` via `useLocation()`. Andere dealer-pagina's behouden hem. De enige primaire CTA op de abonnementspagina is plan-gerelateerd (Activeer / Upgrade / Beheer).

### 2. Statusoverzicht (hero card)

Eén premium overzichtskaart bovenaan:
- Linkerkolom: huidige plan-naam (of "Geen actief abonnement"), badge "Actief"/"Inactief", maandkosten als hero-prijs, basis + extra-boost-kosten uitgesplitst, factuurperiode (start → eind), volgende factuurdatum (period_end + 1 dag).
- Rechterkolom (desktop) / onder elkaar (mobiel): twee `QuotaBar`s voor Turbo en Nitro met gebruik, totaal en restant.
- Single primaire CTA naast hero: `Beheer abonnement` (scroll naar plannen) als er een actief plan is, anders `Activeer Premium` (scroll naar aanbevolen plan).
- Subtiele premium gradient + `shadow-elegant`, geen rode vlakken (huisstijl).

### 3. Abonnementskaarten

`PlanCard`-component met:
- Plannaam, korte tagline (afgeleid van plan-code: Starter/Premium/Pro).
- Maandprijs (groot) + `/maand`.
- Voordelen als bullets met `Check` icoon: turbo/nitro-quota, geschatte besparingen vs extra-boost-prijs, prioriteit in zoekresultaten (premium/boost), AI-prijsanalyse.
- Aanbevelingsbadge: `Meest gekozen` op middelste plan, `Beste waarde` op duurste; via `recommended_badge` lookup in component (geen DB-wijziging nodig).
- Prominente full-width CTA: `Activeer <plan>` / `Upgrade naar <plan>` / `Huidig plan` (disabled, outline).
- Actief plan krijgt `ring-2 ring-primary/40` + `shadow-glow-premium`.
- Layout: grid `md:grid-cols-3`, op mobiel onder elkaar (stack) met aanbevolen plan eerst.

### 4. Gebruiksstatistieken

Nieuwe sectie "Jouw gebruik deze periode" — 4-tegel grid:
- Turbo boosts: gebruikt / inbegrepen, restant in fractie.
- Nitro boosts: idem.
- Actieve advertenties: count uit `listings` (`status='active' AND user_id=auth.uid()`, lichte query).
- Geboosted nu: count waar `boost_until > now()`.

Compacte tegels (icoon + getal + label), responsive grid `grid-cols-2 md:grid-cols-4`.

### 5. Facturatie

Sectie "Facturatie":
- Betaalmethode-rij: placeholder "Nog niet geconfigureerd" + `Beheer betaalmethode` button (linkt naar `/zakelijk/instellingen#facturatie` met disabled state + tooltip "Binnenkort beschikbaar"). Eerlijk zichtbaar dat geautomatiseerde betaling nog komt — toch een rij om vertrouwen op te bouwen.
- Volgende incasso: datum + bedrag (`billing.total_cents`).
- Factuurgeschiedenis: lijst per periode op basis van `boost_usage` aggregaties (max 6 recente periodes) met "Download" disabled-knop / "Coming soon" label. Anders fallback "Nog geen facturen beschikbaar".

Geen nieuwe DB-velden. Geen koppeling met Stripe/Paddle in deze iteratie — out of scope, dat is een aparte aanvraag (zie payments-pre-enable indien gewenst).

### 6. Compacte FAQ

`Accordion` (`@/components/ui/accordion`) met 6 vragen:
- Hoe activeer ik een abonnement?
- Wat is het verschil tussen Turbo en Nitro?
- Kan ik op elk moment upgraden of downgraden?
- Wat gebeurt er met ongebruikte boosts aan het einde van de periode?
- Hoe zeg ik mijn abonnement op?
- Wanneer wordt mijn factuur opgesteld?

Antwoorden statisch, in `nl-BE` tone. Plaats onderaan, voor visuele afsluiting.

### 7. Layout, spacing & responsiviteit

- Container: `max-w-4xl` (i.p.v. `3xl` — meer ademruimte voor 3 kaarten naast elkaar), `py-6 md:py-10`, `space-y-8`.
- Pagina-header met titel `Abonnement` + ondertitel `Beheer je plan en boost-verbruik`.
- Mobiel: alle secties full-width, kaarten stacken, geen horizontale scroll. `pb-28` voor BottomNav clearance.
- Spacing-consistentie: secties `space-y-3`, kaarten `p-5` (desktop) / `p-4` (mobiel).
- Typo: `text-xl md:text-2xl` voor h1, `text-base` voor sectie-koppen (uppercase tracking weghalen voor premium feel), hero-prijs `text-4xl font-bold tabular-nums`.
- Premium accenten: gradient subtiel op hero (`bg-gradient-to-br from-card via-card to-primary/5`), `shadow-elegant` op hero, `ring-primary/40` op actief plan. Geen grote rode vlakken (memory-rule).
- Safe-area: behoud `pb-safe` waar relevant via bestaande utilities.
- Toegankelijkheid: alle interactieve elementen `min-h-11`, `aria-label` op upgrade-knoppen, `aria-live="polite"` op `switching`-state, focus-ring via `.focus-ring`.

### 8. Implementatie

- `src/pages/dealer/Subscription.tsx`: volledig herschrijven met nieuwe sectie-structuur en componenten.
- Nieuwe kleine sub-componenten in dezelfde file: `StatusHeroCard`, `PlanCard`, `UsageStats`, `BillingSection`, `SubscriptionFAQ`.
- Extra query: counts via `supabase.from('listings').select('id', { count: 'exact', head: true })` voor actieve en geboostede listings. Parallel met bestaande fetches in `load()`.
- `src/layouts/DealerLayout.tsx`: `useLocation` + conditional render van sticky CTA (`hideStickyCta = pathname.startsWith('/zakelijk/abonnement')`).

### 9. Verificatie

- Build moet groen blijven (geen TS-errors).
- Playwright snapshot van pagina op desktop (1280) + mobiel (375) om visueel te bevestigen: geen "Auto verkopen"-knop, hero-prijs zichtbaar, 3 plankaarten, FAQ uitklapbaar, geen horizontale scroll op 375px.
- Tabel met memory-rule check: focus-ring, geen grote rode vlakken, Inter/Montserrat, 12px radius (al via Card).

## Out of scope

- Echte payment-provider-integratie (Stripe/Paddle) — aparte plan-aanvraag.
- Wijzigingen aan `boost_usage` of `dealer_subscriptions`-schema.
- Downloaden van PDF-facturen.
- Nieuwe plan-tiers of prijswijzigingen.

## Bestanden

Gewijzigd: `src/pages/dealer/Subscription.tsx`, `src/layouts/DealerLayout.tsx`.

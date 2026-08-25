# Volledige audit VATUUR — 25 aug 2026

Uitgevoerd met: 99 unit tests (alle groen), TypeScript-check (schoon), security scan, DB-linter, RLS-inspectie via SQL, en live browsertests op desktop (1280px) en mobiel (393px) — publiek/uitgelogd én ingelogd als dealer Snabba Cars.

## A. Executive summary

**Kwaliteitsscore: 7,3 / 10** — solide fundament (tests groen, geen typefouten, geen build- of runtimefouten, RLS overal aan, geen horizontale overflow op mobiel), maar er zitten enkele echte flow-blokkades en één PII-lek tussen ingelogde gebruikers.

Top 10 op impact:

1. **PII-lek tussen ingelogde gebruikers** — `profiles` heeft een SELECT-policy `USING (true)` voor `authenticated`, met kolomrechten op `email`, `phone`, `vat_number`. Elke ingelogde gebruiker kan alle e-mailadressen en telefoonnummers van álle gebruikers en dealers uitlezen. (Anoniem is wél afgeschermd via kolomgrants — daar klopt het.) **Kritisch.**
2. **Dealer kan op desktop geen voertuig toevoegen** — de "Auto verkopen"-CTA staat alleen in `DealerLayout` met `md:hidden`. Op desktop bestaat er geen knop; `/zakelijk/voorraad` toont "Eerste voertuig toevoegen" uitsluitend bij lege voorraad. **Kritisch (kernflow).**
3. **Doodlopende knoppen naar `/verkopen` voor dealers** — `Dashboard.tsx:100`, `MyListings.tsx:127` en `MyLeadsPanel.tsx:275` linken naar `/verkopen` zonder `?dealer=1`; `Sell.tsx:154` stuurt dealers direct terug naar `/zakelijk`. De gebruiker klikt "Nieuwe advertentie" en belandt op Sales AI. **Hoog.**
4. **`boost_usage` is rechtstreeks beschrijfbaar** — policy `ALL … user_id = auth.uid()`. Een dealer kan met de client zelf boostregels invoegen met `source='included'` en `price_cents=0`, buiten `activate_boost()` om. Facturatiedata is dus niet betrouwbaar. **Hoog.**
5. **Dubbele DOM-id's op `/zoeken`** — `FilterPanel` wordt 3× tegelijk gerenderd (desktop-sidebar, mobiele sheet, secundair paneel). 86 checkboxes zonder toegankelijke naam en dubbele id's (`brand-Audi`, …); `label[for]` wijst altijd naar de eerste instantie, waardoor klikken op labels in de mobiele sheet de verkeerde checkbox raakt. **Hoog (functioneel + a11y).**
6. **Twee `<main>`-landmarks op alle `/zakelijk`-pagina's** — `AppLayout` en `DealerLayout` renderen er elk één. Screenreaders en de 404-pagina (géén `<main>`) zijn inconsistent. **Gemiddeld.**
7. **Rolfuncties negeren het bedrijf** — `member_role()`, `has_company_role()` doen `LIMIT 1` op elke actieve membership zonder `company_id`-filter. Zodra iemand bij twee bedrijven hoort, lekt de rol van het verkeerde bedrijf door in alle `can_*`-checks en dus in RLS. Nu nog niet zichtbaar (iedereen heeft 1 bedrijf), maar het is een tijdbom. **Gemiddeld/hoog.**
8. **Rolconflict in de navigatie** — dealers zien zowel `/dashboard` (particulier: "Mijn advertenties (14)", "Zoekalerts") als `/zakelijk/voorraad` met dezelfde data. Twee waarheden voor dezelfde voorraad. **Gemiddeld.**
9. **Anonieme leadspoofing** — de INSERT-policy op `dealer_leads` valideert lengtes maar niet `dealer_user_id`/`company_id`/`status`; iedereen kan leads aan een willekeurige dealer toeschrijven of meteen als "won" markeren. **Gemiddeld.**
10. **Ontbrekende formulierlabels en `<button>`-nesting** — zoekveld op `/help`, select op `/contact` en het zoekveld op `/zakelijk/voorraad` hebben geen label; op dealerpagina's staat een `validateDOMNesting`-waarschuwing (button in button). **Laag/gemiddeld.**

Wat aantoonbaar gezond is: alle 15 publieke en beveiligde routes laden zonder runtime-error, `/zakelijk`, `/dashboard`, `/favorieten`, `/verkopen` redirecten uitgelogd correct naar `/auth`, `SettingsRouteGuard` stuurt een dealer op `/account/instellingen` netjes door naar `/zakelijk/instellingen`, leads/analytics/voorraad tonen correct gescopete data, geen horizontale overflow op 393px, geen ontbrekende `alt`-attributen.

## B. Auditoverzicht per route

| Route | Rol | Geteste functies | Status | Bevinding | Ernst | Oplossing |
|---|---|---|---|---|---|---|
| `/` | Publiek | Hero, zoekbalk, categorieën, chat | Werkt | 1 h1, 1 main, geen fouten | — | — |
| `/zoeken` | Publiek | Filters, facetten, sortering, virtualisatie | Deels | 3× FilterPanel → dubbele id's, 86 naamloze checkboxes, 2× h1 | Hoog | FilterPanel-id's prefixen per instantie; 1 h1 |
| `/auto/:id` | Publiek | Galerij, specs, prijsindicator, contact | Werkt | — | — | — |
| `/dealers`, `/dealer/:slug` | Publiek | Overzicht, profiel, openingsuren, reviews | Werkt | dubbele id `pakketten` op `/dealers` | Laag | id uniek maken |
| `/help`, `/contact` | Publiek | Zoek, FAQ, formulier | Deels | zoekinput en select zonder label | Gemiddeld | `aria-label`/`<Label htmlFor>` |
| `/vergelijken` | Publiek | Lege staat | Werkt | duidelijke empty state | — | — |
| `*` (404) | Publiek | NotFound | Deels | geen `<main>`-landmark | Laag | in `<main>` wikkelen |
| `/auth`, `/wachtwoord-reset` | Particulier | Redirects vanaf beveiligde routes | Werkt | `state.from` wordt bewaard | — | — |
| `/dashboard` | Particulier + dealer | Tabs, CTA's | Deels | dealer ziet particulier dashboard; "Nieuwe advertentie" → doodlopend | Hoog | dealer doorsturen of CTA `?dealer=1` |
| `/account/advertenties` | Particulier | Tabs actief/concept/verkocht, terug-te-koop | Deels | zelfde doodlopende CTA voor dealers | Hoog | idem |
| `/account/instellingen` | Particulier | Guard, profielfoto, voorkeuren | Werkt | dealer → `/zakelijk/instellingen` | — | — |
| `/favorieten` | Particulier | Favorieten/recent/alerts | Werkt | lege staat correct | — | — |
| `/berichten` | Beide | Conversatielijst, realtime | Werkt | — | — | — |
| `/verkopen` | Particulier | Wizard 5 stappen, AI, concept | Deels | dealer zonder `?dealer=1` wordt weggestuurd | Hoog | expliciete dealer-ingang |
| `/zakelijk` (Sales AI) | Dealer | KPI's, chips, chat | Werkt | "Omzet deze maand €0 / −100%" klopt met data (laatste verkoop juli) maar leest als bug | Laag | periode-uitleg tonen |
| `/zakelijk/voorraad` | Dealer | Tabs, bulkselectie, boost, import/sync | Deels | geen "voertuig toevoegen" op desktop; zoekveld zonder label; 7 naamloze checkboxes | Kritisch | CTA in paginakop |
| `/zakelijk/voorraad/:id` | Dealer | Bewerken, status, reserveren | Werkt | — | — | — |
| `/zakelijk/leads` | Dealer | KPI's, filters, statuswijziging | Werkt | 7 leads correct gescopet op bedrijf | — | — |
| `/zakelijk/analytics(/:id)` | Dealer | Datumbereik, grafieken, drilldown | Werkt | — | — | — |
| `/zakelijk/import` | Dealer | CSV, AutoScout, handmatig | Deels | CSV en 2 van 3 kaarten "Binnenkort" | Gemiddeld | verwachting scherper labelen |
| `/zakelijk/instellingen` | Dealer | Koppelingen, publicatie, profiel | Deels | 3 koppelingen zijn stubs met toast | Laag | acceptabel, wel consistent |
| `/zakelijk/abonnement` | Dealer | Plannen, verbruik | Deels | geen actief abonnement mogelijk zonder betaling (bewust uitgesteld) | — | later |
| `/zakelijk/gebruikers` | Dealer/owner | Uitnodigen, rollen, audit | Werkt | owner-only correct afgeschermd | — | — |
| `/zakelijk/voorraad-instellingen` | Dealer/owner | Wizard, autosave | Werkt | — | — | — |
| `/uitnodiging`, `/unsubscribe` | Beide | Token-flows | Niet getest | vereist geldige token | — | testtoken genereren |

## C. Gebroken of verwarrende flows

**1. Dealer plaatst handmatig een auto (desktop) — geblokkeerd.**
`/zakelijk/voorraad` → geen enkele knop om toe te voegen (CTA is `md:hidden`, empty-state-CTA verschijnt niet bij 14 auto's) → dealer gaat naar `/dashboard` → "Nieuwe advertentie" → `/verkopen` → `Sell.tsx:154` redirect → `/zakelijk`. De enige werkende ingang is de handmatige URL `/verkopen?dealer=1`.

**2. Filters op mobiel.** `/zoeken` → filtersheet openen → merkcheckbox aanklikken via label: het label verwijst naar het id in de desktop-sidebar, dus de klik landt op de verborgen instantie.

**3. Twee voorraadwaarheden.** Dealer ziet `/dashboard` met "Mijn advertenties (14)" naast `/zakelijk/voorraad` met dezelfde 14 — verschillende acties per scherm, geen duidelijke hiërarchie.

**4. Boost buiten de RPC om.** Een dealer met de anon-key kan `boost_usage` rechtstreeks vullen; `get_current_billing()` telt die rijen mee. Facturatie is manipuleerbaar.

## D. Prioriteitenplan

**Fase 1 — kritiek en security**
1. `profiles`-policy vervangen door eigen-rij + `public_profiles`-view (middel)
2. `boost_usage` alleen-lezen maken voor clients, insert via `activate_boost()` (klein)
3. `dealer_leads` INSERT afdwingen via edge function / policy op `status` en toewijzing (middel)
4. Dealer-CTA "Voertuig toevoegen" op `/zakelijk/voorraad` (desktop + mobiel) (klein)
5. Alle `/verkopen`-links rolbewust maken (klein)

**Fase 2 — functioneel/UX**
6. `FilterPanel` unieke id-prefix per instantie + `aria-label` op checkboxes (middel)
7. `member_role`/`has_company_role` scopen op `company_id` (middel)
8. `/dashboard` voor dealers doorsturen naar `/zakelijk` (klein)
9. Eén `<main>` per pagina; 404 in `<main>`; één h1 op `/zoeken` (klein)
10. Ontbrekende labels op `/help`, `/contact`, voorraadzoekveld (klein)

**Fase 3 — polish**
11. `validateDOMNesting`-waarschuwing (geneste button) opruimen (klein)
12. Tapdoelen < 40px vergroten in dealerlijsten (middel)
13. "Omzet deze maand"-KPI met periodecontext en nulstaat (klein)
14. Ontbrekende tests: dealer-verkoopflow, FilterPanel-id's, RLS-regressietest per rol, invite/unsubscribe-tokens (middel)

## E. Implementatievoorstel (stapsgewijs, veilig)

- **Stap 1 (DB-only, geen UI-impact):** migratie met `profiles`-policy, `boost_usage`-lockdown, `dealer_leads`-hardening, `member_role`-scoping. Daarna security scan + linter opnieuw draaien en de bestaande hooks (`useProfile`, `useDealerLeads`, `usePermissions`) verifiëren tegen 401's.
- **Stap 2 (navigatie/CTA's):** dealer-CTA toevoegen, `/verkopen`-links rolbewust maken, `/dashboard`-redirect. Alles frontend, geen datamodelwijziging.
- **Stap 3 (FilterPanel):** id-prefix als prop, labels koppelen; regressietest op zoekfilters.
- **Stap 4 (a11y/landmarks/labels):** puur presentatie.
- **Stap 5 (tests):** nieuwe tests voor de flows uit stap 2 en 3.

Elke stap is los uitvoerbaar en afzonderlijk terug te draaien. Betalingen/Stripe blijven bewust buiten scope.

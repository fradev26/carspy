# Plan: Dealer Landingspagina (/dealers)

Een conversiegerichte, SEO-geoptimaliseerde landingspagina voor autobedrijven die zich willen aansluiten bij VATUUR. Bouwt voort op de bestaande designtaal — geen nieuwe componenten, kleuren of typografie.

## Route & navigatie

- Nieuwe pagina: `src/pages/Dealers.tsx`
- Route toevoegen in `src/App.tsx`: `/dealers` (lazy loaded, binnen `AppLayout`)
- CTA-knoppen verwijzen naar `/auth?type=dealer` (registratie) of `/zakelijk` (ingelogde dealers)

## Hergebruikte componenten & tokens

| Doel | Bestaand component |
|------|---------------------|
| CTA & button stijl | `@/components/ui/button` (`Button`, default `bg-primary`) |
| Pakket-cards & USP cards | `@/components/ui/card` |
| Labels op pakketten | `@/components/ui/badge` |
| FAQ | `@/components/ui/accordion` |
| Vergelijkingstabel | `@/components/ui/table` |
| SEO metadata + JSON-LD | `@/components/SEOHead` |
| Iconen | `lucide-react` (zoals al overal gebruikt) |
| Logo | `@/components/Logo` |
| Typografie/kleuren | Bestaande tokens: `primary`, `muted`, `muted-foreground`, `card`, `border`, `--radius` |
| Animaties | `animate-fade-in`, `hover-lift` (al in `index.css`) |

Geen nieuwe CSS-tokens, geen nieuwe kleurklassen, geen nieuwe fonts. `text-primary` voor accenten, geen grote rode vlakken (conform memory).

## Paginasecties (in volgorde)

1. **Hero** — Headline H1 "Meer zichtbaarheid. Meer leads. Meer autoverkopen.", subkop, 2 CTA's (`Start als dealer`, `Vergelijk pakketten` met smooth scroll naar #pakketten), 4 voordeel-chips met `CheckCircle2` icoon. Witte achtergrond met subtiele primary tint, geen gradient-vlak.
2. **Statistieken** — 4 stat-cards (Actieve bezoekers, Voertuigen online, Dealerpartners, Leads/maand) met placeholder cijfers in `Card` componenten.
3. **Waarom VATUUR** — 6 voordelen in 2x3/3x2 grid, icoon + titel + korte tekst per Card.
4. **Hoe het werkt** — 4 stappen met genummerde badges en pijlconnectoren op desktop.
5. **Pakketten** (`id="pakketten"`) — 3 pricing-cards naast elkaar (stacked op mobiel). Middelste (Premium Plus) krijgt `border-primary` + Badge "Beste prijs-kwaliteit". Elke card: prijs, doelgroep, feature-lijst met `CheckCircle2`, CTA-knop.
6. **Vergelijkingstabel** — `Table` met alle features × 3 pakketten, met `CheckCircle2` / waarde-cellen. Horizontaal scrollbaar op mobiel.
7. **Turbo & Nitro Boosts** — 2 uitleg-cards naast elkaar met `Zap` / `Rocket` iconen.
8. **6 USP's** — Grid met cards (Leads, Zichtbaarheid, Import, Profiel, Prijzen, Groei).
9. **Testimonials** — 3 cards met avatar-placeholder, naam, functie, bedrijf, quote, sterren.
10. **FAQ** — `Accordion` met 10 vragen, gekoppeld aan FAQPage JSON-LD.
11. **Eind-CTA** — Centrale sectie "Klaar om meer auto's te verkopen?" met primaire knop.
12. **Sticky mobile CTA** — Onderaan boven `BottomNav` (`.bottom-nav-above`-utility), enkel zichtbaar `lg:hidden`, verschijnt na hero (via scroll state).

## SEO

`SEOHead` gebruiken met:
- `title`: "Dealer worden bij VATUUR — Auto's adverteren voor autobedrijven"
- `description`: ~155 tekens rond "dealer advertenties plaatsen", "auto marketplace voor dealers", NL & BE.
- `canonical`: `https://vatuur.be/dealers`
- `jsonLd`: array met
  - `FAQPage` schema (10 vragen)
  - `BreadcrumbList` (Home > Dealer worden)
  - `Service` met provider `Organization` VATUUR.

H1 één keer (hero). H2 per sectie. H3 binnen pakket-cards en FAQ-categorieën. Semantische `<section>` met `aria-labelledby`.

## Sitemap & links

- `public/sitemap.xml`: nieuwe `<url>` voor `/dealers`.
- Geen wijziging aan Header/Footer in deze iteratie (kan eventueel in vervolgvraag, optioneel een footer-link toevoegen naar /dealers — vraag aan gebruiker indien gewenst, anders overslaan).

## Bestanden

- **Nieuw:** `src/pages/Dealers.tsx`
- **Edit:** `src/App.tsx` (lazy route)
- **Edit:** `public/sitemap.xml` (entry toevoegen)

## Technische details

- Pakketten en FAQ als const arrays bovenaan het bestand zodat ze later eenvoudig aanpasbaar zijn en hergebruikt worden voor het JSON-LD schema.
- Stats als const array met `{ label, value, icon }`.
- Smooth scroll via `<a href="#pakketten">` + `scroll-behavior` (al global niet ingesteld; gebruik `element.scrollIntoView({behavior:'smooth'})` in handler).
- Sticky mobiel-CTA: `fixed bottom-nav-above left-0 right-0 z-30 lg:hidden` met `bg-card/95 backdrop-blur border-t` en één primary button.
- Geen nieuwe dependencies.
- Geen backend-wijzigingen.

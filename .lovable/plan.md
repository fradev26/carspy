# Mobiele homepage: hero vervangen door direct aanbod

## Analyse huidige hero (mobiel, <768px)

Huidige elementen in de hero-sectie van `src/pages/Index.tsx`:

| Element | Functioneel nodig op mobiel? | Waarom |
|---|---|---|
| Achtergrondafbeelding (`hero-image-*`) | Nee | Puur decoratief, kost LCP & bandbreedte |
| H1 "Vind je volgende auto in één zin." | Ja (SEO) | Moet behouden, maar compacter en buiten visuele hero |
| `<HeroSearch />` (smart + classic zoekbalk) | Nee | Volledige zoek/filter is al beschikbaar via Bottom Nav → Zoeken én via hamburgermenu |
| CTA "Zoek auto's" | Nee | Dubbel met Bottom Nav "Zoeken" tab |
| CTA "Plaats advertentie" | Nee | Dubbel met Bottom Nav "Verkopen" tab |
| Trust indicators (3x checkmark) | Al `hidden md:flex` | Nu al verborgen op mobiel — geen wijziging nodig |
| Reviews 4.8/5 + sterren | Optioneel | Verplaatsen naar compacte trustbar |

Conclusie: niets in de hero is functioneel uniek op mobiel. Alles is óf decoratief, óf gedupliceerd via Bottom Nav, óf reeds desktop-only.

## Nieuwe mobiele structuur

```text
┌─────────────────────────────┐
│ Header (logo + hamburger)   │  bestaand, geen wijziging
├─────────────────────────────┤
│ Trustbar (≤48px)            │  NIEUW, mobile-only
│ 25.000+ • Geverifieerd • ★4.8│
├─────────────────────────────┤
│ Uitgelichte advertenties    │  bestaand, schuift omhoog
│ [grid van 6 cards]          │
├─────────────────────────────┤
│ Populaire merken (lg only)  │  ongewijzigd, blijft hidden op mobiel
│ Waarom VATUUR?              │
│ CTA "Auto verkopen"          │
│ FAQ                         │
└─────────────────────────────┘
```

Desktop (≥lg): volledige hero blijft 1:1 ongewijzigd.

## Implementatieplan

**Bestand: `src/pages/Index.tsx`**

1. **Hero-sectie wrappen in `hidden lg:block`** zodat de volledige `<section>` met achtergrondbeeld, H1, `HeroSearch`, CTA-knoppen, trust indicators en reviews enkel op desktop rendert. Dit behoudt alle bestaande markup en gedrag voor desktop.

2. **Mobile-only H1 toevoegen** vóór de trustbar als sr-only/visueel compacte heading, zodat SEO (één H1 per pagina) en screenreaders intact blijven:
   - `<h1 className="sr-only lg:hidden">Tweedehands auto's kopen en verkopen in Nederland en België</h1>`
   - Op desktop blijft de bestaande visuele H1 in de hero de H1.

3. **Mobiele trustbar toevoegen** (`lg:hidden`, max 48px hoog) direct onder de header, boven "Uitgelichte advertenties":
   - 3 compacte items in een flex-row, gescheiden door dots: `25.000+ auto's` · `Geverifieerde dealers` · `★ 4,8/5`
   - Gebruikt bestaande tokens (`bg-muted/30`, `text-muted-foreground`, `border-b`).
   - Geen afbeelding, geen JS → 0 CLS-risico.

4. **`AppLayout.tsx` aanpassen**: de homepage-uitzondering `pt-[env(safe-area-inset-top)] lg:pt-0` werkt nu omdat de hero zelf `-mt-14` heeft. Na deze wijziging is er op mobiel geen hero meer die onder de header schuift, dus de mobiele top-padding moet weer de standaard `pt-[calc(3.5rem+env(safe-area-inset-top))]` worden — alleen op desktop blijft `lg:pt-0` (hero schuift onder transparent header). Aanpassing: `isHomepage` conditie alleen voor `lg:` toepassen.

5. **Niets verwijderen aan**:
   - `SEOHead` + `websiteJsonLd` (WebSite/Organization/FAQPage schema) — ongewijzigd.
   - FAQ-sectie, "Waarom VATUUR?", "Uitgelichte advertenties", CTA-band "Auto verkopen in 2 minuten", Populaire merken — allemaal ongewijzigd.
   - `HeroSearch` component zelf wordt niet aangeraakt (blijft in desktop hero).

## SEO & performance check

- **H1**: exact één behouden (sr-only op mobiel, visueel op desktop) → geen regressie.
- **Structured data**: `websiteJsonLd` is geheel in `<SEOHead>`, los van hero markup → ongewijzigd.
- **FAQ-schema**: ongewijzigd.
- **LCP mobiel**: hero-afbeelding (1280w) wordt niet meer geladen op mobiel via `hidden lg:block` op de `<picture>` parent — Tailwind `hidden` zet `display:none`, maar browsers downloaden `<img>` nog steeds. Daarom: hero-`<section>` conditioneel renderen via een `hidden lg:block` wrapper plus voor de `<img>` een `media`-attribuut op de `<source>` toevoegen óf het `<img>` ook met `loading="lazy"` + `media`-source maken zodat mobiele browsers de bron overslaan. Concreet: voeg aan de bestaande webp/jpg `<source>` elementen `media="(min-width: 1024px)"` toe, zodat mobiele browsers de hero-asset niet downloaden. Resultaat: LCP-element op mobiel wordt het eerste listing-image (al `loading="lazy"` op posities >0; eerste card kan eager). 
- **CLS**: trustbar heeft vaste hoogte (≤48px) en geen async content → geen layout-shift. Verdwijnende hero verkleint juist de boven-de-fold complexiteit.
- **Conversie-check**: zoeken & verkopen blijven 1 tap weg via Bottom Nav (Zoeken-tab + Verkopen-tab), reviewscore blijft zichtbaar in trustbar, "25.000+" en "geverifieerd" claims blijven aanwezig. Geen verlies van conversiepaden.

## Geraakte bestanden

- `src/pages/Index.tsx` — hero wrappen in `hidden lg:block`, mobile H1 (sr-only) toevoegen, trustbar component inline toevoegen, `media` attribuut op hero `<source>` voor mobile-skip.
- `src/layouts/AppLayout.tsx` — homepage top-padding alleen op `lg:` op 0 zetten.

Geen nieuwe componenten, geen nieuwe dependencies, geen backend-wijzigingen.

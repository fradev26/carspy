# Plan: "Verkopen"-tab als sales cockpit

## 1. Hernoemen "Voorraad" → "Verkopen"

Alleen labels wijzigen, URL `/zakelijk/voorraad` blijft behouden (geen route-breuk, geen backend-impact).

- `src/components/BottomNav.tsx` — dealer-item label `Voorraad` → `Verkopen` (icoon blijft `Car`).
- `src/layouts/DealerLayout.tsx` — tab label + paginatitel `Voorraad` → `Verkopen`.
- `src/pages/dealer/Inventory.tsx` — H1, SEO-title, microcopy.

## 2. Cockpit-layout (Inventory pagina)

Drie duidelijke zones, top-down:

```text
┌──────────────────────────────────────────────┐
│ KPI strip (inzicht)        [collapsible mob] │
├──────────────────────────────────────────────┤
│ Slimme presets + chip-filters + zoek (live)  │
├──────────────────────────────────────────────┤
│ Kaart-grid van voertuigen (decision units)   │
└──────────────────────────────────────────────┘
```

### a. KPI strip — "voorraad-intelligentie"
Bestaande 4 KPI's (actief / views / favorieten / leads) **aanvullen** met 3 cockpit-metrics berekend uit `listings`:
- **Gem. tijd in voorraad** — `avg(now - createdAt)` over actieve listings, in dagen.
- **Snelst verkopend segment** — brand+bodyType met laagste gem. dagen-tot-`sold` (fallback: hoogste views/dag).
- **Prijspositie** — gemiddelde delta t.o.v. marktwaarde indien aanwezig op listing; anders een neutrale placeholder "—" met tooltip "binnenkort".

Mobiel: hele strip in een `<Collapsible>` met samenvattingsregel ("4 KPI's · open").

### b. Filters — frictieloos
- Chips **altijd zichtbaar**, **multi-select** (Set<string>), **live** (geen apply-knop — al zo).
- Presets-rij erboven (toggle-buttons, exclusief, deselecteerbaar):
  - 🔥 Snel verkopen — views > mediaan & leeftijd < 14d
  - 📉 Lang in voorraad — leeftijd > 60d
  - 💰 Hoge marge — `market_value - price > 0` indien beschikbaar, anders verborgen
- Zoekveld blijft, één regel met chips op desktop.
- Status `all` blijft als "Alle"-chip die alles reset.

### c. Listing weergave — kaarten i.p.v. tabel
Tabel vervangen door een **responsive grid** (1 col mobiel, 2 col md, 3 col xl) van compacte cards. Elke card = decision unit:

**Altijd zichtbaar**
- Foto (16:10), titel, jaar · km · brandstof
- **StatusBadge** (hergebruik `src/modules/listings/StatusBadge.tsx`)
- Prijs (groot) + marge-pill `+€1.250` of `-€800` (alleen indien data, kleur via `success`/`destructive`)
- Subtiele **"Vergelijk markt"** link-knop (ghost, icoon `BarChart3`)
- **Eén primaire actie**, contextueel:
  - status `draft` → "Verkoop starten" → `/zakelijk/voorraad/:id`
  - anders → "Bewerken" → `/zakelijk/voorraad/:id`

**Hover / expand (desktop hover, mobiel altijd compact zichtbaar als kleine icoontjes-rij)**
- Leads · Views · Dagen in voorraad

Bulk-selectie en bulkbar blijven werken (checkbox in card-hoek; bulkbar sticky bovenaan grid wanneer >0 geselecteerd).

### d. Empty state — actiegericht
Vervangen:
- Titel: **"Je eerste auto staat één klik weg"**
- Subtekst: "Binnen 2 minuten live voorraad."
- Primaire CTA: "Eerste voertuig toevoegen" → `/verkopen?dealer=1`
- Secundair (link-knop): "Of importeer via CSV" → `/zakelijk/import`
- (AutoScout-koppel CTA hier weghalen — woont in Instellingen)

### e. Wat eruit gaat (anti-clutter)
- Tabel-view volledig vervangen door grid.
- Dubbele acties op cards: enkel 1 primaire knop + "Vergelijk markt" + status-edit via badge-menu (popover op badge).
- Header-CTA-rij inkorten: enkel "Voertuig toevoegen" als prominent button; CSV-import + AutoScout-koppel verhuizen naar **Instellingen** (al beschikbaar daar) — vermeld via een subtiele "Meer importopties" link onder de KPI-strip.
- Inline price-edit verdwijnt uit de lijst (te druk); prijs bewerken gebeurt in detail (`Bewerken`).

## 3. Mobile-first details
- KPI strip collapsible.
- Filters: chips horizontaal scroll-bar op mobiel; presets eronder.
- Cards: 1 kolom, max 1 primaire actie, secundaire iconen-rij subtiel onderaan.
- Bulkbar onderaan boven de bottom-nav (sticky, met `pb-20` veilige zone).

## Technische noten

- Geen schema-wijzigingen. `useDealerAnalytics` levert alles wat nodig is; nieuwe metrics afgeleid client-side uit `listings[]` (createdAt, status, views).
- "Marge" / "marktpositie" zijn momenteel niet in `ListingAnalytics` — pill alleen tonen als veld bestaat, anders verborgen (graceful). Optioneel later: extend edge-function `dealer-analytics` met `marketDelta`. **Buiten scope van deze iteratie.**
- Hergebruik: `StatusBadge`, `Badge`, `Card`, `Collapsible`, `Button`.
- Routes / backend / RLS: ongewijzigd.

## Bestanden die wijzigen

- `src/components/BottomNav.tsx` (label)
- `src/layouts/DealerLayout.tsx` (label)
- `src/pages/dealer/Inventory.tsx` (volledige herwerk)

## Buiten scope

- Swipe-actie "Vergelijk markt" op mobiel (later).
- AI-gedreven cockpit-inzichten (later iteratie).
- Margin-data toevoegen aan backend.

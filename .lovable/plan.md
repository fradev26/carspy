
# VATUUR SalesAI — Chat-first dashboard

De Zakelijk-sectie krijgt **één centrale ervaring**: een fullscreen AI-chat die zichzelf opent met een live salesoverzicht (KPI's + insights). De dealer kan onmiddellijk doorvragen ("welke wagens moet ik afprijzen?", "schrijf een advertentie voor mijn Audi"). Geen aparte dashboardpagina meer — het dashboard zit *in* de chat.

## Concept

```text
/zakelijk  →  SalesAI (fullscreen chat)
┌─────────────────────────────────────────────┐
│  VATUUR. SalesAI                            │
│  Jouw digitale salesmanager                 │
├─────────────────────────────────────────────┤
│  [Auto-opening assistant message]           │
│                                             │
│  Goeiemorgen Jan 👋                         │
│                                             │
│  ┌──KPI──┬──KPI──┬──KPI──┬──KPI──┐          │
│  │Omzet  │Marge  │Verk.  │Leads  │          │
│  │ maand │ gem.  │ deze  │actief │          │
│  └───────┴───────┴───────┴───────┘          │
│                                             │
│  📊 3 inzichten vandaag:                    │
│  • 4 wagens >90 dagen online                │
│  • BMW levert hoogste marge (+€2.300)       │
│  • SUV's verkopen 2x sneller dan hatchback  │
│                                             │
│  [Quick chips: Welke afprijzen? · Top-      │
│   verkopers · Schrijf advertentie · Leads]  │
├─────────────────────────────────────────────┤
│  [Tekstinvoer: Vraag iets...]            ➤  │
└─────────────────────────────────────────────┘
```

De voorraadpagina blijft bestaan onder `/zakelijk/voorraad` (toegankelijk via tab of via "Open voorraad"-knop in chat-antwoorden).

## Sprint 1 — Wat we nu bouwen

### 1. Database (migratie)
Op `listings`:
- `cost_price integer`
- `sold_price integer`
- `sold_at timestamptz`
- `margin integer GENERATED ALWAYS AS (sold_price - cost_price) STORED`
- Trigger: bij overgang naar `status='sold'`, vul `sold_at = now()` als leeg.

Bestaande RLS dekt owner-only toegang; we verifiëren.

### 2. Edge function: `dealer-sales-summary`
JWT-validated. Aggregeert voor `auth.uid()`:
- KPI's: omzet (vandaag/week/maand + delta), aantal verkocht, gem. verkoopprijs, gem. marge €/%, brutowinst maand, conversieratio, actieve leads (`vehicle_leads`), gem. verkooptijd, gem. voorraadduur.
- Lijsten: top 5 stilstaand, top 5 hoogste marge verkocht, voertuigen die aandacht nodig hebben (>60 dagen actief).
- Insights (regels-gebaseerd, geen AI-call): array van korte zinnen ("4 wagens > 90 dagen", "BMW = hoogste marge", "Marge +X% vs vorige maand").

Eén response, gecached client-side via React Query (5 min).

### 3. SalesAI pagina `/zakelijk` (nieuwe landing)
- Fullscreen chat-UI (geen floating widget — volledige pagina, mobiel-first).
- **Auto-greeting** bij open: assistant-message met begroeting + **embedded KPI-cards + insights** gerenderd via custom message-parts (geen markdown-only).
- Quick-action chips boven de invoer, contextueel (gevuld vanuit summary).
- Standaard tekstinvoer voor vrije vragen.
- Bij elk antwoord kan de AI verwijzen naar `/zakelijk/voorraad?listing=ID` met directe link.

### 4. Edge function `chat` uitbreiden
- Nieuwe context `business`. `SYSTEM_PROMPT_BUSINESS`: digitale salesmanager + voorraadbeheerder, kort/commercieel/Vlaams, altijd actiegericht.
- JWT verplicht voor `business`. Server haalt compacte dealercontext op (zelfde data als summary, sterk samengevat in <2 kB tekst) en injecteert als system-context.
- Antwoorden mogen markdown-tabellen en `/auto/ID`- of `/zakelijk/voorraad?listing=ID`-links bevatten.

### 5. Navigatie
- `/zakelijk` (default) = SalesAI fullscreen.
- `/zakelijk/voorraad` = bestaande inventory.
- Dealer `BottomNav` + `DealerLayout` tabs: **SalesAI** / Voorraad / Stats / Import / Settings. SalesAI eerste tab, Sparkles-icoon.
- Floating `ChatWidget` is uit op `/zakelijk/*` (we hebben fullscreen).

### 6. UX-details
- Custom message-part `kpi-grid` rendert KPI-kaarten in een assistant-bubble.
- Custom message-part `insight-list` rendert bullet-insights met emoji.
- KPI's en insights worden bij elke nieuwe chatsessie opnieuw opgehaald + getoond.
- Empty state (geen verkopen ooit): assistant zegt "Markeer je eerste wagen als verkocht om je SalesAI te activeren" + link naar voorraad.
- Mobiel: chat vult viewport-min-bottomnav, KPI-grid 2 cols → desktop 4 cols.

## Nieuwe / gewijzigde files

**Nieuw:**
- `supabase/migrations/<ts>_listings_sales_tracking.sql`
- `supabase/functions/dealer-sales-summary/index.ts`
- `src/pages/dealer/SalesAI.tsx`
- `src/components/dealer/salesai/KpiGrid.tsx`
- `src/components/dealer/salesai/InsightList.tsx`
- `src/components/dealer/salesai/QuickChips.tsx`
- `src/hooks/useDealerSummary.ts`

**Gewijzigd:**
- `src/App.tsx` — route `/zakelijk` → SalesAI
- `src/layouts/DealerLayout.tsx` — tab "SalesAI" eerst, default redirect naar `/zakelijk`
- `src/components/BottomNav.tsx` — dealer-tab "SalesAI" (Sparkles)
- `src/hooks/useChat.ts` — context `business`, JWT-header doorsturen
- `src/modules/chat/ChatWidget.tsx` — verbergen op `/zakelijk/*`
- `supabase/functions/chat/index.ts` — `SYSTEM_PROMPT_BUSINESS` + dealercontext-loader voor `context='business'`

## Sprints later (uit scope nu)
- Sprint 2: per-listing AI-badges + quick-actions ("afprijzen", "boost", "herschrijf").
- Sprint 3: dagelijkse cron die insights pre-genereert in `dealer_insights` tabel.

Akkoord om Sprint 1 te bouwen?

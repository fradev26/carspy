# Plan: Voertuig-centrisch Zakelijk OS

Shift van "KPI-dashboard met tabs" naar "operating system rond het voertuig". Voorraad wordt de homepage, elk voertuig krijgt zijn eigen detail/operating page, analytics wordt management-niveau.

## Nieuwe structuur

### Route-laag
```
/zakelijk                       → redirect naar /zakelijk/voorraad
/zakelijk/voorraad              → Inventory (default landing)
/zakelijk/voorraad/:id          → Listing operating page (4 tabs)
/zakelijk/import                → Import & Sync hub
/zakelijk/leads                 → bestaande MyLeadsPanel
/zakelijk/analytics             → Dealer-level analytics
/zakelijk/instellingen          → AutoScout connectie + bedrijfsinstellingen
```

Oude `?tab=` query-params blijven werken via redirects (backwards-compat voor bookmarks/emails).

### Layout
Nieuw `DealerLayout` met `SidebarProvider` (shadcn sidebar, `collapsible="icon"`):
- Voorraad (default, Car-icoon)
- Import (Upload-icoon)
- Leads (Inbox-icoon)
- Analytics (BarChart3-icoon)
- Instellingen (Settings-icoon)

Header binnen layout: dealer-naam + primaire CTA's `+ Voertuig toevoegen`, `Import CSV`, `Koppel AutoScout`.

## Schermen

### 1. Voorraad (landing)
- Search bar + filters: status, prijs, platform-badge, brandstof
- View-toggle: tabel ⇄ cards (default tabel op desktop, cards op mobiel)
- Bulk actions bar (bestaand: Premium/Boost) + nieuw: status wijzigen, verwijderen
- Per rij: foto, titel, prijs (inline edit), status-select, platform-badges (AutoScout sync-state), mini-stats (views/leads/favorieten), quick actions (bewerken → detail page, publiceren, verwijderen)
- KPI-tegels boven de tabel worden compact (1 rij, klein) i.p.v. dominant

### 2. Listing operating page `/zakelijk/voorraad/:id`
Tabs binnen de pagina:
- **Statistieken**: views/leads/favorieten/CTR + 7d en 30d trend (LineChart via Recharts; bestaande `views`/messages/favorites + `marketing_events` tabel voor trend)
- **Bewerken**: inline form (prijs, beschrijving, foto's, status). Hergebruik bestaande Sell-wizard velden waar mogelijk
- **Platforms**: AutoScout status (live/pending/error), laatste sync-tijd uit `autoscout_listings` + `autoscout_sync_runs`
- **Insights**: AI-cards (hergebruik `price-analysis` edge function); regelgebaseerde hints ("veel views, weinig leads → titel/foto's", "prijs > markt")

### 3. Import & Sync hub
Drie entry-cards:
- **CSV upload**: drag&drop → kolom-mapping step → validatie-preview → bulk insert. Hergebruik `admin-bulk-import` edge function als basis (dealer-scoped variant nieuw)
- **AutoScout API**: bestaand `AutoScoutPanel` hierin embedden; sync-rules UI (push/pull/bidirectional + conflict policy) bovenop bestaande `autoscout_sync_config`
- **Handmatig**: knop → bestaande `/verkopen?dealer=1` wizard

### 4. Analytics (management-niveau)
Vervangt huidige "Statistieken" tab. Nieuwe widgets:
- Totale voorraadwaarde (sum price actieve listings)
- Gemiddelde verkoopduur (created_at → sold-event)
- Top-performers (bestaand) + Slow-movers (omgekeerd, > 30d weinig views)
- Prijssegment-performance (BarChart conversie per €-bucket)

Geen "0 views / 0 leads" leeg-KPI's meer; bij empty-state: onboarding-card "Voeg je eerste voertuig toe".

## Componenten (nieuw)

```
src/layouts/DealerLayout.tsx              — sidebar shell
src/components/dealer/DealerSidebar.tsx
src/pages/dealer/Inventory.tsx            — verplaatst uit BusinessDashboard
src/pages/dealer/ListingOperating.tsx     — nieuw, 4 tabs
src/pages/dealer/Import.tsx               — CSV + AutoScout + handmatig
src/pages/dealer/Analytics.tsx            — management widgets
src/pages/dealer/Settings.tsx             — AutoScout + bedrijfsgegevens
src/components/dealer/InventoryTable.tsx  — geëxtraheerd
src/components/dealer/InventoryFilters.tsx
src/components/dealer/CsvImportWizard.tsx
src/components/dealer/PlatformBadges.tsx  — AutoScout sync-state badge
```

`BusinessDashboard.tsx` wordt een dunne redirect-component naar `/zakelijk/voorraad` (+ querystring-mapping).

## Wat NIET wijzigt in deze sprint
- Bestaand schema (`listings`, `autoscout_*`, `vehicle_leads`, `marketing_events`). Geen migraties.
- `MyLeadsPanel`, `AutoScoutPanel`, `MarketExplorer`, `AIPriceAnalysisPanel`, `price-analysis` edge function — hergebruikt as-is.
- `/verkopen` sell-wizard.
- Mobile bottom nav buiten `/zakelijk` blijft hetzelfde; binnen `/zakelijk` neemt de sidebar het over (op mobiel als Sheet via shadcn sidebar's built-in offcanvas).

## Sprint-volgorde (incrementeel, elke stap deploybaar)
1. `DealerLayout` + sidebar + routes + redirect van oude tab-URLs
2. `Inventory` extractie + filters/search/view-toggle uitbreiding
3. `ListingOperating` met 4 tabs (Statistieken + Bewerken eerst, Platforms + Insights daarna)
4. `Import` hub (AutoScout embed + handmatige link; CSV-wizard als laatste)
5. `Analytics` herwerkte widgets
6. `Settings` extractie

## Technische details
- Sidebar: shadcn `Sidebar` met `collapsible="icon"`, `SidebarTrigger` in DealerLayout-header (blijft zichtbaar bij collapse).
- Active route: `NavLink` met `isActive` (cf. shadcn-sidebar guideline in context).
- Trend-data 7/30d: aggregeer `marketing_events` waar `listing_id = :id` en `event_type in ('view','favorite','message')` per dag in client (geen nieuwe RPC nodig voor MVP).
- Slow-movers: `created_at < now() - 30d AND views < threshold` client-side filter.
- Voorraadwaarde: `SUM(price) WHERE user_id = me AND status = 'active'` via simpele query.
- Geen nieuwe secrets, geen nieuwe RLS-policies (alles user_id-scoped via bestaande policies).

## Open vraag
Akkoord met dit phased plan, of wil je dat ik in deze ene ronde alles direct af-bouw (groter risico, langere review)?

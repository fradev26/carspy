# Plan: filters & sortering op /zakelijk/leads

## Doel
Dealers kunnen hun leadslijst filteren op advertentie en datumbereik, en sorteren. Statusfilter bestaat al (tabs Alles/Nieuw/In behandeling/Afgehandeld) — die blijft.

## Wat verandert zichtbaar
- Boven de leadslijst komt naast de bestaande zoekbalk en statustabs een rij met:
  - **Advertentie**: dropdown met alle wagens waarop leads zijn binnengekomen (plus "Alle advertenties").
  - **Periode**: dropdown Alles / Vandaag / Laatste 7 dagen / Laatste 30 dagen.
  - **Sortering**: dropdown Nieuwste eerst (standaard) / Oudste eerst / Naam A→Z.
- Filters combineren met elkaar, met de zoekbalk en met de statustabs.
- Lege resultaten tonen de bestaande lege-staat ("geen leads gevonden").

## Technisch
- `src/components/dealer/leads/LeadFilters.tsx`
  - `LeadFiltersValue` uitbreiden met `listing: string` (advertentietitel, `""` = alles), `period: 'all'|'today'|'7d'|'30d'` en `sort: 'newest'|'oldest'|'name'`.
  - Twee `Select`-componenten toevoegen (Radix-patroon: waarde `'all'` mapt op `""`); een derde voor sortering. Advertentielijst komt als prop mee (unieke titels, alfabetisch).
- `src/pages/dealer/Leads.tsx`
  - State voor de drie nieuwe filters; `visible`-memo uitgebreid: advertentie-match, datumvergelijking op `lead.createdAt` (start van dag, lokale tijd), en sortering na filtering (sortering blijft client-side; lijsten zijn klein).
  - Unieke advertentietitels afleiden uit `all` via `useMemo`.
- Tests:
  - `useDealerLeads.test.ts`: pure filter/sort-helpers als die worden geëxtraheerd (anders paginatest).
  - `LeadDetail`-/leads-paginatests aanpassen waar state-shape verandert; nieuwe cases voor advertentiefilter, periodefilter en sortering.
- Verificatie: Vitest + typecheck, daarna korte Playwright-check als Snabba Cars (filter op Tesla-advertentie, periode 7 dagen, sorteer op naam).

## Buiten scope
- Geen datumbereik met vrije kalender (presets volstaan nu; kan later).
- Geen server-side filtering/paginering voor leads (huidige volumes zijn klein).

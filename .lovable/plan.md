## Doel

Account-hub vereenvoudigen: één ingang per bestemming. Geen redesign, alleen IA opschonen in `src/layouts/Header.tsx` (mobiele sheet + desktop dropdown).

## Wijzigingen — mobiele Account-sheet

**Mijn account** (4 items → 1)
- Verwijder: Profiel, Contactgegevens, Meldingen, Privacy
- Toevoegen: `Accountinstellingen` → `/account/instellingen` (icoon `Settings`)

**Mijn activiteiten** (ongewijzigd)
- Mijn advertenties → `/account/advertenties`
- Zoekalerts → `/account/zoekalerts`
- Recent bekeken → `/account/recent`

**Dealerfuncties** (4 items → 1, alleen dealers)
- Verwijder: Leads, Voorraadbeheer, Statistieken
- Behoud enkel: `Zakelijk Dashboard` → `/zakelijk`

**Juridisch / Support / Uitloggen** — ongewijzigd.

## Wijzigingen — desktop dropdown (`DropdownMenu`)

- Vervang afzonderlijke items Profiel + Meldingen door één `Accountinstellingen` → `/account/instellingen`.
- Behoud: Mijn advertenties, Zoekalerts, Recent bekeken, Zakelijk Dashboard (alleen dealers), Uitloggen.

## Wat NIET wijzigt

- Routes in `App.tsx`, alle pagina's, tabs binnen `AccountSettings` en `BusinessDashboard`, styling, branding, componenten, BottomNav, header-knoppen.
- Bestaande deep-link routes (`/account/profiel`, `/account/meldingen`, `/account/privacy`, `/zakelijk?tab=...`) blijven werken als directe URL — alleen niet meer aanwezig in de hub.

## Resultaat

Hub toont per sectie nog maar één link per product; geen meervoudige ingangen meer naar dezelfde pagina of dezelfde tab.

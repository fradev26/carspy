# Herontwerp Leads-dashboard → dagelijkse opvolgwerkplek

Van statische leadlijst naar actiegerichte werkplek voor verkopers, met behoud van de rustige, professionele uitstraling. Desktop-first, URL-gedreven (bestaand patroon blijft), realtime en infinite scroll blijven werken.

## 1. Datamodel (migratie)

Statussen zijn `text`-kolommen — uitbreiden kan zonder enum-migratie:

- **`dealer_leads` en `conversations` uitbreiden met:**
  - `follow_up_at timestamptz` — geplande opvolging/reminder
  - `snoozed_until timestamptz` — gesnoozet tot
  - `answered_at timestamptz` — eerste reactie van de dealer (voor "onbeantwoord")
  - `assigned_to uuid → company_members` — verantwoordelijke verkoper
- Statuswaarden uitbreiden met `waiting_customer` (Wachten op klant) en `scheduled` (Gepland); bestaande CHECK-constraints (indien aanwezig) verruimen.
- Beveiligde RPC's: `set_lead_follow_up`, `snooze_lead`, `assign_lead` (zelfde patroon als `set_conversation_status`), met audit-logging op de leaddetail-timeline.
- Index op `follow_up_at` voor de "Actie nodig"-weergave.

## 2. Leadmodel en logica (`useDealerLeads.ts`)

- `DealerLead` uitbreiden: `followUpAt`, `snoozedUntil`, `answeredAt`, `assignedTo` (+ naam), `source`, `isUnanswered`, `waitingDays`, `isSystemActivity`.
- **Onbeantwoord**: contactaanvraag zonder `answered_at`; gesprek waarvan het laatste bericht van de koper is.
- **Actie nodig** (berekende weergave): status `new` OF onbeantwoord OF `follow_up_at` vandaag/te laat — gesnoozete leads vallen eruit tot `snoozed_until` verstreken is.
- **Systeemactiviteiten**: gesprekken zonder berichten ("Nieuw gesprek gestart") krijgen `isSystemActivity=true` — aparte, ingetogen weergave, niet meegeteld in "Actie nodig".
- **Koopintentie (v1, heuristiek)**: score uit aanwezigheid telefoonnummer, intentiewoorden in bericht ("prijs", "testrit", "kopen", "financiering") en recentheid. Later vervangbaar door AI-score.
- **Land/regio (v1)**: afgeleid van telefoonprefix (+32 BE, +31 NL, …); zonder nummer = "Onbekend".

## 3. UI-opbouw (desktop-first)

```text
┌ Leads — kop + Link kopiëren ───────────────────────────┐
│ Prioriteitsbalk: [2 nieuwe leads] [1 wacht >24u]       │
│                  [3 opvolgingen vandaag]  (klikbaar)   │
│ Tabs: Actie nodig • In behandeling • Wachten op klant  │
│       • Gepland • Afgehandeld • Alles   (met tellers)  │
│ Zoekveld + filters: advertentie, periode, status,      │
│       verkoper, bron, land, [x] alleen onbeantwoord    │
│       + sortering                                      │
│ Leadkaarten (compact, scanbaar) … infinite scroll      │
└─────────────────────────────────────────────────────────┘
```

- **Standaard tab = "Actie nodig"** met teller en subtiele urgentie ("Wacht 2 dagen" in amber).
- **Prioriteitsbalk**: drie klikbare chips die elk een preset-filter activeren.
- **LeadKpiRow** wordt vervangen door de prioriteitsbalk (tellers zitten in de tabs).

### Leadkaart (herwerkt, consistente hiërarchie)

- Links: avatar met initialen, naam + bedrijfsnaam.
- Midden: **voertuig als prominente titel**, daaronder bericht (max. 2 regels).
- Rechts: statusbadge (dropdown), relatieve tijd + urgentie-indicator.
- E-mail/telefoon: compacte iconknoppen met tooltip; volledige gegevens in uitklapbaar deel.
- Snelle acties op élke lead: primair **Beantwoorden**, secundair bellen / e-mailen / inplannen (datumkiezer-popover), statusdropdown, snoozen.
- Systeemactiviteiten: grijze, compacte rij met systeem-icoon, geen actieknoppen.

### Statuskleuren (toegankelijk, via semantische tokens in index.css)

Nieuw = primary (rood, ingetogen badge-variant), Actie nodig/te laat = amber, In behandeling = blauw, Wachten op klant = grijs/paars, Gepland = paars, Afgehandeld = groen. Nieuwe tokens `--warning`, `--info`, `--scheduled` toevoegen aan het design system.

## 4. Filters, sortering en URL

- Nieuwe filters: verkoper (uit `company_members`), bron/kanaal (bericht / contactformulier / import), land, toggle "alleen onbeantwoord".
- Nieuwe sorteringen: Prioriteit, Langst onbeantwoord, Opvolging vandaag, Hoogste koopintentie (naast Nieuwste eerst).
- `leadsUrl.ts` uitbreiden; default tab `action`. Bestaande gedeelde links blijven geldig.

## 5. Kwaliteit

- Unit-tests: actie-nodig-logica, onbeantwoord-detectie, intentiescore, URL-parsing.
- Bestaande tests (`useDealerLeads.test.ts`, navigatie-E2E) bijwerken.
- Mockdata voor Snabba Cars aanvullen (opvolgingen, toewijzingen, uiteenlopende statussen — o.a. Tesla Model 3, BMW 320d Touring, Renault Kangoo) zodat alle tabs en de prioriteitsbalk direct demonstreerbaar zijn.
- aria-live aankondiging bij tab/filterwissel ("X leads in Actie nodig").

## Volgorde

1. Migratie + RPC's → 2. hook/logica + tests → 3. Leadkaart + acties → 4. tabs, prioriteitsbalk, filters → 5. mockdata + E2E-verificatie.

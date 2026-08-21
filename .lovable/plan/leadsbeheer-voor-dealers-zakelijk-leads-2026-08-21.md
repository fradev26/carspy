# Leadsbeheer voor dealers (/zakelijk/leads)

## Waarom de pagina leeg is

Twee bevestigde oorzaken:

1. De route `/zakelijk/leads` rendert `MyLeadsPanel` — een consumentencomponent dat de eigen verkoopstatus van een particulier toont (tabel `vehicle_leads`, gefilterd op de ingelogde gebruiker). Een dealer heeft daar geen rijen, dus het component geeft `null` terug.
2. Voor de dealerleads die er wél zijn (5 rijen op het account Snabba Cars in `dealer_leads`) bestaat alleen een leesregel voor admins. De dealer-eigenaar mag ze niet opvragen, dus zelfs een correcte query zou leeg blijven.

## Wat de pagina moet worden

Eén werklijst met alles waar een dealer vandaag op moet reageren, gerangschikt op urgentie in plaats van op databron. Drie leadtypes samengevoegd in één stroom:

- **Berichten** — kopers die een gesprek startten over een wagen in de voorraad (uit gesprekken/berichten).
- **Contactaanvragen** — formulier- en AI-aanvragen (`dealer_leads`).
- **Inkoopkansen** — particulieren die hun wagen aan dealers aanbieden (`vehicle_leads` met status "aangeboden aan dealers"), zodra dat aanbod bestaat.

### Indeling van boven naar beneden

```text
Leads                                     [Nieuw 3] [Deze week 7]
------------------------------------------------------------
KPI-rij: Nieuw · Opgevolgd · Gewonnen · Gem. reactietijd
------------------------------------------------------------
Tabs: Alles | Nieuw | Opgevolgd | Gewonnen | Verloren
Zoekveld + filter op type en periode
------------------------------------------------------------
Leadkaart
  Naam · badge type · "2 u geleden"
  Wagen waar het over gaat (foto + titel, indien gekoppeld)
  Eerste regel van het bericht
  [Bellen] [Mailen] [Antwoorden] [Status wijzigen]
------------------------------------------------------------
Lege staat per tab, met uitleg waar leads vandaan komen
```

### Klantgerichte keuzes

- Nieuwe leads staan bovenaan en zijn visueel gemarkeerd tot ze aangeraakt zijn.
- Contactknoppen (`tel:`, `mailto:`, antwoorden in berichten) staan direct op de kaart — geen detailpagina nodig voor de meest voorkomende actie.
- Statuswijziging is één klik met directe optimistische update; de statuslijst blijft nieuw → gecontacteerd → gewonnen/verloren.
- Elke lead toont waar hij vandaan komt en op welke wagen hij slaat, zodat opvolging zonder zoekwerk kan.
- Rolafhankelijk: alleen rollen met `canViewLeads` (eigenaar, manager, verkoper) zien de pagina; die gating bestaat al in de navigatie en wordt op de route herhaald.

## Technische uitvoering

1. **Databasetoegang**: migratie die `dealer_leads` koppelt aan de dealer die de lead ontvangt en leesrechten geeft aan de eigen dealer (naast de bestaande admin-regel), plus updaterecht op de statuskolom voor rollen met `can_view_leads`. Inclusief de vereiste `GRANT`-statements. Bestaande mockrijen blijven op Snabba Cars staan.
2. **Nieuwe pagina** `src/pages/dealer/Leads.tsx`, geregistreerd op `/zakelijk/leads` in plaats van `MyLeadsPanel`. `MyLeadsPanel` blijft ongewijzigd in gebruik op het particuliere dashboard.
3. **Nieuwe hook** `src/hooks/useDealerLeads.ts`: haalt contactaanvragen, gespreksleads en inkoopkansen op, normaliseert ze naar één leadmodel (`id`, `type`, `naam`, `contact`, `listing`, `snippet`, `status`, `created_at`) en sorteert op datum.
4. **Componenten** onder `src/components/dealer/leads/`: `LeadCard`, `LeadFilters`, `LeadKpiRow`, `LeadEmptyState`, in lijn met de bestaande dealer-UI (kaarten, badges, 12px radius, semantische tokens).
5. **Statusmutatie** via TanStack Query mutatie met optimistische update en toast bij fout.
6. **Tests**: unittest voor de normalisatie- en sorteerlogica plus een rendertest voor de lege staat en de statusfilters.

## Buiten scope

Geen e-mailautomatisering, geen leadscoring of AI-samenvattingen, geen export. Die kunnen later als aparte stap.

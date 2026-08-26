# Leaddetailpagina voor dealers

## Doel
Elke lead op `/zakelijk/leads` wordt aanklikbaar en opent een detailpagina `/zakelijk/leads/:id` met drie blokken: contactgegevens, voertuiginfo en een chronologische timeline van statuswijzigingen en berichten. Werkt voor beide leadtypes: contactaanvragen (`dealer_leads`) en berichtgesprekken (`conversations`, id-prefix `conv-`).

## Wat de gebruiker ziet
- **Terug-link** naar `/zakelijk/leads` en kop met naam, type-badge en dezelfde statusdropdown als op de lijst.
- **Contactgegevenskaart**: naam, bedrijf, e-mail (mailto), telefoon (tel:). Bij berichtleads: koper­naam + knop "Antwoorden" naar `/berichten`.
- **Voertuigkaart**: thumbnail, titel, merk/model/bouwjaar/prijs en link naar de advertentie (`/auto/:id`). Bij leads zonder wagen: duidelijke lege staat ("Geen voertuig gekoppeld").
- **Timeline** (nieuwste bovenaan): lead aangemaakt, statuswijzigingen (bv. "Nieuw → In behandeling"), en bij gespreksleads alle berichten met afzender en tijdstip.

## Technische aanpak

### 1. Migratie: statushistoriek vastleggen
- Nieuwe triggerfunctie `public._audit_lead_status_trg()` (security definer) die bij een statuswijziging op `dealer_leads` én `conversations` een rij schrijft in de bestaande `audit_logs` (categorie `leads`, actie `lead_status_changed`, metadata met oude/nieuwe status). Bestaande RLS op `audit_logs` (company members kunnen lezen) blijft zo de enige toegangspoort.
- Functie EXECUTE intrekken voor PUBLIC/anon/authenticated (zelfde patroon als `_dealer_leads_before_insert`).

### 2. Hook-uitbreidingen
- `useDealerLeads.ts`: `listing_id` mee selecteren voor contactaanvragen (kolom bestaat al, wordt nu genegeerd) zodat `listingId`/`listingTitle` ook voor dat type werken.
- Nieuwe hook `useLeadDetail(id)`: herkent `conv-`-prefix en haalt voor het juiste type op:
  - leadrecord (contactaanvraag of gesprek + koper­profiel),
  - voertuiggegevens uit `listings` (titel, merk, model, jaar, prijs, eerste afbeelding),
  - timeline-events: `audit_logs` waar `target_id` = lead-id (category `leads`), plus bij gesprekken alle `messages` van dat gesprek; samengevoegd en gesorteerd op tijd.

### 3. Nieuwe pagina en componenten
- `src/pages/dealer/LeadDetail.tsx` — route `leads/:id` onder `/zakelijk` in `App.tsx`.
- `src/components/dealer/leads/LeadTimeline.tsx` — tijdlijn met icoon per eventtype (status: badge-kleuren, bericht: tekstballon, aanmaak: vlag).
- `LeadCard.tsx`: naam en kaart worden een `Link` naar de detailpagina (statusdropdown blijft op de kaart werken, klik daarop opent de pagina niet).

### 4. Tests
- `useLeadDetail`-normalisatie en timeline-merge testen (vitest).
- Uitbreiding `navigation.e2e.test.tsx`: klik op leadkaart → detailpagina toont naam, voertuig en timeline.

### 5. Verificatie
- tsgo typecheck + volledige vitest-run.
- Playwright als Snabba Cars: lead openen, voertuigkaart en timeline zichtbaar, status wijzigen vanaf detailpagina verschijnt direct in de timeline.

## Niet in scope
- Notities of taken aan leads toevoegen.
- Wijzigen van contactgegevens.
- E-mailnotificaties bij statuswijziging.

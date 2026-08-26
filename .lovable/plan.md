# High finding: leads correct toewijzen en tonen

## Doel
Zorgen dat gemockte én echte dealergerichte leads zichtbaar zijn voor het juiste dealerbedrijf op `/zakelijk/leads`, zonder dat een aanvrager zelf `dealer_user_id` of `company_id` kan kiezen. Algemene aanvragen vanaf `/dealers` blijven in de interne VATUUR-inbox.

## Bevestigde huidige situatie
- De 5 bestaande Snabba Cars-mockleads hebben in de live database inmiddels zowel de juiste `dealer_user_id` als `company_id`.
- De actieve lees- en updatepolicy laat een lead toe voor de directe dealer-eigenaar of voor een bevoegd lid van hetzelfde bedrijf.
- De Leads-query en badge-query vertrouwen terecht op deze backend-afscherming en voegen geen onveilige clientfilter toe.
- De insert-trigger leidt eigendom al af uit `listing_id`, maar de publieke `dealer-lead`-functie verstuurt momenteel geen advertentiecontext. Zonder advertentiecontext blijft zo’n aanvraag bewust ongekoppeld.

## Uitvoering
1. **Datamapping structureel maken**
   - Behoud `listing_id` als enige bron van waarheid voor dealergerichte formulierleads.
   - Laat de backend-trigger `dealer_user_id` en `company_id` uitsluitend afleiden uit de eigenaar en het bedrijf van die advertentie.
   - Negeer of overschrijf eventueel meegestuurde eigenaar-/bedrijfs-ID’s, zodat een aanvrager nooit een lead aan een ander account kan koppelen.
   - Backfill alleen bestaande dealergerichte rijen die nog geen mapping hebben maar wel eenduidig aan een advertentie gekoppeld kunnen worden; algemene platformleads blijven ongekoppeld.

2. **Interne en dealergerichte aanvragen scheiden**
   - Houd aanvragen vanaf de publieke `/dealers`-pagina als interne VATUUR-leads; ze verschijnen niet in een dealeraccount.
   - Zorg dat toekomstige dealergerichte formulierflows altijd een geldige `listing_id` meesturen.
   - Behoud gesprekken als tweede echte leadbron via `conversations.seller_id`, zoals de Leads-pagina nu al doet.

3. **RLS en queries valideren**
   - Controleer dat een bevoegde Snabba Cars-gebruiker de 5 mockleads kan lezen en bijwerken.
   - Controleer dat een gebruiker van een ander bedrijf deze rijen niet kan lezen of wijzigen.
   - Controleer dat `/zakelijk/leads` en de headerbadge dezelfde afgeschermde dataset gebruiken en queryfouten zichtbaar/traceerbaar afhandelen.

4. **Regressietests toevoegen**
   - Test mapping vanaf een advertentie naar de juiste dealer en het juiste bedrijf.
   - Test dat vervalste `dealer_user_id`/`company_id` geen effect hebben.
   - Test dat een interne `/dealers`-aanvraag niet in een dealerinbox terechtkomt.
   - Test dat gemockte contactleads en gesprek-leads samen op de Leads-pagina verschijnen en dat alleen `status = new` meetelt voor de badge.

5. **End-to-end verificatie en finding afronden**
   - Open `/zakelijk/leads` met een echte Snabba Cars-sessie en verifieer kaarten, KPI’s en badge.
   - Werk één leadstatus bij en controleer de opgeslagen rij.
   - Herhaal de toegangscheck met een niet-bevoegde identiteit.
   - Los het Project monitoring finding pas op nadat deze controles slagen; als een dealersessie niet beschikbaar is, rapporteer ik de geauthenticeerde route expliciet als `UNVERIFIED`.

## Technische scope
- Waarschijnlijk betrokken: lead-inserttrigger/RLS-migratie, `dealer-lead`-functie voor duidelijke interne classificatie, leadhooks en gerichte tests.
- Geen visueel herontwerp van de Leads-pagina.
- Geen willekeurige koppeling van interne VATUUR-aanvragen aan Snabba Cars of een andere dealer.

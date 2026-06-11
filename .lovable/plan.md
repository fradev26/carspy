## Dealer kan vanuit Zakelijk Dashboard de verkoopwizard openen

### Probleem
De recente route guard in `Sell.tsx` stuurt élke dealer die `/verkopen` opent automatisch terug naar `/zakelijk`. Daardoor werkt de "Plaats advertentie"-knop op het Zakelijk Dashboard niet meer — de dealer komt nooit in de wizard.

### Oplossing
Sta toe dat een dealer de wizard opent wanneer hij dit expliciet doet vanuit het zakelijke dashboard, terwijl de standaardroute (bottom nav, header, directe URL) blijft redirecten naar `/zakelijk`.

### Aanpassingen

**1. `src/pages/BusinessDashboard.tsx`**
- Wijzig de "Plaats advertentie"-link (regel 420) van `/verkopen` naar `/verkopen?dealer=1`.

**2. `src/pages/Sell.tsx`**
- Lees `dealer` uit `searchParams`.
- Pas de redirect-guard aan: dealers worden alleen omgeleid naar `/zakelijk` als `searchParams.get('dealer') !== '1'`.
- Wanneer de param aanwezig is, mag de dealer de wizard volledig doorlopen.

### Technische details
- De query param fungeert als een expliciete intent-marker: alleen knoppen op het zakelijke dashboard zetten hem.
- Geen aanpassingen nodig aan bottom nav, header of footer — dealers worden daar nog altijd naar `/zakelijk` gestuurd.
- Bestaande draft/edit links (bv. `/verkopen?draftId=...`) blijven redirecten; als blijkt dat ook die nodig zijn voor dealers, kunnen we de check uitbreiden.

### Acceptatie
- [ ] Klik op "Plaats advertentie" op `/zakelijk` → wizard `/verkopen` opent en blijft staan.
- [ ] Direct `/verkopen` openen als dealer → nog steeds redirect naar `/zakelijk`.
- [ ] Particuliere gebruikers ongewijzigd.
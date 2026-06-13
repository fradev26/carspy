## Doel

Op dit moment accepteert het registratieformulier in `src/pages/Auth.tsx` enkel een Nederlands BTW-nummer (`NL123456789B01`). Belgische dealers kunnen dus niet registreren. We laten dealers vrij kiezen tussen een Belgisch (BE) of Nederlands (NL) ondernemingsnummer, met passende validatie per land.

## Wijzigingen

Enkel frontend, alleen `src/pages/Auth.tsx`:

1. **Land-selector toevoegen** in het zakelijk-blok (zichtbaar als "Ik registreer als bedrijf" aanstaat):
   - Een kleine `Select` (of toggle) met opties **België (BE)** en **Nederland (NL)**, default **BE** (passend bij `vatuur.be`).
   - Nieuwe state `vatCountry: 'BE' | 'NL'`.

2. **Validatie per land** (vervangt huidige `VAT_REGEX`):
   - BE: `^BE0\d{9}$` (BE + 10 cijfers, beginnend met 0). Voorbeeld: `BE0123456789`.
   - NL: `^NL\d{9}B\d{2}$`. Voorbeeld: `NL123456789B01`.
   - Bij invoer eerst spaties/punten strippen en uppercase maken. Als de gebruiker het land-prefix vergeet, automatisch prependen op basis van de geselecteerde `vatCountry` vóór validatie.

3. **UI-aanpassingen** in het BTW-veld:
   - Label blijft "BTW-nummer / Ondernemingsnummer".
   - Placeholder en helptekst volgen de gekozen `vatCountry`:
     - BE → placeholder `BE0123456789`, hint "Formaat: BE + 10 cijfers".
     - NL → placeholder `NL123456789B01`, hint "Formaat: NL + 9 cijfers + B + 2 cijfers".
   - Foutmelding-toast toont het verwachte formaat van het gekozen land.

4. **Doorgeven aan `signUp`**: het genormaliseerde nummer (met landprefix, uppercase, zonder spaties) wordt zoals nu via `dealerOptions.vatNumber` doorgestuurd. Geen wijziging aan `useAuth`, profielentabel of backend nodig — `profiles.vat_number` is een vrij tekstveld.

## Out of scope

- Geen externe VIES-validatie (zelfde aanpak als nu).
- Geen aanpassing aan `AccountSettings` (daar wordt het BTW-nummer momenteel niet getoond/bewerkt).
- Geen databasewijzigingen.

# Plan: BTW-toggle op de advertentie i.p.v. aparte Prijsinstellingen-pagina

## Doel

Een aparte "Prijsinstellingen"-pagina is overbodig. De enige relevante prijskeuze (BTW aftrekbaar / marge­regime) wordt per advertentie genomen. Daarom:

1. **Verwijderen**: de "Prijsinstellingen"-rij in `/zakelijk/instellingen` (stub die naar `soon` wijst).
2. **Toevoegen**: een duidelijke BTW-toggle in de prijs-stap van `/verkopen` én in de bewerkmodus van diezelfde wizard (`/verkopen?draftId=...`, die fungeert als advertentie-bewerken).

De database is al voorbereid: `listings.vat_deductible` (boolean) bestaat. Er hoeft niks aan de schema te veranderen.

## Wijzigingen

### 1. `src/pages/dealer/Settings.tsx`
- Verwijder de regel `<SettingsRow icon={Tag} label="Prijsinstellingen" onClick={soon} />`.
- Ruim ongebruikte `Tag`-import op indien die nergens anders gebruikt wordt.

### 2. `src/pages/Sell.tsx` (dekt zowel nieuw plaatsen als bewerken via `draftId`)
- Voeg veld toe aan `FormState`: `vatDeductible: 'yes' | 'no' | ''`.
- Voeg toe aan `EMPTY_FORM` met default `'no'` (marge­regime is gangbaarder bij occasions; particulieren laten 'no' staan, dealers met BTW-auto's kunnen togglen).
- **Hydrate bij bewerken**: vul uit `data.vat_deductible` in de bestaande `loadDraft`-effect (rond regel 196-236).
- **UI in de prijs-stap** (rond regel 915, naast Vraagprijs / Prijs bespreekbaar):
  - Compacte card met label "BTW", subtekst "Is de BTW aftrekbaar op deze wagen?" en een Switch.
  - States: `Aan = BTW aftrekbaar (21%)` / `Uit = Margeregime`.
  - Helper-tekst onder de toggle die de gekozen state in mensentaal toont, zoals de toon op andere stappen.
- **Payload-write** (rond regel 448-450 en eventueel een tweede insert/update plek): voeg `vat_deductible: formData.vatDeductible === 'yes'` toe.
- **Recap-sectie** (rond regel 1271): toon "BTW aftrekbaar: Ja/Nee" naast Vraagprijs.

### 3. Detailweergave
- Niet in scope: tonen op de publieke listing is al gedekt door bestaande UI (geen wijziging gevraagd).

## Veiligheid & account-scope
- Geen nieuwe tabellen, geen nieuwe RLS-regels. Bestaande policy op `listings` (`user_id = auth.uid()` voor update/insert) garandeert al dat een gebruiker enkel zijn eigen advertenties wijzigt.
- Bewerk-flow gebruikt al `.eq('id', draftId).eq('user_id', user.id)` — blijft ongewijzigd.

## Out of scope
- Geen globale dealer-default voor BTW (bewust: gebruiker koos voor per-advertentie toggle).
- Geen wijzigingen aan AI-prijssuggesties, marges, of weergaveregels.
- Geen migratie nodig.

## Acceptatie
- "Prijsinstellingen"-rij is weg uit Settings.
- In `/verkopen` (nieuw én `?draftId=...`) staat een BTW-toggle in de prijs-stap, default uit.
- Toggle-waarde wordt correct opgeslagen in `listings.vat_deductible` en correct terug ingeladen bij bewerken.
- Recap toont de gekozen waarde.

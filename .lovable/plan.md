# Navigatieherstructurering: Instellingen-hub + bottom nav

## Doel
- Eén volwaardige Instellingen-pagina (zowel particulier als dealer) die alle eerder versnipperde items toont.
- Sheet-sidebar in de Header opschonen — geen dubbele navigatie meer.
- Bottom nav: laatste slot wordt overal Favorieten.

## 1. Bottom nav — `src/components/BottomNav.tsx`
- Consumer: blijft `[Home · Zoeken · AI · Favorieten · Verkopen]` (ongewijzigd).
- Dealer: was `[Home · Zoeken · AI · Voorraad · Instellingen]` → wordt **`[Home · Zoeken · AI · Voorraad · Favorieten]`** (Heart-icoon, `/favorieten`).

## 2. Mobile sheet sidebar — `src/layouts/Header.tsx`
Volledige nav binnen het `<SheetContent>` herwerken. Behouden secties: **Mijn account**, **Juridisch**, **Support**. Verwijderd: **Mijn activiteiten** en **Dealerfuncties** (die navigatie verhuist naar de Instellingen-hub).

Nieuwe inhoud van "Mijn account":
- `Accountinstellingen` → `/account/instellingen` (bestaand, profiel/meldingen/privacy/weergave)
- `Instellingen` → `/zakelijk/instellingen` voor dealers, `/account/instellingen` voor particulieren

Dealers krijgen dus de hub aangeboden, particulieren landen op de bestaande tabs-pagina (die we hieronder uitbreiden).

## 3. Dealer-instellingenhub — `src/pages/dealer/Settings.tsx`
Bovenaan de bestaande secties twee nieuwe `Section` blokken invoegen (zelfde `SettingsRow`-component):

- **Mijn activiteiten**
  - `Megaphone` Mijn advertenties → `/account/advertenties`
  - `Bell` Zoekalerts → `/account/zoekalerts`
  - `Clock` Recent bekeken → `/account/recent`
  - `Heart` Favorieten → `/favorieten` (met trailing teller indien beschikbaar via `useFavorites`)
- **Dealerfuncties** (alleen render voor `isDealer`)
  - `Briefcase` Zakelijk Dashboard → `/zakelijk`
  - `BarChart3` Analytics → `/zakelijk/analytics`
  - `Megaphone` Leads → `/zakelijk/leads`

Bestaande secties (Koppelingen, Voorraad, Account, Ondersteuning) blijven onder de nieuwe twee.

## 4. Particuliere instellingenpagina — `src/pages/account/AccountSettings.tsx`
Boven de bestaande `Tabs` één nieuw blok "Mijn activiteiten" toevoegen — compacte kaarten-rij met dezelfde 4 quick-links als bij de dealer (Mijn advertenties, Zoekalerts, Recent bekeken, Favorieten). Geen wijziging aan de tabs zelf. Zo verliest een particulier geen navigatie nu "Mijn activiteiten" uit de sheet verdwijnt.

## Routes
Geen nieuwe routes nodig — alle bestemmingen bestaan al in `src/App.tsx`.

## Niet in scope
- Desktop-header dropdown (`Account`) — behoudt huidige items; deze plan-iteratie focust op mobiele bottom nav + sheet.
- Visueel herontwerp van de Instellingen-rows; we hergebruiken de bestaande `SettingsRow` en `Section`-componenten.
- Splitsing per rol op consumer-pagina — particulier ziet eenvoudig de tabs + activiteitenblok.

## Bestanden
- `src/components/BottomNav.tsx`
- `src/layouts/Header.tsx`
- `src/pages/dealer/Settings.tsx`
- `src/pages/account/AccountSettings.tsx`



# Zakelijk Dashboard met Bedrijfsregistratie en AI Prijsanalyse

## Overzicht
Dit plan voegt een volledige zakelijke laag toe aan AutoSpy: bedrijven kunnen zich registreren met bedrijfsnaam en BTW-nummer, krijgen automatisch toegang tot een uitgebreid zakelijk dashboard, en kunnen AI-prijsanalyses uitvoeren op hun voorraad.

---

## 1. Database-uitbreiding: Bedrijfsgegevens op profiel

De bestaande `profiles`-tabel wordt uitgebreid met zakelijke velden:

```text
profiles tabel - nieuwe kolommen:
+------------------+----------+-----------+
| Kolom            | Type     | Nullable  |
+------------------+----------+-----------+
| vat_number       | text     | Ja        |
| company_website  | text     | Ja        |
+------------------+----------+-----------+
```

Het bestaande `is_dealer`-veld en `dealer_name`-veld worden hergebruikt. Wanneer een gebruiker zich registreert met bedrijfsnaam + BTW-nummer, wordt `is_dealer = true` gezet.

---

## 2. Registratieformulier uitbreiden (Auth.tsx)

Het registratieformulier krijgt een toggle "Ik registreer als bedrijf" die extra velden toont:

- **Bedrijfsnaam** (verplicht bij zakelijke registratie)
- **BTW-nummer** (verplicht, met NL-formaat validatie: `NL + 9 cijfers + B + 2 cijfers`)

Bij registratie worden deze velden opgeslagen in `user_metadata` en via de bestaande trigger `handle_new_user` naar het profiel geschreven. De trigger wordt aangepast om de nieuwe velden te verwerken.

---

## 3. Zakelijk Dashboard (nieuwe pagina)

Een nieuwe route `/zakelijk` die alleen zichtbaar is voor dealers (`is_dealer = true`). Dit dashboard vervangt de huidige `/dealer-analytics` route en biedt:

### 3a. Overzichtspaneel
- Totaal actieve advertenties, views, favorieten, berichten
- Omzet-indicator (som van verkochte auto's)
- Gemiddelde tijd-tot-verkoop

### 3b. Voorraadoverzicht met acties
- Tabel met alle listings + status, views, favorieten, conversieratio
- Bulk-acties: meerdere listings tegelijk Premium maken of boosten
- Quick-edit prijs direct vanuit de tabel
- Status wijzigen (actief/gereserveerd/verkocht)

### 3c. AI Prijsanalyse per wagentype
- Nieuwe knop "AI Marktanalyse" per listing in het dashboard
- Hergebruikt de bestaande `price-analysis` edge function
- Toont: marktpositie, aanbevolen prijsrange, onderhandelingstips
- Nieuw: mogelijkheid om analyse te doen voor een wagentype dat nog niet in voorraad zit (merk + model + bouwjaar + km-stand invoeren, AI geeft marktinschatting)

### 3d. Prestatiemetrieken
- Grafiek: views/favorieten/berichten per week (tijdlijn)
- Top-performers: welke advertenties het best presteren
- Conversieratio vergelijking tussen listings

---

## 4. Navigatie-aanpassingen

- Header: "Dealer Analytics" in het dropdown-menu wordt **conditioneel** -- alleen zichtbaar als `is_dealer = true`
- Dashboard-pagina (`/dashboard`): toont een banner/link naar het zakelijk dashboard als de gebruiker dealer is
- Nieuwe route `/zakelijk` wordt beveiligd met `ProtectedRoute` + dealer-check

---

## 5. AI Prijsanalyse voor losse wagentypes

Een nieuw onderdeel op het zakelijke dashboard: "Marktverkenner". De dealer vult in:
- Merk, model, bouwjaar, kilometerstand, brandstof
- De bestaande `price-analysis` edge function wordt aangeroepen met synthetische data
- Resultaat: geschatte marktprijs, prijsrange, en tips

Dit hergebruikt de bestaande edge function zonder wijzigingen aan de backend.

---

## Technische details

### Bestanden die worden aangepast:
1. **Database migratie** -- `vat_number` en `company_website` toevoegen aan `profiles`, trigger `handle_new_user` uitbreiden
2. **`src/pages/Auth.tsx`** -- Toggle voor zakelijke registratie, extra velden, validatie
3. **`src/hooks/useAuth.tsx`** -- `signUp` uitbreiden met dealer-velden in `user_metadata`
4. **`src/pages/DealerDashboard.tsx`** -- Uitbreiden met nieuwe secties (bulk-acties, quick-edit, AI analyse, marktverkenner)
5. **`src/layouts/Header.tsx`** -- Conditioneel "Zakelijk Dashboard" tonen op basis van profiel
6. **`src/pages/Dashboard.tsx`** -- Banner naar zakelijk dashboard voor dealers
7. **`src/App.tsx`** -- Route `/zakelijk` toevoegen (of `/dealer-analytics` hernoemen)

### Bestanden die worden aangemaakt:
- **`src/hooks/useProfile.ts`** -- Hook om profieldata (inclusief `is_dealer`) op te halen en te cachen

### Geen wijzigingen nodig aan:
- Edge functions (bestaande `price-analysis` en `dealer-analytics` worden hergebruikt)
- Supabase RLS policies (bestaande policies dekken dit al)

### Volgorde van implementatie:
1. Database migratie (nieuwe kolommen + trigger-update)
2. useProfile hook
3. Auth.tsx registratieformulier
4. DealerDashboard.tsx uitbreiden
5. Header + Dashboard + routing aanpassen


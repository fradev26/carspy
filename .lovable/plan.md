# Opschonen dubbele dealer-navigatie

## Bevindingen

Bij het doorlopen van `BottomNav.tsx`, `DealerSidebar.tsx` en `DealerLayout.tsx` zie ik vier dubbelingen die dealers in de war brengen:

1. **Twee keer "Instellingen" met verschillende bestemmingen**
   In het mobiele "Meer"-sheet staan zowel:
   - `Integraties` → `/zakelijk/instellingen`
   - `Instellingen` → `/account/instellingen` (consumer-account)
   
   Dezelfde pagina (`/zakelijk/instellingen`) wordt bovendien al via de sidebar bereikt onder de naam "Instellingen". Drie namen, twee bestemmingen, één pagina.

2. **Verkopen-tab = Voertuig toevoegen (3 plaatsen)**
   - Bottom-nav tab "Verkopen" → `/verkopen?dealer=1`
   - Sidebar-footer "Voertuig toevoegen" → `/verkopen?dealer=1`
   - Header-CTA "Voertuig toevoegen" → `/verkopen?dealer=1`
   
   Drie verschillende labels voor exact dezelfde actie.

3. **Import op 3 plekken met 3 labels**
   - Sidebar: "Import & Sync" (Upload-icoon)
   - Header: "Import CSV" (Upload-icoon)
   - Meer-sheet: "Import (CSV)" (FileSpreadsheet-icoon)

4. **AutoScout-knop in header verwijst naar Instellingen**
   De header-knop "AutoScout" opent gewoon `/zakelijk/instellingen`. Dat overlapt met Sidebar→Instellingen én met Meer→Integraties.

5. **Favorieten in dealer Meer-sheet**
   Consumer-concept dat in de dealer-flow weinig betekenis heeft (heart-acties zitten al op cards).

## Voorgestelde opschoning

### Bottom-nav `moreLinks` (mobiel dealer "Meer"-sheet)
Wordt bewust kort en exact gelijk aan de desktop-sidebar:

```
Analytics       → /zakelijk/analytics
Import & Sync   → /zakelijk/import
Leads           → /zakelijk/leads
Instellingen    → /zakelijk/instellingen
```

Verwijderen:
- `Integraties` (= zelfde pagina als Instellingen)
- `Instellingen → /account/instellingen` (consumer-pad; account-bewerking blijft bereikbaar via profielmenu in header — niet via dealer-nav)
- `Favorieten` (geen dealer-actie)
- `Import (CSV)` als aparte entry — vervangen door één "Import & Sync" zodat label/iconen overal kloppen

### Dealer bottom-tab "Verkopen" → hernoemen naar **"Toevoegen"**
Label sluit aan op de actie (1 voertuig erbij zetten), niet op consumer-"Verkopen". URL blijft `/verkopen?dealer=1`. Icoon `Plus` ipv `Upload` (Upload reserveren we voor Import).

### DealerLayout-header opschonen
- Header-knop **"AutoScout"** verwijderen (zit al onder Instellingen).
- Header-knop **"Import CSV"** verwijderen (zit in sidebar als "Import & Sync"; op mobiel via Meer-sheet).
- Behouden: **"Voertuig toevoegen"** primary CTA. Sidebar-footer mag dan ook weg om dubbele primaire CTA te voorkomen — sidebar wordt puur navigatie.

### Naamgeving uniform
- Eén pagina = één naam: `/zakelijk/instellingen` heet overal **Instellingen**.
- Eén pagina = één naam: `/zakelijk/import` heet overal **Import & Sync**.
- Toevoegen-flow heet overal **Voertuig toevoegen** (header-CTA), behalve in de bottom-tab waar ruimte beperkt is → daar **Toevoegen**.

## Technische wijzigingen

| Bestand | Wijziging |
|---|---|
| `src/components/BottomNav.tsx` | `moreLinks` reduceren tot Analytics, Import & Sync, Leads, Instellingen. Dealer-tab "Verkopen" hernoemen naar "Toevoegen" met `Plus`-icoon. Imports `User`, `Link2`, `FileSpreadsheet`, `Heart`, `Settings` weghalen waar niet meer nodig. |
| `src/layouts/DealerLayout.tsx` | "Import CSV"- en "AutoScout"-knoppen uit header verwijderen. |
| `src/components/dealer/DealerSidebar.tsx` | Sidebar-footer "Voertuig toevoegen" verwijderen (header-CTA blijft de enige primary). |

## Buiten scope
- Geen routewijzigingen, geen pagina-merges, geen RLS/backend.
- Profielmenu / account-instellingen voor dealers blijft bereikbaar via bestaande header/avatar-flows; geen nieuwe entry-points.

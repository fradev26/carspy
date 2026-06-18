# Plan — Meerdere wagens sneller boosten

## Huidige werking (kort)
1. Op `/zakelijk/voorraad` moet je per kaart een checkbox aanvinken.
2. Sticky balk verschijnt → klik **Boost** → `BoostDialog` opent met `bulkListingIds`.
3. Dialog toont enkel een aantal ("X wagens worden geboost") en een pakketkeuze (Turbo/Nitro).
4. Bij **Activeren** worden RPC-calls sequentieel afgevuurd; geen voortgang, geen overzicht van welke wagens.

## Pijnpunten
- Selectie is traag: geen "Alles selecteren", geen shift-klik bereik, geen filter "boostbaar".
- Quota-impact is pas zichtbaar na pakketkeuze; geen kostentotaal vooraf per wagen.
- Dialog verbergt welke wagens meegaan → geen laatste check, geen deselect.
- Sequentiële calls voelen traag bij 10+ wagens; bij fout in één call stopt de feedback niet duidelijk.
- Geen quick-action "boost alle verlopende deze week".

## Doel
Van 3+ taps per wagen naar **2 taps voor de hele lijst**: één klik om te selecteren, één om te activeren — met volledige transparantie over kost en quota.

## Wijzigingen

### 1. Selectie sneller maken (`Inventory.tsx`)
- **"Alles selecteren"-checkbox** in de bulk-balk én bovenaan de grid (selecteert alle `filtered`).
- **Shift-klik** op een kaart-checkbox = selecteer bereik tussen vorige en huidige.
- Nieuwe statuschip **"Boostbaar"** = `status='active' AND (boost_until IS NULL OR boost_until < now())`. Combineert met de bestaande filters.
- Snelfilter-knop **"Selecteer boostbare"** in de balk → vult selectie met alle zichtbare boostbare wagens.

### 2. BoostDialog herwerken
- **Lijst met thumbnails** van alle `targets` (titel + prijs + huidige boost-status). Elk item heeft een kruisje om te deselecteren binnen de dialog.
- **Live kostensamenvatting** bovenaan, herberekent bij elke pakket-/selectiewijziging:
  ```
  12 wagens · Turbo (7 d)
  → 4 uit abonnement (gratis)
  → 8 × €X = €Y extra deze maand
  ```
- Pakketkeuze blijft Turbo/Nitro, maar het pakket dat de meeste gratis quota benut wordt **standaard voorgesteld** met badge "Beste keuze".

### 3. Activeren versnellen
- RPC-calls in **parallel** via `Promise.allSettled` (cap 6 tegelijk) i.p.v. seq for-loop.
- **Inline voortgangsbalk** (`x/n geboost`) terwijl het loopt; dialog blijft open.
- Resultaat-samenvatting in dezelfde dialog: ✓ geslaagd, ✗ mislukt (per wagen, met retry-knop voor de mislukte).

### 4. Quick-acties op de pagina
- Bulk-balk krijgt extra knop **"Verleng & boost"** voor selectie met verlopen status: zet status terug op `active` en boost in één RPC-keten.
- Lege state in tabblad "Verkocht" → suggereert niet boosten (al afgedekt door eerdere "Terug te koop"-flow).

## Technische details
- Bestanden: `src/pages/dealer/Inventory.tsx`, `src/components/boost/BoostDialog.tsx`.
- Geen DB-migratie nodig: `activate_boost` RPC blijft per-listing; parallellisme zit volledig in de client.
- Shift-klik vereist het bijhouden van `lastSelectedId` in `Inventory`.
- "Boostbaar" filter draait op bestaande velden (`status`, `boost_until`) uit `useDealerAnalytics`; eventueel veld `boostUntil` toevoegen aan dat hook-type als het er nog niet zit.
- Parallel cap via een kleine helper (bv. 6-wide queue) om Supabase rate-limits te respecteren.
- Toasts vervangen door één samenvattende toast na afloop i.p.v. één per wagen.

## Out of scope
- Wijzigingen aan `activate_boost` of nieuwe pakketten.
- Geplande/uitgestelde boosts (cron).
- Boost-acties vanuit `/account/advertenties` voor particulieren.

# Berichten-icoon direct naar gecombineerde leads/berichten-pagina

## Doel
Het berichten-icoon in de header linkt voor dealers rechtstreeks naar de bestaande gecombineerde leads/berichten-pagina (`/zakelijk/leads`), in plaats van een dropdown te tonen waarin de gebruiker moet kiezen.

## Huidige situatie
- Mobiel: dealers met `canViewLeads` zien een dropdown met twee items: "Berichten" en "Leads".
- Desktop: dealers zien het berichten-icoon altijd naar `/berichten` linken.
- De pagina `/zakelijk/leads` toont al een unified feed van `dealer_leads` en `conversations`.

## Gewenste situatie
- Voor ingelogde dealers met `canViewLeads`: het berichten-icoon linkt direct naar `/zakelijk/leads` (mobiel én desktop).
- Voor alle andere gebruikers: het icoon blijft linken naar `/berichten`.
- De badge blijft het totaal van ongelezen berichten + nieuwe leads tonen.
- Aria-labels worden aangepast naar "Leads en berichten".

## Technische aanpak
1. **`src/layouts/Header.tsx`**
   - Verwijder de `DropdownMenu` rond het berichten-icoon op mobiel voor dealers.
   - Gebruik één `Button`/`Link` die navigeert naar `/zakelijk/leads` wanneer `showLeadsInbox` waar is, anders naar `/berichten`.
   - Pas het desktop berichten-icoon aan zodat het voor dealers naar `/zakelijk/leads` linkt.
   - Werk aria-labels bij: "Leads en berichten" + eventuele badge-aantallen.
   - Verwijder ongebruikte imports (`Users`, `DropdownMenu*` indien elders niet meer gebruikt).

2. **Badge en telling**
   - Behoud `inboxCount = unreadCount + newLeadsCount`.
   - `useNewLeadsCount` en `useUnreadMessages` blijven onveranderd.

3. **Navigatieconfiguratie**
   - Geen wijzigingen in `src/config/navigation.ts` nodig.

4. **Routes en rechten**
   - Geen backend/RLS-wijzigingen nodig; `/zakelijk/leads` is al beschermd via `Can` en bestaande policies.

5. **Verificatie**
   - Controleer in preview dat het icoon voor een dealer direct naar `/zakelijk/leads` navigeert.
   - Controleer dat particulieren en dealers zonder leads-rechten nog steeds naar `/berichten` gaan.
   - Controleer dat de badge correct beide aantallen toont.

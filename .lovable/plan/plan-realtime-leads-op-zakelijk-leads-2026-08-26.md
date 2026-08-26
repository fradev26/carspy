# Plan: realtime leads op /zakelijk/leads

## Doel
Nieuwe of gewijzigde leads verschijnen automatisch in de leadslijst en in de badge bij het berichtenicoon, zonder dat de dealer moet verversen.

## Huidige situatie (geverifieerd)
- Alleen `messages` staat in de realtime-publicatie; `dealer_leads` en `conversations` niet.
- `useDealerLeads` haalt data enkel op bij mount/refetch (staleTime 15s), dus een nieuwe contactaanvraag of een nieuw gesprek verschijnt pas na een handmatige refresh.
- Het bestaande realtime-patroon in de app (`useUnreadMessages`) abonneert in een `useEffect` en ruimt het kanaal op bij unmount — datzelfde patroon volgen we.

## Wat verandert zichtbaar
- Een binnenkomende contactaanvraag of een nieuw koperbericht laat de leadskaart meteen in de lijst verschijnen, met de juiste KPI-tellers en statustabs.
- Statuswijzigingen door een collega in hetzelfde bedrijf worden ook direct zichtbaar.
- De teller op het berichten/leads-icoon in de header telt mee zonder refresh.
- Actieve filters en sortering blijven behouden bij een live update (de lijst wordt opnieuw gefilterd, niet gereset).

## Technisch
- **Migratie**: `dealer_leads` en `conversations` toevoegen aan `supabase_realtime`, en op beide `REPLICA IDENTITY FULL` zetten zodat updates volledige rijen meesturen. Bestaande RLS blijft ongewijzigd; Realtime respecteert die policies, dus een dealer krijgt enkel events voor eigen leads/gesprekken.
- **Nieuwe hook** `src/hooks/useDealerLeadsRealtime.ts`: één kanaal per gebruiker dat luistert op `dealer_leads`, `conversations` en `messages` (insert/update) en bij een event de queries `['dealer-leads']` en de leadcount-query invalideert via `queryClient.invalidateQueries`. Invalidatie in plaats van lokale state-mutatie houdt de normalisatielogica op één plek. Events worden kort gedebounced (~300 ms) zodat een burst niet meerdere refetches veroorzaakt.
- **Gebruik**: hook aanroepen in `src/pages/dealer/Leads.tsx` en in `src/hooks/useNewLeadsCount.ts` (of centraal in de dealerlayout) zodat de badge ook live meeloopt.
- **Opruimen**: `supabase.removeChannel` in de cleanup van de `useEffect`, kanaal enkel opgezet wanneer er een ingelogde gebruiker is — zo geen abonnementslek of reconnect-lus.
- **Tests**: unittest voor de debounce/invalidatie-logica met een gemockt Supabase-kanaal; bestaande leadstests blijven draaien.
- **Verificatie**: Playwright als Snabba Cars — leadspagina open houden, een nieuwe `dealer_leads`-rij invoegen en controleren dat de kaart en de KPI-teller vanzelf bijwerken.

## Buiten scope
- Geen browser-/pushnotificaties bij een nieuwe lead.
- Geen realtime op andere dealerpagina's (voorraad, analytics).

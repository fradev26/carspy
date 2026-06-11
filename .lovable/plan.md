## Dealer "Verkopen"-route herleiden naar Zakelijk Dashboard

### Doel
Wanneer een gebruiker is ingelogd als garagebedrijf (dealer), moet de "Verkopen"-knop in de bottom navigation en de desktop header rechtstreeks naar `/zakelijk` verwijzen in plaats van de particuliere verkoopflow (`/verkopen`). Garagegebruikers mogen nooit onbedoeld in de particuliere sell-flow terechtkomen.

### Aanpassingen

#### 1. BottomNav.tsx
- Importeer `useProfile`.
- Haal `isDealer` op uit `useProfile`.
- Voor het "Verkopen"-item: als `user` EN `isDealer`, gebruik `/zakelijk` als pad (i.p.v. `/verkopen`).
- Behoud huidige `authPath: '/auth'` voor niet-ingelogde gebruikers.

#### 2. Header.tsx
- Desktop header: in de ingelogde sectie, link de "Auto verkopen"-knop naar `/zakelijk` wanneer `isDealer` waar is.
- Voor niet-ingelogde gebruikers en particuliere gebruikers blijft de link `/verkopen`.

#### 3. Sell.tsx (route guard)
- Voeg een `useEffect` toe die bij mount controleert of de ingelogde gebruiker een dealer is.
- Als `isDealer`, redirect onmiddellijk naar `/zakelijk` via `navigate('/zakelijk', { replace: true })`.
- Dit voorkomt dat een dealer de particuliere sell-flow opent, zelfs via een directe URL of bookmark.

### Technische details
- Geen extra dependencies nodig.
- `useProfile` levert `isDealer` op basis van `profiles.is_dealer`.
- De redirect in `Sell.tsx` gebeurt alleen als `user` en `isDealer` beide waar zijn, om oneindige loops te voorkomen.

### Acceptatiecriteria
- [ ] Ingelogde dealer ziet "Verkopen" in bottom nav en klikt door naar `/zakelijk`.
- [ ] Ingelogde particuliere gebruiker blijft naar `/verkopen` gaan.
- [ ] Niet-ingelogde gebruiker blijft naar `/auth` gaan bij klik op "Verkopen".
- [ ] Direct bezoek aan `/verkopen` als dealer redirect automatisch naar `/zakelijk`.
- [ ] Actieve navigatiestatus (kleur, indicator) blijft correct werken op mobiel.
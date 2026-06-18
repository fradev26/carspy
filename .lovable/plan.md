## Verwijderen "VATUUR. Zakelijk" header

De getoonde balk komt uit `src/layouts/DealerLayout.tsx` — de `<header>` met het "VATUUR. Zakelijk" logo en de dealer-naam. Deze layout wordt gebruikt door alle `/zakelijk` routes inclusief `/zakelijk/voorraad`.

### Wijziging
In `src/layouts/DealerLayout.tsx`:
- Verwijder het volledige `<header>`-blok (logo-link + dealer-naam regel).
- Verwijder de bijbehorende desktop `<nav>` met tabs (SalesAI / Voorraad / Import / Leads / Analytics / Instellingen) — die zat in dezelfde sticky header.
- Ruim ongebruikte imports op (`Link`, `NavLink`, `cn`, tab-icons, `useProfile`).
- Behoud `<Outlet />` en de mobile sticky "Auto verkopen" CTA.

### Buiten scope
- Geen wijzigingen aan de algemene site-header (`Header.tsx`) of bottom nav.
- Geen routewijzigingen; de tabs zijn nog steeds bereikbaar via de bestaande bottom-nav / directe URLs. Laat me weten als je ook een vervangende dealer-navigatie wil.

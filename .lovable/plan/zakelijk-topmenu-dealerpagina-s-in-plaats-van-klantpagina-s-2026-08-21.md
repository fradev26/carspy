# Zakelijk topmenu: dealerpagina's in plaats van klantpagina's

## Doel
Op desktop ziet een ingelogde dealer in het topmenu de zakelijke werkruimte (Sales AI, Voorraad, Import, Leads, Analytics) in plaats van de consumentenlinks (Home, Zoeken, AI, Voorraad, Favorieten).

## Wat er verandert

Nieuwe dealer-navigatieset in het topmenu:

| Item | Route | Zichtbaar voor |
|---|---|---|
| Sales AI | /zakelijk | alle leden |
| Voorraad | /zakelijk/voorraad | alle leden |
| Import | /zakelijk/import | rollen die advertenties mogen bewerken |
| Leads | /zakelijk/leads | rollen met leads-toegang |
| Analytics | /zakelijk/analytics | alle leden |

- Sales AI blijft de opvallende AI-knop (rood, Sparkles).
- Instellingen, Gebruikers en Abonnement blijven in het Account-dropdownmenu rechts (niet in de hoofdbalk, om de balk kort te houden). Daar komt ook "Naar de marktplaats" (/zoeken) bij, zodat een dealer nog steeds bij de publieke kant kan.
- Niet-dealers en uitgelogde bezoekers houden exact het huidige consumentenmenu.
- De mobiele bottom nav blijft ongewijzigd (die is al dealer-aware); alleen de desktopbalk verandert.

## Technische aanpak
- `src/config/navigation.ts`: `dealerNavItems` vervangen door de zakelijke set hierboven; per item een optionele `requires`-capability (`canEditListings`, `canViewLeads`) toevoegen aan het `NavItem`-type.
- `src/components/DesktopNav.tsx`: items filteren op `usePermissions()` wanneer `requires` gezet is; bestaande actief/transparant-styling blijft.
- `src/components/BottomNav.tsx`: `dealerNavItems` wordt hergebruikt, dus daar een eigen compacte mobiele dealerset (`dealerMobileNavItems`) houden zodat de mobiele balk maximaal 5 items houdt en niet verandert.
- `src/layouts/Header.tsx`: aan het Account-dropdown "Naar de marktplaats" toevoegen voor dealers.
- Actief-state werkt via de bestaande `isNavItemActive`; `/zakelijk` mag alleen exact matchen, anders licht Sales AI op bij elke subroute — kleine aanpassing met een `exact`-vlag op dat item.

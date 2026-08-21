# Mobiele bottomnav voor dealers + leads bij het berichtenicoon

## Doel
Een ingelogde dealer krijgt op mobiel een bottomnav die volledig op de zakelijke werkruimte is afgestemd, en bereikt leads via het icoon rechtsboven in de header.

## Wat er verandert

### Bottomnav (alleen dealers, mobiel)
| Positie | Item | Route |
|---|---|---|
| 1 | Zoeken | /zoeken |
| 2 | Voorraad | /zakelijk/voorraad |
| 3 | Sales AI (centrale rode knop) | /zakelijk (exact) |
| 4 | Favorieten | /favorieten |
| 5 | Analytics | /zakelijk/analytics |

- "Home" verdwijnt uit de dealer-bottomnav; het logo in de header blijft naar de homepage linken.
- Consumenten (en uitgelogde bezoekers) houden exact de huidige bottomnav.

### Berichtenknop rechtsboven wordt een gecombineerde inbox-knop
- Voor dealers met leads-toegang wordt de knop een dropdown met twee items: "Berichten" (/berichten) en "Leads" (/zakelijk/leads).
- De badge telt dan ongelezen berichten plus nieuwe leads; het aria-label benoemt beide.
- Voor niet-dealers (en dealers zonder leads-rechten) blijft de knop precies zoals nu: één tik naar /berichten.

## Technische aanpak
- `src/config/navigation.ts`: `dealerMobileNavItems` herschrijven naar de vijf items hierboven (Sales AI houdt `isAI: true` en `exact: true`).
- `src/layouts/Header.tsx`: de mobiele icoonknop rechtsboven omwikkelen met een dropdown wanneer `isDealer && canViewLeads` (via `usePermissions()`); anders het bestaande directe-navigatiegedrag behouden.
- Nieuw telnummer voor leads: hergebruik van `useDealerLeads` is te zwaar voor de header, dus een lichte teller (count-query op nieuwe leads) in een klein hook-bestand `src/hooks/useNewLeadsCount.ts`; badge = berichten + leads.
- Geen backend- of RLS-wijzigingen nodig; de bestaande leads-policies dekken de telling.

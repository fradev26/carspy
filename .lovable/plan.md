# Import uit de topbalk naar de voorraadpagina

## Doel
"Import" verdwijnt uit het dealer-topmenu en komt terug als knop in de header van /zakelijk/voorraad. Is AutoScout24 al gekoppeld, dan toont die knop "Sync" met een sync-icoon.

## Wat er verandert

- Topbalk (desktop) voor dealers: Sales AI, Voorraad, Leads, Analytics. Import-item verdwijnt; de route /zakelijk/import blijft gewoon bestaan.
- Voorraadpagina-header krijgt naast "Voorkeuren" een extra knop:
  - Geen AutoScout-koppeling: "Importeren" met upload-icoon, linkt naar /zakelijk/import.
  - Wel gekoppeld: "Sync" met refresh-icoon, linkt naar /zakelijk/import#autoscout.
- Zichtbaar voor rollen die advertenties mogen bewerken (zelfde regel als het oude menu-item); anders geen knop.

## Technische aanpak
- `src/config/navigation.ts`: Import-item uit `dealerNavItems` halen.
- Nieuwe kleine hook `src/hooks/useAutoScoutLink.ts`: leest één rij uit `autoscout_credentials` voor de ingelogde gebruiker (alleen `customer_id`, `last_sync_at`) en geeft `isLinked` + `loading` terug.
- `src/pages/dealer/Inventory.tsx`: knop toevoegen in de headerrij, gedrag/label op basis van `isLinked`, met `Can do="canEditListings"` eromheen. Tijdens laden de standaard "Importeren"-variant tonen (geen layout-sprong).

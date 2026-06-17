## Wijzigingen

1. **`src/components/BottomNav.tsx`**
   - Vervang `dealerItems` door: Home (`/`), Zoeken (`/zoeken`), AI (center button), Voorraad (`/zakelijk/voorraad`), Instellingen (`/zakelijk/instellingen`).
   - Verwijder de `moreLinks` array, de `Sheet`-rendering voor "Meer", en de `moreOpen` state.
   - Ruim ongebruikte imports op: `Store`, `Plus`, `Upload`, `MoreHorizontal`, `BarChart3`, `Inbox`, `Sheet*` componenten.

2. **`src/layouts/DealerLayout.tsx`**
   - Verwijder de Instellingen-knop rechts in de header (incl. ongebruikte `Settings` import indien niet meer nodig — blijft wel in `tabs`).
   - Header behoudt alleen brand + dealer-naam + desktop tab-nav.

## Resultaat
- Mobiele dealer bottom-nav (l→r): Home · Zoeken · AI · Voorraad · Instellingen.
- Geen "Meer" sheet meer, geen dubbele Instellingen knop in de header.
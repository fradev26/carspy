# Sidebar weghalen, dealer-nav consolideren

## Waarom
Op mobiel is de sidebar al verborgen (`lg:hidden` gedrag van bottom-nav vs `SidebarProvider`); navigatie loopt daar via bottom-nav + "Meer"-sheet. Op desktop dupliceert de sidebar exact de items die ook in het mobiele Meer-sheet zitten — extra UI-laag zonder meerwaarde. Eén navigatiepatroon voor dealers is duidelijker.

## Aanpak

**1. `src/layouts/DealerLayout.tsx`**
- `SidebarProvider`, `DealerSidebar`, `SidebarTrigger` verwijderen.
- Header wordt een gewone sticky top-bar met:
  - Brand/dealer-naam links.
  - **Horizontale tab-nav** (alleen `md:flex`): Voorraad · Import & Sync · Leads · Analytics · Instellingen. `NavLink` met active-state via `text-primary` + onderlijn.
  - Primary CTA rechts: **Voertuig toevoegen**.
- Op mobiel toont de header enkel brand + CTA-icoon; bottom-nav blijft alle nav doen.

**2. `src/components/dealer/DealerSidebar.tsx`**
- Bestand verwijderen (`rm`). Nergens anders geïmporteerd dan in DealerLayout.

**3. Geen wijziging** aan bottom-nav, routes, pagina's of backend.

## Buiten scope
Geen veranderingen aan consumer-nav, routes, of pagina-inhoud.

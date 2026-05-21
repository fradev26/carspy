# Uniforme contentbreedte voor alle tabs

## Doel
Elke pagina (tab) gebruikt exact dezelfde max-width en horizontale padding, zodat headers, lijsten en cards op alle schermen op dezelfde x-positie starten.

## Aanpak

### 1. Eén centrale container-token
Pas in `tailwind.config.ts` de `container`-config aan zodat álle `.container`-gebruik dezelfde grid volgt:
- `center: true`
- `padding: { DEFAULT: '1rem', sm: '1.25rem', lg: '2rem' }` (px-4 mobiel, px-5 sm, px-8 lg)
- `screens: { '2xl': '1400px' }` (behouden)

Dit harmoniseert alle pagina's die al `className="container"` gebruiken (Search, Favorites, Dashboard, Compare, Messages, ListingDetail, BusinessDashboard, DealerDashboard, AutoWaarde, Index-secties, Terms, Privacy, Sell).

### 2. DealerInventory aansluiten
`src/pages/DealerInventory.tsx` gebruikt al `container py-6` — verifieer dat de hero-header binnen dezelfde container valt en niet full-bleed gaat. Eventueel hero met `container` wrappen.

### 3. Sub-max-widths normaliseren
Pagina's met smallere leesbreedte (Terms, Privacy, Sell, AutoWaarde-secties) houden hun `max-w-3xl`, maar altijd binnen `.container` zodat horizontale padding gelijk blijft.

### 4. Full-bleed elementen begrenzen
- Controleer hero-secties in `Index.tsx` en `AutoWaarde.tsx`: achtergrond mag full-bleed (buiten container), maar content móét binnen `.container` blijven. Reeds zo geïmplementeerd — bevestigen.
- Geen `w-screen` / `100vw` op contentcomponenten.

### 5. Layout wrapper
`src/layouts/AppLayout.tsx` voegt geen extra horizontale padding toe — content rendert via pagina-eigen `.container`. Behouden.

### 6. BottomNav onafhankelijk
BottomNav is `fixed` en raakt contentbreedte niet. Behouden (alleen `pb-nav` voor clearance).

## Technische details

Bestanden gewijzigd:
- `tailwind.config.ts` — container.padding object i.p.v. enkele "2rem"
- (Optioneel) `src/pages/DealerInventory.tsx` — hero binnen container brengen indien nodig

Geen wijzigingen aan business logic. Alleen presentatie/layout-tokens.

## Resultaat
Alle tabs lijnen exact uit op dezelfde linker- en rechterrand. Geen visuele shifts bij navigatie tussen tabs.

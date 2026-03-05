

# iPad Weergave Optimalisatie

## Probleem

De app heeft twee layouts: mobiel (<768px) en desktop (>=768px). iPads (768-1024px) krijgen de desktop-layout, maar de header-navigatie past daar krap in en de content-grids zijn niet optimaal voor die schermgrootte.

## Aanpassingen

### 1. Tablet breakpoint toevoegen (`src/hooks/use-mobile.tsx`)
- Nieuwe hook `useIsTablet()` toevoegen die `true` retourneert voor schermen 768-1024px
- Optioneel: bestaande `useIsMobile` aanpassen naar <768px (blijft ongewijzigd)

### 2. Header aanpassen voor tablet (`src/layouts/Header.tsx`)
- Bij tablet (md tot lg): compactere navigatie tonen
  - Zoekbalk smaller maken
  - Nav-items als icon-only buttons (zonder tekst), met tooltips
  - "Auto verkopen" knop korter ("Verkopen")
- Breakpoints verschuiven: mobile header tonen tot `md` (768px), tablet-header van `md` tot `lg` (1024px), volle desktop-header vanaf `lg`

### 3. BottomNav zichtbaar op tablet (`src/components/BottomNav.tsx`)
- `md:hidden` wijzigen naar `lg:hidden` zodat de BottomNav ook op iPad zichtbaar blijft
- Dit geeft iPads de app-achtige navigatie-ervaring

### 4. AppLayout padding aanpassen (`src/layouts/AppLayout.tsx`)
- `pb-16 md:pb-0` wijzigen naar `pb-16 lg:pb-0` (consistent met BottomNav zichtbaarheid)

### 5. Listing grids optimaliseren
- `src/modules/listings/ListingGrid.tsx`: huidige `sm:grid-cols-2 lg:grid-cols-3` is al goed voor tablet (2 kolommen)
- `src/pages/Index.tsx`: hero section padding aanpassen met `md:py-20` tussenstap
- `src/pages/Search.tsx`: filter sidebar als sheet/overlay houden op tablet in plaats van naast de resultaten

### 6. Header breakpoints verschuiven (`src/layouts/Header.tsx`)
- Mobiele header: `lg:hidden` (was `md:hidden`) -- tonen tot 1024px
- Desktop header: `hidden lg:flex` (was `hidden md:flex`) -- tonen vanaf 1024px
- Dit zorgt dat iPads de compacte mobiele header + BottomNav krijgen (app-ervaring)

## Samenvatting bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/layouts/Header.tsx` | Breakpoints md→lg voor mobile/desktop header switch |
| `src/components/BottomNav.tsx` | `md:hidden` → `lg:hidden` |
| `src/layouts/AppLayout.tsx` | `md:pb-0` → `lg:pb-0` |
| `src/pages/Index.tsx` | Tussenliggende padding voor tablet |

De kernstrategie is simpel: iPads krijgen de **mobiele app-layout** (compacte header + bottom nav) in plaats van de krappe desktop-layout. Dit sluit aan bij de bestaande mobile-first strategie.


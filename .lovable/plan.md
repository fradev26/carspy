# Border-radius QA audit

Tailwind-scale staat nu vast: `sm 6 / md 10 / lg 14`. Klassen `xl`, `2xl`, `3xl` worden ge-cap op 14px. Audit hieronder gaat over wat de gebruiker visueel ziet, niet over de literal classnames.

## ❌ Issues

1. **Stappen-circle in verkoopwizard** — `src/pages/Sell.tsx:289`
   `h-8 w-8 rounded-full` (genummerd stepper). Geen avatar/dot → moet `rounded-md`.

2. **Foto-upload tegel in verkoopwizard** — `src/pages/Sell.tsx:351`
   `h-24 w-24 rounded-full bg-muted` (groot upload-zone). Voelt als "bubble". → `rounded-md`.

3. **Seller-initiaal op detailpagina** — `src/pages/ListingDetail.tsx:365`
   `h-12 w-12 rounded-full bg-primary` (grote rode cirkel). Botst met "geen grote rode vlakken" + radius-systeem. → `rounded-md` + neutralere bg (`bg-primary/10 text-primary`).

4. **Empty-state icon in zoekpagina** — `src/pages/Search.tsx:605`
   `h-16 w-16 rounded-full bg-muted`. → `rounded-md`.

5. **Deal-score gauge in AI-modal** — `src/modules/listings/AIAnalysisModal.tsx:51`
   `rounded-full h-16 w-16 border-2`. Grote gekleurde cirkel = soft/playful. → `rounded-md` (of bewust uitzondering documenteren).

6. **AI-FAB (chat widget)** — `src/modules/chat/ChatWidget.tsx:53`
   `h-14 w-14 rounded-full shadow-lg`. Tweede ronde FAB naast BottomNav AI-knop = inconsistent + visueel concurreert. → `rounded-md` óf component verbergen op mobiel (al? checken).

7. **Verouderde `SearchBar.tsx` (glass-card)** — `src/modules/search/SearchBar.tsx:187,347`
   Nog steeds `glass rounded-2xl … shadow-floating` met nested filterblok = exact het double-container patroon dat in vorige stap is opgeruimd. → vervangen of verwijderen als ongebruikt.

8. **Body-type tegels in HomepageFilters** — `src/modules/search/HomepageFilters.tsx:300`
   `rounded-xl border-2` (= 14px) naast `rounded-md` chips (10px) in dezelfde sectie → mix van twee radius-niveaus binnen één paneel. → `rounded-md` voor consistentie.

9. **Skeleton cards** — `src/components/ui/skeleton-card.tsx:13,40`
   `rounded-xl` (=14px) — ListingCard zelf gebruikt `rounded-lg` (Card default, ook 14px). Visueel gelijk maar gebruik `rounded-lg` voor één bron.

## ⚠️ Twijfelgevallen

- **Brand-chips op homepage** (`Index.tsx:187`): `rounded-md` + `px-4 py-2` — radius klopt, maar door grote horizontale padding ogen ze nog licht "pill". Padding naar `px-3 py-1.5` overwegen.
- **Chat-bubbles** (`ChatMessage.tsx:77`, `Messages.tsx:238`): `rounded-2xl` (=14px). Acceptabel voor messaging-context maar inconsistent met de rest van de UI op 10px. Overweeg `rounded-md`.
- **AIFullscreenChat empty-state icoon** (`AIFullscreenChat.tsx:97`): `h-16 w-16 rounded-2xl bg-primary/10` — geen avatar; eerder `rounded-md`.
- **BottomNav actieve dot** (`BottomNav.tsx:67`): 4×4px `rounded-full`. Mag als status-dot, maar een 6×2px `rounded-sm` balkje voelt strakker/tool-achtiger.
- **Sell.tsx X-knop op foto** (`Sell.tsx:365`): klein icon-buttontje, `rounded-full` is borderline OK maar inconsistent met de rest.

## ✅ Correct toegepast

- `Button` (alle sizes) — `rounded-md`
- `Input`, `Select` triggers — `rounded-md`
- `Badge` — `rounded-sm`
- `Card` (default shadcn) — `rounded-lg` (14px)
- `ListingCard` price badge + hover CTA — `rounded-lg`
- `HeroSearch` toggle — `rounded-md` container / `rounded-sm` items
- `ClassicHeroSearch` desktop pill row — `rounded-md` + `rounded-r-md` CTA
- `SmartSearchBar` — `rounded-md` shell + `rounded-sm` icon-tile
- `ImageGallery` floating controls — `rounded-md`
- Avatar component, spinners, switch/slider/radio/progress, BottomNav center AI-knop — bewust `rounded-full` (uitzondering)

## 🔧 Concrete fixes

| Bestand | Huidig | Wordt |
|---|---|---|
| `src/pages/Sell.tsx:289` | `... rounded-full text-sm font-medium` | `... rounded-md text-sm font-medium` |
| `src/pages/Sell.tsx:351` | `h-24 w-24 ... rounded-full bg-muted` | `h-24 w-24 ... rounded-md bg-muted` |
| `src/pages/Sell.tsx:365` | `... rounded-full bg-destructive p-1` | `... rounded-md bg-destructive p-1` |
| `src/pages/ListingDetail.tsx:365` | `h-12 w-12 ... rounded-full bg-primary text-primary-foreground` | `h-12 w-12 ... rounded-md bg-primary/10 text-primary` |
| `src/pages/Search.tsx:605` | `h-16 w-16 ... rounded-full bg-muted` | `h-16 w-16 ... rounded-md bg-muted` |
| `src/modules/listings/AIAnalysisModal.tsx:51` | `rounded-full h-16 w-16 border-2` | `rounded-md h-16 w-16 border-2` |
| `src/modules/chat/ChatWidget.tsx:53` | `h-14 w-14 ... rounded-full shadow-lg` | `h-14 w-14 ... rounded-md shadow-lg` |
| `src/modules/search/SearchBar.tsx:187,347` | `glass rounded-2xl p-6 shadow-floating` | `rounded-lg border border-border/60 bg-card p-6 shadow-card` (één laag) |
| `src/modules/search/HomepageFilters.tsx:300` | `... p-3 rounded-xl border-2 ...` | `... p-3 rounded-md border-2 ...` |
| `src/components/ui/skeleton-card.tsx:13,40` | `rounded-xl border bg-card` | `rounded-lg border bg-card` |
| `src/modules/chat/AIFullscreenChat.tsx:97` | `h-16 w-16 ... rounded-2xl bg-primary/10` | `h-16 w-16 ... rounded-md bg-primary/10` |

Optioneel (twijfel — alleen op akkoord):
- `Index.tsx:187` brand chip padding → `px-3 py-1.5`
- `ChatMessage.tsx:77` + `Messages.tsx:238` bubble → `rounded-md`
- `BottomNav.tsx:67` active dot → smal `rounded-sm` balkje

## Implementatie-volgorde

1. Verplichte fixes uit de tabel (klein, 1 file = 1 sed-edit).
2. Visuele recheck via screenshot van `/`, `/verkopen`, `/zoeken`, een detailpagina.
3. Twijfelgevallen alleen na bevestiging.

# Dealer UX herstructurering

Doel: een voertuig-centrisch operating system. Dealers zien een eigen bottom nav (Markt / Voorraad / Verkopen / Meer), AI verdwijnt uit de hoofdnav, en elke ListingCard toont overal een statusbadge + "Vergelijk markt".

## 1. Bottom navigation — dealer vs consument

`src/components/BottomNav.tsx` wordt rol-aware via `useProfile().isDealer`.

**Dealer (4 tabs, geen center AI):**

```text
[ Markt ]  [ Voorraad* ]  [ Verkopen ]  [ Meer ]
   Search      Car (default)   Upload     Menu
```
- Markt → `/zoeken`
- Voorraad → `/zakelijk/voorraad` (default landing — redirect `/` → `/zakelijk/voorraad` voor dealers in `Index.tsx`)
- Verkopen → `/verkopen?dealer=1`
- Meer → opent een `Sheet` met links: Instellingen, Import (CSV), Analytics, Integraties (AutoScout), Leads, Berichten, Account, Donker/licht thema

**Consument:** huidige 5-tab nav blijft ongewijzigd (inclusief center AI button). Geen regressie.

AI als hoofdtab vervalt alleen voor dealers; AI blijft beschikbaar als contextuele assistent op listing detail, voorraad, en markt-pagina's (bestaande chat widget/floating button).

## 2. Status badge verplicht op ALLE ListingCards

In `src/modules/listings/ListingCard.tsx`: één gedeelde `StatusBadge` (nieuwe kleine component `src/modules/listings/StatusBadge.tsx`) die altijd rendert in zowel `default` als `horizontal` variant, links-onder de afbeelding, naast de Premium-kroon.

Mapping (token-based, geen hardcoded kleuren):
| status | label | tint |
|---|---|---|
| active | Beschikbaar | `bg-emerald-500/90 text-white` via `--status-available` |
| draft | Concept | `bg-muted text-muted-foreground` |
| reserved | Gereserveerd | `bg-warning text-warning-foreground` (al aanwezig) |
| sold | Verkocht | `bg-destructive/90 text-destructive-foreground` |
| inactive/expired | Gepauzeerd | `bg-muted text-muted-foreground` |

Tokens worden toegevoegd in `src/index.css` (`--status-available-bg/fg` etc.) voor light + dark.

De bestaande losse "Gereserveerd" badge wordt vervangen door deze unified `StatusBadge` — geen dubbele indicator. Premium kroon blijft apart (niet-status).

Toegepast op: Search, Home (CategoryGrid/featured), Favorites, Compare, Dealer pages, gerelateerde items, ListingDetail thumbnails. Aangezien overal `ListingCard` wordt hergebruikt is dit één bron van waarheid; we verifiëren alleen.

## 3. "Vergelijk markt" knop

Nieuwe CTA per ListingCard (alleen `default` variant, niet `compact` om clutter te vermijden): klein outline-knopje onderaan content, naast locatie/dealer-badge, label "Vergelijk markt" met `BarChart3` icoon. Stop event propagation → navigeert naar `/zoeken?brand=<brand>&model=<model>&yearMin=<year-1>&yearMax=<year+1>&compareWith=<id>`.

In `Search.tsx` lezen we `compareWith` uit URL en tonen bovenaan een banner met "Marktvergelijking voor <titel>" + min/avg/max prijs (berekend client-side uit huidige resultaten) en de positie van de referentie-listing. Geen nieuwe backend nodig.

## 4. Voorraad pagina verbeteringen (`src/pages/dealer/Inventory.tsx`)

**KPI strip** (4 tegels boven de filters):
```text
[ Actieve voertuigen ] [ Views ] [ Favorieten ] [ Leads ]
```
Data uit bestaande `useDealerAnalytics().overview`.

**Primary actions** (rechts naast titel): `Voertuig toevoegen`, `CSV import`, `AutoScout koppelen` — bestaande links, nu altijd zichtbaar (niet alleen empty state).

**Chip-filters** vervangen de Select:
```text
[ Alle ] [ Beschikbaar ] [ Concept ] [ Gereserveerd ] [ Verkocht ]
```
Pill-style buttons; actieve chip krijgt `bg-primary text-primary-foreground`. Counts tussen haakjes (uit `listings`).

**Per rij**: kleine "Vergelijk markt" link in actie-kolom (opent dezelfde URL als card-CTA). Prijs-vs-markt indicator (optioneel) komt later — niet in deze sprint.

## 5. Favorieten — ongewijzigd

`useFavorites` blijft single source of truth. Alleen het hartje is visueel indicator. Geen card-styling verschillen voor favorieten — bestaand gedrag.

## 6. AI herpositionering

- Verwijderd uit dealer bottom nav (zie §1)
- Blijft in consument bottom nav
- Blijft als floating `ChatWidget` (al actief via `AppLayout`)
- Geen wijzigingen aan AI logica / edge functions

## Bestanden

**Nieuw:**
- `src/modules/listings/StatusBadge.tsx`
- `src/components/dealer/DealerBottomNav.tsx` (of conditioneel in BottomNav)
- `src/components/MarketCompareBanner.tsx` (Search top-banner)

**Bewerkt:**
- `src/components/BottomNav.tsx` — rol-switch dealer/consument
- `src/modules/listings/ListingCard.tsx` — StatusBadge + Vergelijk markt CTA, verwijder oude Gereserveerd badge
- `src/pages/dealer/Inventory.tsx` — KPI strip, chip-filters, persistent primary actions
- `src/pages/Index.tsx` — dealer-redirect naar `/zakelijk/voorraad`
- `src/pages/Search.tsx` — `compareWith` query support + banner
- `src/index.css` — status color tokens (light + dark)

**Niet aangepast:** backend, RLS, edge functions, FavoritesContext, AI chat, Premium logica.

## Out of scope (deze sprint)
- Prijs-vs-markt indicator per rij (heuristiek nog te definiëren)
- AI "deal detection" badge op markt-cards
- Verkopen-tab als volwaardige publishing-hub (nu nog `/verkopen` wizard)

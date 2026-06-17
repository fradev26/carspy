# Desktop navigatie consistent maken met mobile

## 1. Huidige verschillen (audit)

### Items & hiërarchie
| Onderdeel | Mobile (`BottomNav`) | Desktop (`Header`) |
|---|---|---|
| Home | ✅ icon + label | ❌ ontbreekt (alleen via logo) |
| Zoeken | ✅ | ✅ (tekst, geen icoon) |
| AI | ✅ centrale prominente CTA (Sparkles, primary bg) | ❌ ontbreekt volledig |
| Favorieten | ✅ | ✅ |
| Verkopen / Voorraad (dealer) | ✅ contextueel: consumer=Verkopen, dealer=Voorraad | ❌ desktop toont altijd "Auto verkopen" CTA, geen Voorraad-shortcut voor dealers |
| Berichten | ❌ niet in bottom nav | ✅ aanwezig |
| Account dropdown | ❌ (zit in left Sheet) | ✅ dropdown rechts |

### Visuele patronen
- **Active state**: mobile = pill met `bg-white/55 dark:bg-white/10`, backdrop-blur, border, `text-primary`. Desktop = geen visuele active-state (alle nav-items zien er identiek uit ongeacht route).
- **Iconen**: mobile = icoon + label boven elkaar. Desktop = label only (Zoeken) of icoon+label horizontaal (Favorieten, Berichten).
- **AI**: mobile heeft een centrale verhoogde primary-pill (Sparkles). Desktop heeft geen AI-entry.
- **Hover**: mobile gebruikt `active:scale`, desktop gebruikt `hover:bg-muted` of `hover:bg-white/10` (transparent mode).
- **Transparent mode**: desktop switcht naar witte tekst op homepage hero — mobile doet dit niet (altijd `bg-card`). Inconsistent.
- **Sticky**: beide zijn `fixed` — mobile bottom, desktop top. OK, behouden.

### CTA's
- Mobile: "Auto verkopen" wordt in dealer-mode vervangen door "Voorraad" tab; primaire CTA `/verkopen` zit als gewoon tab-item.
- Desktop: "Auto verkopen" is altijd een aparte filled primary button rechts, ook voor dealers (linkt naar `/zakelijk`).

## 2. Aanpak: één gedeelde nav-bron + 2 renderers

Doel: zelfde items, labels, icons, active-logica en dealer/consumer-switch op desktop én mobile. Desktop blijft horizontaal in de header; mobile blijft bottom nav.

### A. Gedeelde nav-configuratie
Nieuw bestand `src/config/navigation.ts`:
- Exporteer `consumerNavItems` en `dealerNavItems` (verplaats vanuit `BottomNav.tsx`).
- Eén bron van waarheid voor `{ icon, label, path, isAI?, authPath? }`.

### B. Gedeelde active-state helper
Nieuw `src/lib/navActive.ts` met `isNavItemActive(pathname, itemPath)` (zelfde logica als BottomNav: exact match of `startsWith` voor non-root). Gebruik dit ook in desktop.

### C. `BottomNav.tsx`
- Importeer items uit `@/config/navigation`. Geen verdere wijziging.

### D. `Header.tsx` — desktop sectie herwerken
Vervang de huidige `nav` (regels ~228-297) door:
1. **Primaire nav (links naast logo)** — render dezelfde items als mobile (`Home, Zoeken, AI, Favorieten, Verkopen/Voorraad`) als horizontale row:
   - Component `<DesktopNavItem>` met `icon + label` horizontaal, `gap-2`.
   - Active = `bg-muted text-primary` pill met `rounded-md px-3 py-2` (desktop-equivalent van mobile pill, zelfde tokens). Inactive = `text-muted-foreground hover:text-foreground hover:bg-muted/60`.
   - AI-item: prominent gevulde primary button (Sparkles + "AI") — desktop-pendant van de centrale mobile knop. Op klik: zelfde gedrag als mobile (open `AIFullscreenChat` als `path` null is, anders navigate).
2. **Secundaire acties (rechts)**:
   - Berichten icon-button met unread badge (behouden, desktop-only — past niet in bottom nav).
   - Account dropdown (behouden).
   - **Verwijder** de losse "Auto verkopen" primary CTA rechts: die zit nu al als nav-item (Verkopen/Voorraad) links, conform mobile. Voor niet-ingelogde gebruikers blijft een "Inloggen" knop rechts.

### E. AI-state lifting
`AIFullscreenChat` open-state staat nu in `BottomNav`. Verplaats naar `AppLayout` (of een context) zodat zowel `BottomNav` als `Header` dezelfde overlay kunnen triggeren. Bestaande `sessionStorage` reopen-flag en `vatuur:chat-navigate-listing` listener mee verhuizen.

### F. Transparent-mode op homepage
Behoud `isTransparent` voor desktop, maar pas tokens consistent toe: actieve item krijgt `bg-white/15 text-white` i.p.v. `bg-muted text-primary` in transparent mode (mirror van mobile glassmorphism). Eén `cn()` switch per item.

## 3. Concrete stappen

1. Nieuw `src/config/navigation.ts` met `consumerNavItems`, `dealerNavItems`, types.
2. Nieuw `src/lib/navActive.ts` met `isNavItemActive`.
3. Refactor `BottomNav.tsx` → importeer items + helper. Lift `aiOpen` state.
4. Nieuw `src/context/AIChatContext.tsx` (provider + `useAIChat()` met `open/setOpen`). Mount provider + `<AIFullscreenChat>` in `AppLayout`.
5. Nieuw `src/components/DesktopNav.tsx` met `<DesktopNavItem>` subcomponent (icon+label, active pill, transparent variant, AI variant).
6. `Header.tsx` desktop blok: vervang huidige nav door `<DesktopNav />`. Verwijder losse "Auto verkopen" Button. Behoud Berichten + Account dropdown + Inloggen (logged-out).
7. Smoke test routes: `/`, `/zoeken`, `/favorieten`, `/verkopen`, `/zakelijk`, `/zakelijk/voorraad`, `/berichten` — actieve state correct op desktop én mobile.

## 4. Responsive gedrag

- `< lg` (1024px): bottom nav zichtbaar (`lg:hidden`), desktop nav verborgen (`hidden lg:flex`). Ongewijzigd.
- `≥ lg`: desktop nav in header, bottom nav verborgen.
- Geen nieuwe breakpoints nodig.

## 5. Design system

- Alleen semantic tokens: `bg-muted`, `text-primary`, `text-muted-foreground`, `bg-primary/text-primary-foreground` voor AI-CTA. Geen hardcoded kleuren.
- Radius `rounded-md` (8px) voor desktop nav-pills — matcht header-knoppen; mobile gebruikt `rounded-xl` wat past bij de grotere touch-targets. Bewust verschil voor density.
- Hover: `hover:bg-muted/60`, active route: `bg-muted text-primary`, focus: bestaande `.focus-ring` util.

## 6. Out of scope

- Geen wijzigingen aan `DealerLayout` secondary tabs (`/zakelijk/*` subnav).
- Geen wijzigingen aan Footer.
- Geen nieuwe routes of business logic.

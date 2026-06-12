## Doel

Mobiele navigatie dedupliceren zonder nieuwe patronen. Bottom nav blijft Home/Zoeken/AI/Favorieten/Verkopen. Account-knop (linksboven) wordt de persoonlijke hub. Berichten blijft rechtsboven. Geen visuele redesign.

## 1. Bottom Navigation (`src/components/BottomNav.tsx`)

Geen wijziging aan structuur of styling. Bevestigen: Home, Zoeken, AI (center), Favorieten, Verkopen. ✓ reeds zo.

## 2. Header — Account Sheet wordt hub (`src/layouts/Header.tsx`)

De bestaande `Sheet` (User-icoon linksboven) blijft de toegangspoort. We herstructureren alleen de inhoud tot een overzichtelijke hub met gegroepeerde secties. Gebruik bestaande `Separator`, knop-styling en spacing — geen nieuwe tokens.

Nieuwe sectiestructuur (zelfde knop-stijl als nu, met kleine sectie-headers in `text-xs uppercase text-muted-foreground`):

**Profielheader** (bovenaan, vervangt huidige SheetTitle-logo voor ingelogde users)
- Avatar/initialen, naam, badge accounttype (Particulier / Dealer).
- Uitgelogd: behoudt logo + "Inloggen / Registreren" knop.

**Mijn account**
- Profiel → `/dashboard` (placeholder voor nieuwe profielpagina later)
- Contactgegevens → `/dashboard`
- Meldingen → `/dashboard`
- Privacy → `/dashboard`

**Mijn activiteiten**
- Mijn advertenties → `/dashboard`
- Zoekalerts → `/dashboard` (tab searches)
- Recent bekeken → `/dashboard`
- Favorieten (teller via `useFavorites`) → `/favorieten` — getoond als reminder/teller, niet als afzonderlijke primaire bestemming

**Dealerfuncties** (alleen `isDealer`)
- Zakelijk Dashboard → `/zakelijk`
- Leads → `/zakelijk`
- Voorraadbeheer → `/zakelijk`
- Statistieken → `/zakelijk`

**Juridisch**
- Privacybeleid → `/privacy`
- Algemene voorwaarden → `/voorwaarden`

**Support**
- Helpcentrum → `#` (placeholder)
- Contact → `mailto:info@vatuur.nl`

**Accountacties** (met `Separator` ervoor)
- Uitloggen (destructive)

Voor secties zonder dedicated pagina (Profiel/Meldingen/etc.) voorlopig naar `/dashboard` linken — geen nieuwe pagina's in dit plan.

## 3. Deduplicatie

Te verwijderen uit hamburger/Sheet (al deels aanwezig — herschikken telt mee):
- Losse "Mijn advertenties", "Favorieten", "Privacybeleid", "Algemene voorwaarden" als top-level items (gaan op in gegroepeerde secties; Favorieten alleen als teller-link)

Te verwijderen uit Desktop header dropdown (`src/layouts/Header.tsx`):
- "Favorieten" item uit Account DropdownMenu (Favorieten heeft al eigen header-knop links ervan = duplicatie)
- "Mijn advertenties" blijft in dropdown (enige toegang op desktop)
- "Zakelijk Dashboard" blijft in dropdown voor dealers

Bottom nav: niets te verwijderen — al gededupliceerd.

## 4. Geen wijzigingen aan
- `BottomNav.tsx` (styling/structuur ongewijzigd)
- Routing in `App.tsx` (geen nieuwe routes)
- Berichten-knop rechtsboven (blijft)
- Dashboard / BusinessDashboard pagina's
- Design tokens, kleuren, animaties

## Technische details

- Files gewijzigd: `src/layouts/Header.tsx` (alleen Sheet-inhoud + één DropdownMenuItem verwijderen)
- Geen nieuwe files, geen DB-werk, geen nieuwe hooks (hergebruik `useFavorites`, `useProfile`)
- Sectie-headers: kleine `<p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">` boven elke groep — past binnen bestaand design system

## Acceptatiecriteria

- Bottom nav onveranderd: Home, Zoeken, AI, Favorieten, Verkopen
- Account-sheet linksboven toont gegroepeerde hub met alle genoemde secties
- Berichten-knop blijft rechtsboven
- Geen item heeft nog twee primaire toegangswegen (Favorieten = bottom nav, Mijn advertenties = Account, Privacy/Voorwaarden = Account, Berichten = header, Dealer Dashboard = Account)
- Bestaande styling, spacing en animaties intact

## Doel

Een gebruiker met nieuwe (ongelezen) berichten ziet dat meteen op elk scherm — zonder het burgermenu te openen of naar /berichten te navigeren.

## Aanpak

1. **Nieuwe hook `useUnreadMessages`** (`src/hooks/useUnreadMessages.ts`)
   - Telt rijen in `public.messages` waar `sender_id <> auth.uid()` en `read_at IS NULL`, beperkt tot gesprekken waarin de huidige gebruiker buyer of seller is (RLS dekt dit al).
   - Realtime subscription op `messages` (INSERT + UPDATE) zodat de teller live bijwerkt zodra een bericht binnenkomt of als gelezen wordt gemarkeerd.
   - Retourneert `{ count }`; geen verandering aan bestaande logica in `Messages.tsx` (die markeert al `read_at` bij openen — teller daalt automatisch).

2. **Visuele indicators (rode badge met aantal, capped op 9+)**
   - **Mobiele bottom nav** (`src/components/BottomNav.tsx`): nieuw item "Inbox" toevoegen? Nee — de bottom nav is al vol (Home, Zoeken, AI, Favorieten, Verkopen) en de gebruiker vroeg geen herstructurering. In plaats daarvan: kleine rode dot/badge op het **burgermenu-icoon (Menu)** in `Header.tsx` mobile bar zodat de gebruiker ziet dat er iets nieuws in het menu zit, plus een badge naast het "Berichten"-item in het geopende menu (zodat het na openen ook duidelijk is welk item).
   - **Desktop header** (`src/layouts/Header.tsx`): badge naast het bestaande "Berichten"-knoplabel.
   - **Dashboard "Berichten"-tab** (`src/pages/Dashboard.tsx`): tellertje achter het tab-label, consistent met de "Zoekalerts"-stijl.

3. **Realtime publication check**
   - `messages` staat al in `supabase_realtime` (gebruikt door `Messages.tsx`). Geen migratie nodig.

## Bestanden

- Nieuw: `src/hooks/useUnreadMessages.ts`
- Bewerken: `src/layouts/Header.tsx` (mobiele Menu-knop + Berichten-link mobiel/desktop)
- Bewerken: `src/components/BottomNav.tsx` (geen nieuw item; alleen als nodig — zie hieronder)
- Bewerken: `src/pages/Dashboard.tsx` (badge op tab)

## Open vraag

De bottom nav heeft geen Berichten-item en zit visueel vol. Twee opties:
- **A (voorgesteld):** Geen wijziging aan bottom nav; zichtbaarheid komt via een rode dot op het burgermenu-icoon (rechtsboven, altijd in beeld op mobiel).
- **B:** Verkopen-knop vervangen door Berichten-knop in bottom nav (Verkopen blijft prominent via header CTA en burger). Ingrijpender.

Ik ga uit van **optie A** tenzij je B verkiest.

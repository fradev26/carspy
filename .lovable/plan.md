# Dark Mode Implementatie

## Doel
Een volwaardige dark mode toevoegen aan VATUUR. zonder zichtbare toggle in de UI. De gebruiker stelt het thema in via Instellingen → sectie "Weergave". Standaard volgt de app de systeeminstelling; de keuze wordt permanent bewaard en is op alle toestellen actief.

## Aanpak

### 1. ThemeProvider (centrale context)
Nieuw bestand `src/hooks/useTheme.tsx`:
- Context met `theme: 'system' | 'light' | 'dark'`, `resolvedTheme: 'light' | 'dark'`, `setTheme(t)`.
- Bron van waarheid bij laden, in deze volgorde:
  1. Profielkolom `theme_preference` (wanneer ingelogd).
  2. `localStorage('vatuur-theme')` (fallback / niet-ingelogde gebruikers).
  3. `'system'` als default.
- Past bij iedere wijziging onmiddellijk `.dark` toe op `document.documentElement` (Tailwind `darkMode: ["class"]` is al actief).
- Luistert naar `matchMedia('(prefers-color-scheme: dark)')` zodat "Systeem" live volgt.
- `setTheme` schrijft naar localStorage én — indien ingelogd — naar `profiles.theme_preference` (upsert). Bij login wordt de server-voorkeur naar localStorage gespiegeld.
- Toegevoegd aan `src/App.tsx` tussen `AuthProvider` en de rest (zodat `useAuth` beschikbaar is).
- Mini-script in `index.html` (`<script>` in `<head>`) leest direct localStorage en zet de `dark`-class vóór React mount → geen FOUC.

### 2. Persistentie (database)
Migration: kolom `theme_preference text` toevoegen aan `public.profiles` met CHECK `IN ('system','light','dark')`, default `'system'`. Bestaande RLS-policies dekken updates van eigen profiel al, geen nieuwe policy nodig.

### 3. Instellingen → Weergave
In `src/pages/account/AccountSettings.tsx`:
- Nieuwe tab/sectie "Weergave" naast Profiel / Meldingen / Privacy.
- `RadioGroup` met drie kaarten: Systeem (standaard) · Licht · Donker, met korte beschrijving en icoontjes (Monitor / Sun / Moon van lucide-react).
- Wijziging roept `setTheme` aan; toast "Weergave bijgewerkt".
- Route `/account/weergave` toevoegen in `App.tsx` (analoog aan bestaande tabs).

### 4. Design tokens controleren
`src/index.css` heeft al volledige `:root` én `.dark` token-sets (background, card, primary, etc.). Verifiëren en aanvullen waar nodig:
- Controleren dat alle semantische tokens (success/warning/premium/status-*) in `.dark` correct contrast hebben (WCAG AA).
- VATUUR-primary blijft `#E11D48` in beide thema's; in dark iets opgelicht voor contrast (al voorzien).

### 5. Hardcoded kleuren opruimen
Ongeveer 27 voorkomens van `text-white` / `bg-white` / `text-black` / `bg-black` in:
- `src/layouts/Header.tsx`, `src/components/BottomNav.tsx`
- `src/modules/listings/ImageGallery.tsx`, `src/modules/search/HeroSearch.tsx`, `ClassicHeroSearch.tsx`
- `src/pages/Index.tsx`, `src/modules/chat/ChatMessage.tsx`
- Shadcn-overlays: `dialog.tsx`, `drawer.tsx`, `sheet.tsx`, `alert-dialog.tsx`, `chart.tsx`, `alert.tsx`

Vervangen door semantische tokens:
- Tekst op gekleurde achtergronden → `text-primary-foreground` / `text-foreground`.
- Witte panelen → `bg-background` / `bg-card`.
- Overlay-zwart (modals) → `bg-foreground/80` of behouden als bewuste overlay (`bg-black/80` op fotogalerij mag blijven — dat is opzettelijke media-lightbox, in beide thema's correct).
- Per bestand beoordelen: alleen wisselen waar het thema-afhankelijk hoort te zijn; bewuste media/lightbox-zwart blijft.

### 6. Verificatie
- Visueel testen via `browser--view_preview` op `/`, `/zoeken`, `/auto/:id`, `/dashboard`, `/account/instellingen`, modals (filter, AI chat, image gallery), mobile bottom nav.
- Tests draaien (`bunx vitest run`) — bestaande 35 tests moeten groen blijven.
- Contrast-check primary/foreground in dark mode.

## Niet in scope
- Toggle in header, footer of elders in de UI (expliciet uitgesloten).
- Aparte dark-mode varianten voor marketingafbeeldingen.

## Bestanden gewijzigd / nieuw
- **Nieuw:** `src/hooks/useTheme.tsx`
- **Migration:** `profiles.theme_preference` kolom
- **Aangepast:** `src/App.tsx` (provider + route), `index.html` (anti-FOUC script), `src/pages/account/AccountSettings.tsx` (Weergave-tab), `src/index.css` (token-tuning indien nodig), plus de ~10 componenten met hardcoded kleuren.

# Account-hub pagina's afwerken

Vandaag wijzen alle hub-items (Profiel, Meldingen, Privacy, Mijn advertenties, Zoekalerts, Recent bekeken, Helpcentrum, Contact, Leads, Voorraadbeheer, Statistieken) naar `/dashboard` of `#`. We bouwen voor elke bestemming een echte pagina, hergebruiken bestaande VATUUR-componenten en wijzigen géén navigatie, branding of design tokens.

## Aanpak per prioriteit

### Prioriteit 1 — nieuwe routes & pagina's

| Route | Pagina | Inhoud |
|---|---|---|
| `/account/advertenties` | `MyListings.tsx` | Advertentiebeheercentrum |
| `/account/zoekalerts` | `SearchAlerts.tsx` | Beheer opgeslagen zoekopdrachten |
| `/account/recent` | `RecentlyViewed.tsx` | Recent bekeken voertuigen |
| `/help` | `Help.tsx` | Helpcentrum met FAQ-accordion + zoek |
| `/contact` | `Contact.tsx` | Contactformulier + supportinfo |

**MyListings** — herbruikt huidige Dashboard-`listings` query, splitst per status-tab (Actief, Concept, Verlopen, Verkocht). Per kaart: foto, titel, prijs, status-badge, weergaven, favorieten-count (`favorites` table), berichten-count (`conversations`). Acties: Bekijken, Bewerken (`/verkopen?edit=`), Verlengen (update `boost_until`), Markeren als verkocht (`status='sold'`), Verwijderen (bestaande flow). Lege staat met CTA naar `/verkopen`.

**SearchAlerts** — herbruikt `useSavedSearches`. Per alert: leesbare samenvatting (merk, model, prijs, locatie), pauze-toggle + frequentie-select (dagelijks/wekelijks). Vereist 2 nieuwe kolommen op `saved_searches`: `paused boolean default false`, `frequency text default 'daily'` (migration). Verwijderen via bestaande `remove`. Lege staat met uitleg + CTA naar `/zoeken`.

**RecentlyViewed** — bestaat al als localStorage via `useRecentSearches` (zoekopdrachten). Toevoegen: `useRecentlyViewedListings` hook (localStorage `vatuur:recent-listings`, max 24, auto bij bezoek `ListingDetail`). Toon als `ListingGrid`. Lege staat met CTA naar `/zoeken`.

**Help** — statische FAQ-data in `src/data/faq.ts` met categorieën (kopen, verkopen, dealeraccount, betalingen, veiligheid, account). Bovenaan zoekveld (filtert q&a), daaronder `Tabs` per categorie met shadcn `Accordion`. Onderaan link naar `/contact`.

**Contact** — zod-gevalideerd formulier (naam, e-mail, onderwerp-select, bericht), submit naar nieuwe edge function `support-contact` (verzendt via mailto fallback of slaat op in nieuwe `support_messages` tabel). Naast formulier: kaart met support-e-mail, reactietijd ("binnen 1 werkdag"), link naar Helpcentrum.

### Prioriteit 2 — profiel & instellingen onder `/account/instellingen`

Eén pagina met sub-`Tabs`: Profiel · Meldingen · Privacy.

- **Profiel-tab**: form (full_name, phone, avatar upload naar `listing-images` bucket subfolder `avatars/`, locatie als nieuwe `location text` op `profiles`). Zod-validatie, opslaan via `supabase.from('profiles').update`.
- **Meldingen-tab**: toggles voor `new_messages`, `search_alerts`, `listing_status`, `system`, `marketing`. Nieuwe tabel `notification_preferences (user_id pk, ...)`.
- **Privacy-tab**: toggles `profile_public`, `show_contact`, `marketing_consent`, link naar cookievoorkeuren (stub die localStorage `cookie-consent` opent). Nieuwe tabel `privacy_preferences (user_id pk, ...)`.

Routes: `/account/profiel`, `/account/meldingen`, `/account/privacy` → allemaal renderen `AccountSettings` met juiste default tab (eenvoudige wrapper).

### Prioriteit 3 — dealer-secties als eigen tabs in `/zakelijk`

`BusinessDashboard` ondersteunt al tabs. We voegen routes met query-tab toe en Header-sheet linkt naar de juiste tab:

- `/zakelijk?tab=overzicht` (bestaand)
- `/zakelijk?tab=leads` — nieuwe tab `Leads`: tabel uit `vehicle_leads` + `dealer_leads` (kopernaam, voertuig, datum, status), filters (status, periode).
- `/zakelijk?tab=voorraad` — bestaande inventory verrijkt met zoek-input, status-filter en bulk-checkbox-acties (markeer verkocht / boost / verwijder).
- `/zakelijk?tab=statistieken` — uitgebreid panel met period-select (7/30/90 dagen) en Recharts: views, favorieten, berichten, conversie-ratio.

Header-sheet items (`Briefcase`, `UsersIcon`, `Package`, `LineChart`) krijgen de juiste `?tab=` URL.

## Hub-wiring (Header.tsx)

Eén bestand-edit: in de sheet `handleMobileNav`-targets vervangen door bovenstaande routes. Geen visuele wijzigingen.

## Database changes (één migration)

```sql
ALTER TABLE saved_searches
  ADD COLUMN paused boolean NOT NULL DEFAULT false,
  ADD COLUMN frequency text NOT NULL DEFAULT 'daily';

ALTER TABLE profiles ADD COLUMN location text;

CREATE TABLE notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  new_messages boolean NOT NULL DEFAULT true,
  search_alerts boolean NOT NULL DEFAULT true,
  listing_status boolean NOT NULL DEFAULT true,
  system boolean NOT NULL DEFAULT true,
  marketing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE privacy_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  profile_public boolean NOT NULL DEFAULT true,
  show_contact boolean NOT NULL DEFAULT false,
  marketing_consent boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
Met bijbehorende GRANTs, RLS (eigen rij / admin) en update-triggers.

## Bestanden

**Nieuw**
- `src/pages/account/MyListings.tsx`
- `src/pages/account/SearchAlerts.tsx`
- `src/pages/account/RecentlyViewed.tsx`
- `src/pages/account/AccountSettings.tsx` (deelt logic voor /profiel /meldingen /privacy)
- `src/pages/Help.tsx`
- `src/pages/Contact.tsx`
- `src/data/faq.ts`
- `src/hooks/useRecentlyViewedListings.ts`
- `src/hooks/useNotificationPreferences.ts`
- `src/hooks/usePrivacyPreferences.ts`
- `supabase/functions/support-contact/index.ts` (optioneel; mag eerst skip)

**Aangepast**
- `src/App.tsx` — nieuwe routes (lazy)
- `src/layouts/Header.tsx` — sheet links naar nieuwe routes (alleen targets)
- `src/pages/ListingDetail.tsx` — push naar `useRecentlyViewedListings`
- `src/pages/BusinessDashboard.tsx` — Leads/Statistieken-tab uitbouwen, voorraad-filters

## Wat niet wijzigt

- BottomNav, branding, kleuren, design tokens, spacing
- Bestaande Dashboard-pagina blijft als legacy fallback (linkt naar nieuwe pagina's via cards) — geen breaking changes voor bookmarks
- Geen nieuwe AI-features

## Volgorde van uitvoeren

1. Migration (wacht op approval)
2. Prio 1 pagina's + routes + Header-wiring
3. Prio 2 settings
4. Prio 3 dealer-tabs
5. Smoke-test elke route uit de sheet

# Rolafhankelijke instellingennavigatie

## Probleem

`/account/instellingen` en `/zakelijk/instellingen` worden vandaag los van elkaar gerouteerd, maar de keuze tussen beide is verspreid over de codebase met ad-hoc `isDealer ? ... : ...` checks (Header mobiel) en hardcoded links (Header dropdown, BusinessDashboard, dealer Subscription, dealer ListingOperating). De Header dropdown linkt voor dealers nog steeds naar `/account/instellingen`, en geen enkele route blokkeert het tegenovergestelde accounttype — een particulier kan `/zakelijk/instellingen` openen en omgekeerd.

## Aanpak

### 1. Eén centrale helper

Nieuwe file `src/lib/settingsRoute.ts`:
```ts
export type AccountType = 'guest' | 'private' | 'dealer';

export function getAccountType(profile, user): AccountType {
  if (!user) return 'guest';
  return profile?.is_dealer ? 'dealer' : 'private';
}

export const SETTINGS_ROUTE = {
  private: '/account/instellingen',
  dealer:  '/zakelijk/instellingen',
} as const;

export function getSettingsRoute(accountType: AccountType): string {
  return accountType === 'dealer' ? SETTINGS_ROUTE.dealer : SETTINGS_ROUTE.private;
}

export function isSettingsPathAllowed(path: string, accountType: AccountType): boolean {
  if (accountType === 'dealer') return !path.startsWith('/account/'); // alle /account/* settings verboden voor dealer
  return !path.startsWith('/zakelijk');                                // /zakelijk verboden voor particulier
}
```

Bron van waarheid is `useProfile()` (al gekoppeld aan `auth.user` + `profiles.is_dealer`), nooit `location.pathname`.

### 2. Route-guards

Nieuwe component `src/components/SettingsRouteGuard.tsx`:
- Wacht tot `useAuth` + `useProfile` klaar zijn (toon skeleton tijdens load — geen lege pagina).
- Niet-ingelogd → redirect naar `/auth?redirect=<huidig pad>`.
- Bezoekt een dealer `/account/instellingen` (of subroute `/account/profiel|meldingen|privacy|weergave`) → `<Navigate to="/zakelijk/instellingen" replace />`.
- Bezoekt een particulier `/zakelijk/instellingen` → `<Navigate to="/account/instellingen" replace />`.
- Anders: render `children`.

Update `src/App.tsx`:
- Wikkel alle `/account/{instellingen,profiel,meldingen,privacy,weergave}` routes in `<SettingsRouteGuard requires="private">`.
- Wikkel de `/zakelijk` nested `instellingen` route in `<SettingsRouteGuard requires="dealer">`.

Dit beschermt deeplinks, refreshes en directe URL-toegang.

### 3. Hardcoded links vervangen

Vervang **elke** verwijzing naar `/account/instellingen` of `/zakelijk/instellingen` door `getSettingsRoute(accountType)`:

- `src/layouts/Header.tsx` line 158 "Account" mobile link (was: altijd `/account/instellingen`)
- `src/layouts/Header.tsx` line 160 "Instellingen" mobile link (was: inline ternary)
- `src/layouts/Header.tsx` line 272 dropdown "Account" item (was: altijd `/account/instellingen`)
- `src/pages/BusinessDashboard.tsx` line 14 (dealer-only, blijft `/zakelijk/instellingen` via helper)
- `src/pages/dealer/Subscription.tsx` line 193 (idem)
- `src/pages/dealer/ListingOperating.tsx` line 740 (idem)

Daarnaast: verberg in de Header dropdown ook de losse "Account"-link voor dealers — die wijst naar consumer-instellingen. Dropdown krijgt één "Instellingen"-item dat `getSettingsRoute(accountType)` gebruikt. "Mijn advertenties" en "Favorieten" blijven voor beide rollen ongewijzigd (buiten scope).

Mobile sheet: de "Account" rij wordt samengevoegd met "Instellingen" — één item dat altijd naar de juiste settings-route gaat. Voorkomt dat een particulier een "zakelijk" item ziet of vice versa.

### 4. DealerLayout sidebar / BottomNav

Sidebar in `src/layouts/DealerLayout.tsx` (instellingen-link) en `src/components/BottomNav.tsx` / `DesktopNav.tsx` (selectie tussen `consumerNavItems` / `dealerNavItems`) draaien al volledig op `useProfile().isDealer` — geen instellingen-leak. Bevestigen tijdens implementatie en eventueel de sidebar-link via helper laten lopen voor consistentie.

### 5. Regressietests

`src/lib/settingsRoute.test.ts`:
- `getAccountType` returns `guest` / `private` / `dealer` voor de drie scenario's.
- `getSettingsRoute` mapt correct.
- `isSettingsPathAllowed` weigert kruislings.

`src/components/SettingsRouteGuard.test.tsx` met `MemoryRouter`:
- Gast op `/account/instellingen` → redirect naar `/auth`.
- Particulier op `/account/instellingen` → render content.
- Particulier op `/zakelijk/instellingen` → redirect naar `/account/instellingen`.
- Dealer op `/zakelijk/instellingen` → render content.
- Dealer op `/account/instellingen` → redirect naar `/zakelijk/instellingen`.
- Wisselen van rol (mock `useProfile`) → guard re-evalueert en navigeert opnieuw.
- Loading state → toont skeleton, niet redirect (anders flikkering).

`src/layouts/Header.settings.test.tsx`:
- Render Header met dealer-profile → dropdown "Instellingen" link href = `/zakelijk/instellingen`, géén losse consumer "Account"-link met `/account/instellingen`.
- Render Header met particulier-profile → link href = `/account/instellingen`, geen `/zakelijk/...` link zichtbaar.
- Mobile sheet idem.

Mock-strategie: `vi.mock('@/hooks/useProfile')` per test om accounttypes te simuleren zonder Supabase.

## Out of scope

- Andere `/account/*` en `/zakelijk/*` pagina's (advertenties, dashboard, voorraad) — alleen settings-routing wordt rolgescheiden.
- DB-RLS — al correct.
- Nieuwe instellingenfuncties; enkel routing/zichtbaarheid.

## Bestanden

Nieuw: `src/lib/settingsRoute.ts`, `src/lib/settingsRoute.test.ts`, `src/components/SettingsRouteGuard.tsx`, `src/components/SettingsRouteGuard.test.tsx`, `src/layouts/Header.settings.test.tsx`.

Gewijzigd: `src/App.tsx`, `src/layouts/Header.tsx`, `src/pages/BusinessDashboard.tsx`, `src/pages/dealer/Subscription.tsx`, `src/pages/dealer/ListingOperating.tsx`, eventueel `src/layouts/DealerLayout.tsx`.

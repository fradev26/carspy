# Sprint 2 — Fase C: E2E Rooktest

## Kritieke flows (handmatig te verifiëren in preview)

### 1. Register → Login → Logout
- [ ] `/auth` → tab "Registreren" → e-mail/naam/wachtwoord → submit
- [ ] Verwacht: toast "Welkom!" + redirect naar `/`
- [ ] Bevestig profiel-trigger maakte `profiles` row aan (read_query)
- [ ] Logout via header → user state cleared

### 2. Wachtwoord reset
- [ ] `/auth` → "Wachtwoord vergeten?" → e-mail → submit
- [ ] Verwacht: toast "Check je inbox"
- [ ] Mail link → `/wachtwoord-reset?code=...` → nieuw wachtwoord → submit
- [ ] Verwacht: redirect `/auth`, kan inloggen met nieuwe wachtwoord
- [ ] **Ook**: vanuit `/account?tab=...` → "Wachtwoord wijzigen" → zelfde flow
  - ✅ FIX toegepast: redirect was `/auth`, nu `/wachtwoord-reset`

### 3. Listing aanmaken (Sell wizard)
- [ ] `/verkopen` als ingelogde user → 5 stappen → submit
- [ ] Verwacht: listing zichtbaar in `/account/mijn-advertenties` + `/zoeken`
- [ ] Foto-upload werkt (storage bucket `listing-images`)
- [ ] Autosave herstelt na refresh

### 4. Favorite + Compare
- [ ] Listing detail → hart-knop → toast → `/favorieten` toont listing
- [ ] Compare-bar verschijnt bij 2+ → `/vergelijken` toont diff
- [ ] Mobile: CompareBar boven bottom-nav

### 5. Messaging
- [ ] Listing detail → "Bericht versturen" → conversation aangemaakt
- [ ] `/berichten` toont conversation met laatste bericht + unread badge
- [ ] Realtime: bericht in tab A verschijnt live in tab B
- [ ] N+1 fix actief: inbox doet 4 queries (niet ~80) — check Network tab

### 6. Search + filters
- [ ] `/zoeken` → brand filter → URL sync (`?brand=...`)
- [ ] Saved search opslaan → `/account/zoekopdrachten` toont chip
- [ ] Recent searches verschijnen na 1e zoekopdracht

### 7. AI flows (rate-limit verified Sprint 1 D2)
- [ ] Chat widget → bericht → AI antwoord (Flemish tone)
- [ ] Vehicle analysis op listing detail → 5-point rapport
- [ ] Price analysis in BusinessDashboard → analyse-panel

## Automated code-level checks (uitgevoerd ✅)

- ✅ Auth context exporteert `resetPassword` + `updatePassword`
- ✅ Route `/wachtwoord-reset` geregistreerd in `App.tsx`
- ✅ `ResetPassword.tsx` handelt zowel hash (legacy) als `?code=` (PKCE) af
- ✅ `handle_new_user` trigger zet `is_dealer=false` (geen client-trust)
- ✅ Messages inbox: batch queries (4 queries voor N conversations)
- ✅ Bulk actions in BusinessDashboard: `UPDATE ... IN (...)` (geen loop)
- ✅ Edge functions: JWT-auth + rate-limit + Zod via `_shared/ai-guard.ts`

## Found & fixed during smoke check

1. **AccountSettings.resetPassword** had `redirectTo: /auth` → fixed naar `/wachtwoord-reset`
   - Symptoom: user kreeg link, klikte, landde op login-pagina zonder reset-formulier

## Open launch-blockers (Sprint 2 Fase A & B)

- ⏳ A: `useListings` laadt 1000 rijen client-side → server-side filters/paginatie nodig
- ⏳ B: A11y form-labels audit + contrast pass

## Manual verification status

Status: **wachtend op user-side verificatie van flows 1-7 in preview**.
Code-level: **alle paden compileren en zijn intern consistent**.

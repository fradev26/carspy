## Doel
Voeg een "Wachtwoord vergeten" flow toe aan de /auth pagina met email-verzending en een reset-pagina.

## Wijzigingen

### 1. Auth hook (`src/hooks/useAuth.tsx`)
- Voeg `resetPassword(email: string)` toe die `supabase.auth.resetPasswordForEmail()` aanroept met `redirectTo: ${window.location.origin}/wachtwoord-reset`.
- Voeg `updatePassword(password: string)` toe die `supabase.auth.updateUser({ password })` aanroept.

### 2. Login-tab (`src/pages/Auth.tsx`)
- Voeg onder het wachtwoordveld een link "Wachtwoord vergeten?" toe.
- Klik opent een eenvoudig formulier (bijv. binnen de login-tab of als aparte tab) met alleen een emailveld + "Verstuur resetlink" knop.
- Toon een toast bij succes: "Check je inbox voor de resetlink."

### 3. Reset-pagina (`src/pages/ResetPassword.tsx`)
- Nieuwe pagina op route `/wachtwoord-reset`.
- Bij mount: check URL hash op `type=recovery` via `supabase.auth.getSession()` / `onAuthStateChange`.
- Toon formulier met nieuw wachtwoord + bevestiging.
- Bij submit: roep `updatePassword` aan, toast bij succes, navigeer naar `/auth`.
- Toon foutmelding als geen geldige recovery-token aanwezig is.

### 4. Router (`src/App.tsx`)
- Voeg lazy-loaded routes toe:
  - `/wachtwoord-reset` → `ResetPassword`
  - Optioneel: `/wachtwoord-vergeten` als we een aparte pagina willen (ik stel voor om dit inline in Auth te houden voor eenvoud).

## Geen backend wijzigingen nodig
Supabase Auth regelt de email-verzending en token-validatie.
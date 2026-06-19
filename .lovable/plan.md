## Gebruikersbeheer voor dealeraccounts

Een volledig multi-user systeem per dealer: rollen, uitnodigingen via e-mail, RBAC overal afgedwongen en een onveranderbare audit log.

### 1. Datamodel (nieuwe tabellen + enum)

```text
company_role (enum)         : owner | manager | seller | marketing
member_status (enum)        : active | invited | blocked

company_members             1 rij per (company_id, user_id)
  company_id, user_id, role, status, invited_by, invited_at,
  joined_at, last_active_at, deactivated_at

company_invitations         openstaande uitnodigingen
  company_id, email, role, token_hash, invited_by,
  expires_at (= now()+7d), accepted_at, revoked_at, last_sent_at,
  send_count

audit_logs                  append-only (geen UPDATE/DELETE policy)
  company_id, user_id, role_at_time, action, target_table,
  target_id, target_label, metadata jsonb, ip, user_agent, created_at
```

**Solo-company opschalen**: bij eerste invite-actie: als de dealer nog geen `companies`-rij heeft, automatisch er een aanmaken (naam = `dealer_name`) en `profiles.company_id` zetten + `company_members(role=owner)` voor de huidige user. Bestaande dealers met `company_id` krijgen bij eerste bezoek van de pagina een `company_members(owner)`-rij via een idempotente RPC `ensure_company_membership()`.

**Security helpers (SECURITY DEFINER)** in `public`:
- `current_company_id()` → company van auth.uid()
- `has_company_role(_uid, _role)` → boolean
- `is_company_owner(_uid)` → boolean
- `can_manage_users(_uid)`, `can_edit_listings(_uid)`, `can_delete_listings(_uid)`, `can_manage_billing(_uid)`, `can_boost(_uid)`, `can_view_leads(_uid)`

GRANTs per tabel volgens projectregels (authenticated + service_role; geen anon).

### 2. RLS-rewrite

Rol → rechten tabel die wordt afgedwongen in policies:

```text
                  listings   boosts   subs/billing   company   members   audits
owner             RW         RW       RW             RW        RW        R
manager           RW         RW       —              R         R         R
seller            RW eigen   —        —              —         —         —
marketing         R + boost  RW       —              —         —         —
```

Aan te passen policies:
- `listings`: vervang `user_id = auth.uid()` door `company_id = current_company_id() AND can_edit_listings(...)` (seller mag alleen eigen records bewerken/verwijderen).
- `boost_usage`: alleen `can_boost(...)`.
- `dealer_subscriptions`, `companies` (update): alleen owner.
- `vehicle_leads`, `dealer_leads`: zichtbaar voor owner/manager/seller binnen company.
- `autoscout_credentials`, `dealer_inventory_preferences`: owner + manager.
- `messages`, `conversations`: ongewijzigd (gaan over individuele user).
- `audit_logs`: SELECT voor alle leden van company; geen INSERT/UPDATE/DELETE policies — alleen via SECURITY DEFINER RPC `log_audit_event()`.

Admin-bypass blijft via `has_role(uid,'admin')`.

### 3. Uitnodigingsflow

- RPC `invite_member(email, role)` (owner-only): maakt `company_invitations`-rij met `token_hash = encode(digest(random_token,'sha256'),'hex')`, retourneert het ruwe token één keer.
- Edge function `send-member-invite`:
  - controleert RBAC server-side,
  - roept `invite_member` aan,
  - stuurt e-mail via `send-transactional-email` met template `member-invite` (CTA naar `/uitnodiging?token=...`),
  - logt `invited` event.
- `/uitnodiging` pagina:
  - niet-ingelogd → signup met email pre-filled; na auth automatisch accepteren,
  - ingelogd & email matcht → "Accepteren" knop → RPC `accept_invitation(token)` zet status `active`, koppelt user aan company, logt `joined`,
  - verlopen/ingetrokken → duidelijke foutstaten.
- Acties: **opnieuw versturen** (rate-limit 1×/15min, max 5×, vernieuwt expiry), **intrekken**, **verwijderen**.

### 4. E-mailinfra

Lovable Emails opzetten (domeindialoog → `setup_email_infra` → `scaffold_auth_email_templates` voor invite/recovery/etc. + `scaffold_transactional_email` voor app-mails) en één app-template `member-invite` met VATUUR-styling (rose CTA, Inter/Montserrat, `notify.<domein>`). Onboarding van het domein gebeurt via de standaard setup-dialog wanneer de pagina voor het eerst wordt geopend.

### 5. Audit log

- Trigger op `listings` (insert/update/delete/sold), `boost_usage`, `dealer_subscriptions`, `companies`, `company_members`, `company_invitations` → `log_audit_event(...)`.
- Edge-acties (boost start/stop, factuur download, invite verzonden) loggen expliciet via RPC met `ip`/`user_agent` doorgegeven vanuit edge functions (`req.headers`).
- Geen UPDATE/DELETE mogelijk (geen policies + `REVOKE` op authenticated).

### 6. UI – `/zakelijk/gebruikers`

Twee tabbladen binnen één pagina (sub-route in dealer area):

**Tab "Gebruikers"**
- Dashboard-strook: Actieve gebruikers · Openstaande uitnodigingen · Activiteit vandaag · Laatste login · Top medewerker.
- Tabel/cards: avatar, naam, email, rol-badge, status-badge, laatste activiteit (relatieve tijd), datum toegevoegd, kebab-menu (Rol wijzigen, Deactiveren, Opnieuw uitnodigen, Verwijderen — owner-rij is verwijder-disabled).
- "Medewerker uitnodigen" → Sheet wizard (3 stappen: gegevens → rol met permissie-uitleg → bevestiging + verstuurd-state met kopieerlink fallback).
- Bevestigingsdialogen bij Deactiveren/Verwijderen/Rolwijziging.
- Lege staten met illustratie en CTA.

**Tab "Activiteit"**
- Tijdlijn (gegroepeerd per dag) met avatar + actie-icon + samenvatting.
- Filters bovenaan: gebruiker (multi), datum-range, actie-type, voertuig (zoek), categorie (listings/boosts/billing/users/settings).
- Zoekveld over `target_label` + `metadata`.
- Klik op item → Sheet met volledige JSON-details + IP/device.

### 7. RBAC centraal in frontend

- Hook `usePermissions()` haalt huidige rol uit `company_members` (gecached via react-query) en exposeert `canManageUsers`, `canEditListings`, `canDeleteListings`, `canManageBilling`, `canBoost`, `canViewLeads`, `canEditCompany`, `role`.
- Component `<Can do="manageUsers">` voor declaratieve gates.
- Bestaande dealerpagina's (`Settings`, `Inventory`, `Sell`, `Billing`, listing-edit, boost-knoppen) gebruiken deze helpers om knoppen te verbergen/disablen. Geen losse `is_dealer` checks meer voor write-acties.

### 8. Migratie & backwards-compat

- Bestaande dealers blijven werken: bij eerste page-load wordt `ensure_company_membership()` aangeroepen die solo-company en owner-rij idempotent aanmaakt.
- `is_dealer` flag blijft bestaan (markeert b2b-account); rollen worden additioneel.
- Geen data-verlies; alle bestaande RLS-policies krijgen `OR` met de nieuwe helpers tijdens een transitie-migratie zodat eigenaars nooit toegang verliezen.

### 9. Out of scope

- Multi-tenant switcher (één user in meerdere companies) — datamodel ondersteunt het, UI nog niet.
- 2FA/SSO voor medewerkers.
- Granulaire per-listing-permissies.
- Export van audit logs (alleen UI-zicht + filteren).
- Webhook/Slack-notificaties bij audit-events.

### Technische bestanden

- **DB**: 1 migratie (enums, tabellen, helpers, triggers, RLS-rewrites, audit triggers).
- **Edge functions**: `send-member-invite`, `accept-member-invite` (optioneel — kan ook RPC), audit-logging vanuit bestaande functies.
- **E-mail template**: `_shared/transactional-email-templates/member-invite.tsx`.
- **Frontend nieuw**: `src/pages/dealer/Users.tsx`, `src/pages/dealer/Activity.tsx` (of tabs in één), `src/components/dealer/InviteMemberSheet.tsx`, `MemberRow.tsx`, `RoleBadge.tsx`, `StatusBadge.tsx`, `AuditTimeline.tsx`, `AuditDetailsSheet.tsx`, `src/hooks/usePermissions.ts`, `src/components/auth/Can.tsx`, `src/pages/AcceptInvite.tsx`.
- **Frontend wijzigen**: dealer navigatie (link toevoegen), bestaande dealer-pagina's met `<Can>`-gates, listing-mutaties hangen audit-events via bestaande hooks.

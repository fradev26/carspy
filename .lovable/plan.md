# Leads statusworkflow: Nieuw → In behandeling → Afgehandeld

## Doel
Dealers krijgen op `/zakelijk/leads` één uniforme 3-stappenworkflow voor zowel contactaanvragen als berichtenleads (gesprekken). Het bestaande 4-statusmodel (new/contacted/won/lost) wordt volledig vervangen.

## Statusmodel
| Sleutel | Label |
|---|---|
| `new` | Nieuw |
| `in_progress` | In behandeling |
| `done` | Afgehandeld |

## Wijzigingen

### 1. Database (migratie)
- **`dealer_leads.status` migreren:** `contacted` → `in_progress`, `won` en `lost` → `done`. Trigger `_dealer_leads_before_insert` default `'new'` blijft.
- **`conversations`: nieuwe kolom `status text not null default 'in_progress'`** (gesprekken werden tot nu toe als "opgevolgd/in behandeling" getoond, dus die semantiek blijft behouden). Index niet nodig op dit volume.
- **RLS:** `conversations` staat UPDATE nu toe als denied; in plaats van een breed UPDATE-beleid komt een security-definer RPC:
  - `set_conversation_status(_conversation_id uuid, _status text) -> void`
  - Controleert dat `auth.uid()` de `seller_id` van het gesprek is én `_status` in de 3 toegestane waarden valt; anders exception.
  - `revoke all ... from public/anon/authenticated`, `grant execute to authenticated`.
- `dealer_leads` UPDATE-beleid ("Dealers can update own lead status") blijft; client valideert de 3 waarden.

### 2. Hook `src/hooks/useDealerLeads.ts`
- `LeadStatus` wordt `'new' | 'in_progress' | 'done'`.
- `normalizeDealerLead`: fallback van legacy-waarden verwijderen, onbekend → `new`.
- `normalizeConversationLead`: status komt uit `conversations.status` (niet langer hardcoded `contacted`).
- Select van conversations uitbreiden met `status`.

### 3. UI
- **`LeadCard.tsx`:** `STATUS_META` en `STATUS_ORDER` herschrijven naar de 3 statussen (Nieuw = primary, In behandeling = accent, Afgehandeld = muted/success). Dropdown toont de 3 opties; ook gespreksleads krijgen de statusdropdown (nu alleen "Antwoorden").
- **`LeadFilters.tsx`:** tabs worden Alles / Nieuw / In behandeling / Afgehandeld.
- **`Leads.tsx`:** counts aanpassen; `handleStatus` vertakt:
  - `conv-*` leads → RPC `set_conversation_status`.
  - contactaanvragen → update `dealer_leads.status`.
  - De huidige blokkade ("beheer je in Berichten") verdwijnt.
- **`LeadKpiRow.tsx`:** controleren/aanpassen op de nieuwe statussleutels (kijkt nu naar new/won e.d.).
- **`useNewLeadsCount`:** verifiëren dat "nieuwe leads"-telling nog klopt (`status = 'new'`).

### 4. Tests
- Vitest: normalisatie + statusmapping in `useDealerLeads` bijwerken; nieuwe test voor de 3-statusworkflow en de conv/lead-vertakking in `handleStatus`.
- Bestaande leads-/navigatietests op groen houden (131 tests).
- Na deploy: korte E2E-check in preview als Snabba Cars — status wijzigen van een contactaanvraag én van een gesprekslead, filteren per tab.

## Buiten scope
- Afsluitreden (gewonnen/verloren) — bewust weggelaten, puur 3 stappen.
- Lead-notities, toewijzing aan teamleden, e-mailnotificaties bij statuswijziging.

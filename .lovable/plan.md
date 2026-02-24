

# AutoSpy Strategisch Verbeterplan - Implementatie Roadmap

Dit plan vertaalt de strategische analyse naar concrete, uitvoerbare stappen. De implementatie is opgedeeld in 3 fasen die aansluiten bij het document.

---

## Huidige Stand van Zaken

**Wat al gebouwd is:**
- Homepage met uitgebreide zoekfilters (7 categorien, tabbed layout, presets)
- Zoekpagina met sidebar filters, sorteer- en weergaveopties
- Detailpagina met fotogalerij, specificaties, verkoperinfo
- Verkoop-wizard (5 stappen) met foto-upload naar storage
- Dashboard met eigen advertenties
- Favorieten met database-opslag
- Authenticatie (email/wachtwoord) met profielen
- Recente zoekopdrachten (localStorage)

**Wat ontbreekt (volgens analyse):**
- AI chatbot / conversational interface
- Prijsanalyse / marktindicator
- Vergelijkfunctie
- Zoekalerts
- Dealer reviews
- Berichten systeem
- Premium listings / monetisatie

---

## FASE 1 -- Basis Upgrade (Eerste Iteratie)

### 1.1 Marktprijs Indicator op Detailpagina

Een visuele indicator die toont of de vraagprijs boven, onder of rond de marktwaarde ligt.

- Bereken gemiddelde prijs op basis van merk, model, bouwjaar en kilometerstand uit bestaande listings
- Toon een kleur-gecodeerde badge: "Goede deal", "Marktconform", "Boven marktprijs"
- Toon een horizontale balk met de positie van de prijs t.o.v. vergelijkbare auto's

**Bestanden:**
- Nieuw: `src/modules/listings/PriceIndicator.tsx`
- Wijzigen: `src/pages/ListingDetail.tsx` (component toevoegen)
- Wijzigen: `src/data/mockListings.ts` (helper functie voor prijsvergelijking)

### 1.2 Auto Vergelijkfunctie

Gebruikers kunnen 2-3 auto's naast elkaar vergelijken.

- "Vergelijk" knop op ListingCard en ListingDetail
- Vergelijkpagina met kolommen per auto: prijs, km, vermogen, brandstof, features
- State management via React context of URL params
- Maximaal 3 auto's tegelijk

**Bestanden:**
- Nieuw: `src/pages/Compare.tsx`
- Nieuw: `src/hooks/useCompare.tsx` (context voor geselecteerde auto's)
- Wijzigen: `src/modules/listings/ListingCard.tsx` (vergelijk-knop)
- Wijzigen: `src/pages/ListingDetail.tsx` (vergelijk-knop)
- Wijzigen: `src/App.tsx` (route `/vergelijken`)

### 1.3 Zoekalerts (Opgeslagen Zoekopdrachten)

Gebruikers kunnen filters opslaan en worden genotificeerd bij nieuwe matches.

- Database tabel `saved_searches` met filters als JSON en user_id
- UI: "Bewaar zoekopdracht" knop op zoekpagina
- Overzicht van opgeslagen zoekopdrachten in dashboard
- RLS policies zodat gebruikers alleen eigen alerts zien

**Bestanden:**
- Database migratie: `saved_searches` tabel
- Nieuw: `src/hooks/useSavedSearches.ts`
- Wijzigen: `src/pages/Search.tsx` (bewaar-knop)
- Wijzigen: `src/pages/Dashboard.tsx` (tab voor opgeslagen zoekopdrachten)

### 1.4 Verbeterd Berichten Systeem

Directe communicatie tussen kopers en verkopers.

- Database tabel `messages` met conversation threads
- Eenvoudige chat-interface per listing
- Notificatie-indicator in header
- "Stuur bericht" knop op detailpagina koppelen

**Bestanden:**
- Database migratie: `conversations` en `messages` tabellen
- Nieuw: `src/pages/Messages.tsx`
- Nieuw: `src/modules/messages/ConversationList.tsx`
- Nieuw: `src/modules/messages/ChatWindow.tsx`
- Wijzigen: `src/pages/ListingDetail.tsx` (bericht knop functioneel)
- Wijzigen: `src/layouts/Header.tsx` (berichten-indicator)
- Wijzigen: `src/App.tsx` (route `/berichten`)

---

## FASE 2 -- AI Integratie

### 2.1 AI Chatbot (Conversational Marketplace Agent)

De kern van de differentiatie. Een persistent chatwidget dat overal beschikbaar is.

**Mogelijkheden:**
- Natuurlijke taal zoeken: "Ik zoek een zwarte BMW onder 25k met automaat"
- Prijsadvies: "Is deze prijs realistisch?"
- Koopadvies op basis van behoeften
- Auto vergelijken via chat

**Architectuur:**
- Backend edge function `chat` die Lovable AI (Gemini) aanspreekt
- System prompt met kennis over alle filters, merken, modellen
- Tool-calling voor database queries (zoeken, filteren)
- Streaming responses voor snelle UX

**Bestanden:**
- Nieuw: `supabase/functions/chat/index.ts` (edge function)
- Nieuw: `src/modules/chat/ChatWidget.tsx` (floating chat button + panel)
- Nieuw: `src/modules/chat/ChatMessage.tsx`
- Nieuw: `src/hooks/useChat.ts`
- Wijzigen: `src/layouts/AppLayout.tsx` (chatwidget toevoegen)
- Wijzigen: `supabase/config.toml` (function configuratie)

### 2.2 AI Advertentie Generator

Bij het verkopen kan AI automatisch een professionele beschrijving genereren.

- Knop "Genereer beschrijving met AI" in de verkoop-wizard (stap 4)
- Edge function die op basis van merk, model, jaar, km, features een beschrijving maakt
- Suggesties voor ideale vraagprijs

**Bestanden:**
- Nieuw: `supabase/functions/generate-listing/index.ts`
- Wijzigen: `src/pages/Sell.tsx` (AI knop in beschrijving stap)

### 2.3 Slimme Prijsindicatie met AI

Uitbreiding van de marktprijs indicator met AI-analyse.

- AI analyseert vergelijkbare listings en geeft uitgebreider advies
- "Waarom is dit een goede deal?" uitleg

**Bestanden:**
- Nieuw: `supabase/functions/price-analysis/index.ts`
- Wijzigen: `src/modules/listings/PriceIndicator.tsx`

---

## FASE 3 -- Differentiatie en Monetisatie

### 3.1 Dealer Dashboard met Analytics

- Uitgebreid dashboard voor dealer accounts
- Statistieken: views, favorieten, berichten per listing
- Conversie data en trends

### 3.2 Premium Listings

- Database veld `is_premium` / `boost_until` op listings tabel
- Visueel onderscheid (highlight, "Top" badge)
- Betaling via Stripe integratie

### 3.3 Dealer Reviews

- Database tabel `reviews` met rating en tekst
- Weergave op detailpagina en dealer profiel
- Alleen kopers die contact hadden kunnen reviewen

### 3.4 Trust & Verificatie

- Verificatie badges voor dealers
- Risico-score per advertentie (AI-based)
- Integratie-ready voor Car-Pass/RDW

---

## Database Migraties (Fase 1)

```text
saved_searches:
  - id (uuid, PK)
  - user_id (uuid, NOT NULL)
  - name (text)
  - filters (jsonb, NOT NULL)
  - created_at (timestamptz)
  - last_notified_at (timestamptz)

conversations:
  - id (uuid, PK)
  - listing_id (uuid, NOT NULL)
  - buyer_id (uuid, NOT NULL)
  - seller_id (uuid, NOT NULL)
  - created_at (timestamptz)
  - updated_at (timestamptz)

messages:
  - id (uuid, PK)
  - conversation_id (uuid, FK -> conversations)
  - sender_id (uuid, NOT NULL)
  - content (text, NOT NULL)
  - read_at (timestamptz)
  - created_at (timestamptz)
```

---

## Aanbevolen Startvolgorde

1. **Marktprijs Indicator** -- Snel te bouwen, grote waarde
2. **Vergelijkfunctie** -- Uniek verkooppunt
3. **AI Chatbot** -- De echte gamechanger
4. **Berichten systeem** -- Essentieel voor conversie
5. **Zoekalerts** -- Terugkerende gebruikers
6. **AI Advertentie Generator** -- Verkopers helpen
7. **Dealer features & monetisatie** -- Verdienmodel

Wil je starten met een specifieke fase of onderdeel?




## Plan: VATUUR. volledig AI-wired maken

### Overzicht
De AI-chat wordt van een klein floating widget naar een prominente, altijd-zichtbare interface getransformeerd. Daarnaast wordt de AI-assistent verrijkt met kennis over alle site-functies en wordt er een AI-analyseknop toegevoegd op elke ListingCard.

---

### 1. Prominente AI-chatbar op de homepage (vervangt het floating widget)

**Bestand: `src/pages/Index.tsx`**
- Voeg een grote, prominente AI-chatbalk toe **direct onder de hero-sectie** — vergelijkbaar met een ChatGPT-achtige interface
- De balk bevat een groot inputveld met suggestie-chips eronder ("Ik zoek een gezinsauto onder €20k", "Vergelijk BMW vs Audi", etc.)
- Wanneer de gebruiker een vraag stelt, schuift een chatvenster open (inline op de pagina, niet als popup)
- Titel/branding: "Vraag het aan VATUUR. AI — jouw slimste auto-assistent"

**Bestand: `src/modules/chat/AIChatSection.tsx`** (nieuw)
- Herbruikbare component: groot inputveld + suggesties + inline chatvenster
- Hergebruikt `useChat` hook
- Responsief: volledige breedte op mobiel, gecentreerd op desktop
- Bevat de suggestie-chips en toont streaming antwoorden met markdown

### 2. AI-chat prominent op zoekpagina

**Bestand: `src/pages/Search.tsx`**
- Voeg bovenaan de zoekresultaten een compacte AI-balk toe: "Beschrijf wat je zoekt en laat AI de filters instellen"
- Input stuurt naar dezelfde `useChat` hook
- De AI kan zoeksuggesties geven die direct als filters worden toegepast

### 3. AI-knop op elke ListingCard

**Bestand: `src/modules/listings/ListingCard.tsx`**
- Voeg een klein AI-icoon (Sparkles) toe naast de favoriet/vergelijk-knoppen op de image overlay
- Bij klik opent een compact modal/popover dat de `price-analysis` edge function aanroept voor dat specifieke voertuig
- Toont: samenvatting, details en tips (zelfde structuur als PriceIndicator AI-analyse)

**Bestand: `src/modules/listings/AIAnalysisModal.tsx`** (nieuw)
- Dialog component die een snelle AI-analyse toont voor een willekeurig voertuig
- Roept `price-analysis` edge function aan
- Toont loading state, resultaat met summary/details/tips

### 4. Floating widget behouden maar minder prominent

**Bestand: `src/modules/chat/ChatWidget.tsx`**
- Op de homepage: verberg het floating widget (de inline sectie neemt het over)
- Op andere pagina's: behoud als kleinere floating button rechtsonder, maar met subtielere styling

**Bestand: `src/layouts/AppLayout.tsx`**
- Geef de huidige route door zodat ChatWidget weet of het op de homepage is

### 5. System prompt uitbreiden met volledige site-kennis

**Bestand: `supabase/functions/chat/index.ts`**
- Hernoem "AutoSpy AI" → "VATUUR. AI"
- Voeg kennis toe over:
  - Zoekfunctie: alle beschikbare filters (merk, model, prijs, bouwjaar, km-stand, brandstof, transmissie, carrosserie, kleur, vermogen, locatie, etc.)
  - Vergelijkfunctie: tot 3 auto's vergelijken
  - Advertentie plaatsen: stappen en vereisten
  - Prijsindicator: hoe de marktanalyse werkt
  - Favorieten en opgeslagen zoekopdrachten
  - Dealerregistratie en zakelijk dashboard
  - Navigatie-instructies (verwijs naar correcte URL-paden)

### 6. AI-analyse op detailpagina verbeteren

**Bestand: `src/pages/ListingDetail.tsx`**
- Voeg een prominente "VATUUR. AI Analyse" kaart toe in de sidebar (desktop) en boven de contactknoppen (mobiel)
- Eén-klik analyse die automatisch het volledige voertuig analyseert (niet alleen prijs, maar ook betrouwbaarheid, onderhoudskosten, geschiktheid)

**Bestand: `supabase/functions/vehicle-analysis/index.ts`** (nieuw)
- Bredere AI-analyse dan alleen prijs: betrouwbaarheid, veelvoorkomende problemen, onderhoudskosten, geschiktheid voor doelgroepen
- Gebruikt dezelfde Lovable AI gateway

**Bestand: `supabase/config.toml`**
- Voeg `[functions.vehicle-analysis]` toe met `verify_jwt = false`

---

### Bestanden overzicht

| Bestand | Wijziging |
|---------|-----------|
| `src/modules/chat/AIChatSection.tsx` | Nieuw: prominente inline AI-chat component |
| `src/modules/listings/AIAnalysisModal.tsx` | Nieuw: AI-analyse popup per voertuig |
| `src/pages/Index.tsx` | AI-chatsectie toevoegen onder hero |
| `src/pages/Search.tsx` | Compacte AI-balk bovenaan resultaten |
| `src/modules/listings/ListingCard.tsx` | AI-analyseknop op kaart |
| `src/pages/ListingDetail.tsx` | Prominente AI-analysekaart in sidebar |
| `src/modules/chat/ChatWidget.tsx` | Verbergen op homepage |
| `src/layouts/AppLayout.tsx` | Route-info doorgeven |
| `supabase/functions/chat/index.ts` | System prompt updaten naar VATUUR. AI met volledige site-kennis |
| `supabase/functions/vehicle-analysis/index.ts` | Nieuw: brede voertuiganalyse edge function |
| `supabase/config.toml` | Vehicle-analysis function toevoegen |




## Plan: AI Chat kan auto's van de website voorstellen

### Probleem
De AI-chat heeft momenteel geen toegang tot de daadwerkelijke advertenties op het platform. Hij kan alleen algemeen advies geven, maar geen specifieke auto's tonen die op VATUUR. staan.

### Aanpak
De chat edge function uitbreiden zodat hij bij elke request de relevante listings uit de database ophaalt en als context meegeeft aan het AI-model. De ChatMessage component uitbreiden om gestructureerde autokaarten te renderen wanneer de AI auto's voorstelt.

### Wijzigingen

**1. `supabase/functions/chat/index.ts`**
- Supabase client aanmaken met `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` (beide al beschikbaar als secrets)
- Bij elke chat-request de actieve listings ophalen uit de database (max 50, relevante velden: id, title, brand, model, year, price, mileage, fuel_type, transmission, body_type, color, power, city, province, images)
- Deze listings als gestructureerde context toevoegen aan het system prompt
- System prompt updaten: instrueer de AI om bij het voorstellen van auto's een speciaal markdown-formaat te gebruiken met een link naar `/auto/{id}`, zodat de frontend dit kan herkennen en als klikbare kaart kan renderen

**2. `src/modules/chat/ChatMessage.tsx`**
- Markdown-links naar `/auto/{id}` herkennen en renderen als compacte autokaarten (thumbnail, titel, prijs, km-stand)
- Gebruik `react-markdown` custom components om `[link](/auto/id)` om te zetten naar een visuele kaart met `react-router-dom` `Link`

**3. `src/hooks/useChat.ts`**
- Geen wijzigingen nodig — de streaming logica blijft hetzelfde

### Technische details

- De edge function haalt max 50 actieve listings op en stuurt een beknopte samenvatting mee (id, titel, prijs, km-stand, brandstof, transmissie, locatie) als JSON in het system prompt
- Het AI-model krijgt instructies om bij het voorstellen van een auto altijd het formaat `[Auto Titel - €prijs](/auto/id)` te gebruiken
- In ChatMessage wordt de `a`-component van ReactMarkdown overschreven: als de href begint met `/auto/`, render een mini-kaart met afbeelding en specs in plaats van een gewone link
- De listings-data wordt gecached in het system prompt per request (geen aparte API call vanuit de frontend)


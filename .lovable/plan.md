

## Plan: AI-analyse toevoegen aan de verkoopwizard

### Aanpak
Op stap 4 (Overzicht) een "AI Analyse" sectie toevoegen die automatisch de `vehicle-analysis` edge function aanroept met de ingevulde formulierdata. De verkoper ziet dan direct een analyse van zijn eigen wagen (betrouwbaarheid, aandachtspunten, onderhoud, geschiktheid, samenvatting) voordat hij publiceert.

### Wijzigingen

**`src/pages/Sell.tsx`**

1. State toevoegen voor de analyse: `analysisResult`, `analysisLoading`, `analysisError`
2. Een `fetchAnalysis` functie die de `vehicle-analysis` edge function aanroept met de formulierdata als listing-object
3. Bij het betreden van stap 4 (`currentStep === 4`) automatisch de analyse triggeren via `useEffect`
4. Onder het bestaande "Controleer je gegevens" overzicht een AI-analyse blok renderen met:
   - Loading state (spinner)
   - Error state met retry-knop
   - Resultaat: betrouwbaarheid, aandachtspunten (bullets), onderhoudskosten, geschiktheid, samenvatting
   - Visueel consistent met de bestaande `AIAnalysisModal` styling (score ring, badges, iconen)

### Geen andere bestanden nodig
De `vehicle-analysis` edge function bestaat al en accepteert exact de data die het formulier bevat. Geen database- of backend-wijzigingen nodig.




## Plan: Vlaamse taal en stijl doorvoeren in alle AI-functies

### Overzicht
De drie AI edge functions (`chat`, `price-analysis`, `vehicle-analysis`) updaten met het Vlaamse taalprofiel en de gedetailleerde analysestructuur die je beschreef.

### Wijzigingen

**1. `supabase/functions/chat/index.ts`** — System prompt herschrijven
- "Belgische tweedehandsmarkt" i.p.v. "Benelux"
- Vlaams Nederlands: "wagen", "km-stand", "sterke deal", "stadsverkeer", "autosnelweg"
- Vermijd NL-Nederland termen ("uitstekende koop", "kilometerstand", "voertuig", "rijden op de snelweg")
- Stijl: professioneel maar toegankelijk, eerlijk koopadvies, Belgische context (files, BIV, keuring)
- Europrijzen en Belgische rijcontext

**2. `supabase/functions/price-analysis/index.ts`** — Prompt volledig herschrijven
- Prompt omzetten naar Vlaams expertperspectief
- JSON-structuur behouden maar veldnamen/instructies in Vlaams formuleren
- Instructie: schrijf als een ervaren Vlaamse auto-expert, kort en geloofwaardig
- Vermijd overdreven marketingtaal

**3. `supabase/functions/vehicle-analysis/index.ts`** — Prompt herschrijven
- Verwijder "Nederlandse markt" referenties → "Belgische tweedehandsmarkt (Vlaanderen)"
- Analysestructuur aanpassen naar de 5 secties: Betrouwbaarheid (score/10), Aandachtspunten, Onderhoud (€/jaar), Geschikt voor, Samenvatting
- Alle output in Vlaams Nederlands

### Geen frontend-wijzigingen nodig
De UI-componenten (`AIAnalysisModal`, `ChatMessage`) renderen de data dynamisch — alleen de backend-prompts veranderen.


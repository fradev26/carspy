

## Plan: Verwijder AI-knop van ListingCard

### Bestand: `src/modules/listings/ListingCard.tsx`

1. Verwijder de `Sparkles` import
2. Verwijder de `aiModalOpen` state
3. Verwijder de AI Analysis `Button` (de knop met het Sparkles-icoon op positie `top-[6.5rem]`)
4. Verwijder de `<AIAnalysisModal>` component render (in beide variants: default en horizontal)
5. Verwijder de `AIAnalysisModal` import

Dit schuift de vergelijk-knop en favorieten-knop dichter bij elkaar en maakt de kaart schoner.


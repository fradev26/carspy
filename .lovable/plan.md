# Emoji-vrije UI/UX audit

Doel: alle emoji-unicode uit zowel UI, AI-prompts als gegenereerde content verwijderen en vervangen door Lucide-iconen, badges of tekst-labels. Premium B2B-uitstraling, geen visuele speelsheid.

## Scope (39 vindplaatsen, gegroepeerd)

### 1. AI / backend prompts & gegenereerde tekst
- `supabase/functions/chat/index.ts` (regels 87, 156): instructies "gebruik emoji's spaarzaam" → vervangen door **"Gebruik geen emoji's. Gebruik korte zinnen en bullet points."**
- `supabase/functions/_shared/dealer-summary.ts` (regels 108, 113, 117, 131, 134, 137): emoji-prefixes (📦 📈 💰 🏆 💬 🚀) uit insights verwijderen. Tonen worden bepaald door de bestaande `tone`-veld (success/warning/info), niet door emoji.
- `src/hooks/useChat.ts` (148): "⚠️ {error}" → enkel de errortekst. Visuele waarschuwing zit al in `ChatMessage`-styling; eventueel via een `AlertTriangle`-icoon in de bubble (out of scope qua component, dus alleen tekst opschonen).

### 2. SalesAI-dashboard
- `src/pages/dealer/SalesAI.tsx`:
  - Regel 83: `👋` na begroeting weghalen.
  - Regel 100: `⚠️ Vraagt aandacht` → `<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />` + tekst.
- `src/components/dealer/salesai/InsightList.tsx` (7): `📊 Inzichten vandaag` → `<BarChart3 />` icoon + tekst.
- `src/modules/chat/ChatMessage.tsx` (125): `✅ Je gegevens werden doorgestuurd…` → `<CheckCircle2 />` icoon + tekst.

### 3. Listings / marketplace
- `src/data/mockListings.ts` (973–980): brand-logo's staan op `🚗`. Vervangen door `null` of leeg, en op consumptieplekken (CategoryGrid e.d.) fallback naar `<Car />` Lucide-icoon renderen.
- `src/modules/listings/ListingGrid.tsx` (21): empty state `🚗` → `<Car className="h-12 w-12 text-muted-foreground" />`.
- `src/pages/ListingDetail.tsx` (897): `✓ {s}` features → `<Check className="h-3.5 w-3.5 text-success" />` + tekst.

### 4. Vergelijken & dealers-tabel
- `src/pages/Compare.tsx` (137): Badge met `✓` → `<Check className="h-3 w-3" />` in de badge.
- `src/pages/Dealers.tsx` (112–124, 433): vergelijktabel met `'✓'` en `'—'` waarden. Renderlogica (regel 433) al conditional; vervangen door:
  - `'✓'` waarde → `<Check className="h-4 w-4 text-success" />`
  - `'—'` waarde → `<Minus className="h-4 w-4 text-muted-foreground" />`
  De data-array houden we als boolean (`true` / `false`) of als enum-string die we mappen.

### 5. Chat-onboarding
- `src/modules/chat/ChatWidget.tsx` (75, 76): `👋 Hallo!` / `👋 Hoi!` → wave-emoji droppen; openingstekst start direct met "Hallo!".
- `src/modules/chat/AIChatSection.tsx` (145): `✓` span → `<Check className="h-3.5 w-3.5 text-primary" />`.

### 6. Auth / land-keuze
- `src/pages/Auth.tsx` (250): `🇧🇪 België` / `🇳🇱 Nederland` → vlaggen verwijderen; alleen tekst (`'België'`, `'Nederland'`). Geen vlag-SVG toevoegen (out of scope).

### 7. Sell-flow
- `src/pages/Sell.tsx` (378): toast `'Beschrijving gegenereerd ✨'` → `'Beschrijving gegenereerd'`. Sonner-toast krijgt al een icoon via variant.

## Globale verificatie
Na de wijzigingen één keer draaien:
```bash
rg -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{1F000}-\x{1F2FF}]" -g '!*.lock' -g '!dist' -g '!node_modules' .
```
Verwacht: 0 resultaten. Indien rest → in dezelfde sweep opruimen.

## Niet in scope
- Componentstructuur of layout van pagina's wijzigen.
- Nieuwe vlag-SVG's of brand-logo-assets toevoegen (brand-logo wordt generieke `Car`-icoon).
- Backend-businesslogica (alleen tekst in prompts/insights).
- SalesAI JSON-contract; we voegen wel `"Gebruik geen emoji's"` toe aan beide system prompts in `chat/index.ts`.

## Bestanden die bewerkt worden
- `supabase/functions/chat/index.ts`
- `supabase/functions/_shared/dealer-summary.ts`
- `src/hooks/useChat.ts`
- `src/pages/dealer/SalesAI.tsx`
- `src/components/dealer/salesai/InsightList.tsx`
- `src/modules/chat/ChatMessage.tsx`
- `src/modules/chat/ChatWidget.tsx`
- `src/modules/chat/AIChatSection.tsx`
- `src/data/mockListings.ts` + consumer (CategoryGrid indien `logo` gerenderd wordt — checken bij implementatie)
- `src/modules/listings/ListingGrid.tsx`
- `src/pages/ListingDetail.tsx`
- `src/pages/Compare.tsx`
- `src/pages/Dealers.tsx`
- `src/pages/Auth.tsx`
- `src/pages/Sell.tsx`

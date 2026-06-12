Voeg een "Ontdek op categorie" sectie toe op de homepage, tussen de mobile AI search en "Uitgelichte advertenties".

## Implementatie

1. Nieuw component `src/components/home/CategoryGrid.tsx` met 8 categorieën die elk linken naar `/zoeken` met de juiste query params:
   - Hatchbacks → `?bodyType=hatchback`
   - SUV's → `?bodyType=suv`
   - Sedans → `?bodyType=sedan`
   - Elektrisch → `?fuelType=elektrisch`
   - Budget < €10.000 → `?maxPrice=10000`
   - Nieuw aanbod → `?sort=newest`
   - Populair → `?sort=popular`
   - Sportief → `?bodyType=coupe`
   
   Elke categorie gebruikt een Lucide icoon (Car, Truck, CarFront, Zap, PiggyBank, Sparkles, Flame, Gauge) — geen emoji's, conform design system.

2. Layout:
   - Mobile: `grid grid-cols-2 gap-3` (4 rijen × 2 kolommen)
   - Desktop: `grid grid-cols-4 gap-4` (2 rijen × 4 kolommen)
   - Kleine intro tekst boven de grid: "Of ontdek snel op categorie"

3. Card-styling (liquid-glass, matching listing buttons):
   - `bg-card/80 backdrop-blur-sm border border-border/60`
   - `rounded-xl p-4 flex flex-col items-center gap-2`
   - Icoon `h-6 w-6 text-primary` boven label
   - Hover: `hover:scale-[1.02] hover:border-primary/40 hover:shadow-md transition-all`
   - `active:scale-95`

4. Integratie in `src/pages/Index.tsx`: rendert tussen de mobile AI search sectie (~line 289) en de "Uitgelichte advertenties" sectie. Wrap in een eigen `<section className="bg-background py-6 md:py-10">` met container.

## Visueel resultaat

Een compacte, premium category-grid die gebruikers zonder concrete zoekintentie direct laat starten, met liquid-glass cards die aansluiten op de rest van het design system.
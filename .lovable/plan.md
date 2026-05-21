# Hero stabiliseren bij wissel van zoekmodus

## Probleem
De hero-sectie in `src/pages/Index.tsx` gebruikt `min-h-[...]` op de `<section>` en de `HeroSearch` container reserveert maar `min-h-[140px] md:min-h-[88px]`. De klassieke zoekbalk (mobile: 3 selects + buttonrij ≈ 250px, desktop: 56px) is hoger dan de slimme zoekbalk. Bij het switchen groeit of krimpt de sectie, waardoor `object-cover` op de achtergrondafbeelding een andere crop kiest → zichtbare "jump"/zoom.

## Fix
Eén stabiele hoogte reserveren voor het zoekblok zodat de hero-sectie nooit van hoogte verandert tussen modi. De achtergrondafbeelding en overlay blijven exact zoals ze zijn.

### Wijziging 1 — `src/modules/search/HeroSearch.tsx`
Vervang de reserved-height wrapper:

```tsx
<div className="w-full min-h-[140px] md:min-h-[88px]">
```

door een **vaste** hoogte die de grootste van beide modi accommodeert, met absolute positioning per modus zodat de container nooit groeit:

```tsx
<div className="relative w-full h-[280px] sm:h-[260px] md:h-[72px]">
  {mode === 'smart' ? (
    <div key="smart" className="absolute inset-0 animate-fade-in">
      <SmartSearchBar variant="hero" />
    </div>
  ) : (
    <div key="classic" className="absolute inset-0 animate-fade-in">
      <ClassicHeroSearch />
    </div>
  )}
</div>
```

Hoogtes gekozen op basis van de klassieke variant (grootste):
- mobile (`< sm`): 280px (3 selects à 44px + buttonrij 44px + 3×gap 8px + padding 24px ≈ 252px, marge naar 280)
- `sm` / `md` portrait: 260px (idem, iets compacter)
- `md+` desktop: 72px (pill-row is 56px hoog, + ademruimte)

### Wijziging 2 — `src/pages/Index.tsx` (regel 71)
Sectie hoogte hoeft niet aangepast (de `min-h` is al groter dan de inhoud). Dankzij de vaste wrapper-hoogte verandert de totale content-hoogte niet meer tussen modi, dus `min-h-[560px] sm:min-h-[620px] lg:min-h-[720px]` blijft consistent. Geen aanpassing nodig.

## Waarom dit werkt
- De `<section>` heeft een minimumhoogte; zolang de inhoud die niet overschrijdt, blijft de sectie exact even groot.
- Door de zoekmodi in een container met **vaste** (`h-[...]`) hoogte te plaatsen i.p.v. `min-h`, kan de content nooit groeien.
- `absolute inset-0` op de twee modusvarianten zorgt dat ze elkaar overlappen i.p.v. de container te rekken.
- Het `<img>` element heeft `absolute inset-0 h-full w-full object-cover` op section-niveau — niets daarvan verandert.

## Risico's / edge cases
- Als de klassieke balk op een tussenbreakpoint toch hoger uitvalt dan gereserveerd → kan overlappen. Hoogtes zijn ruim genoeg gekozen.
- De SmartSearchBar staat verticaal gecentreerd binnen de grotere mobile wrapper; dit voelt natuurlijk doordat beide modi `absolute inset-0` zijn en hun eigen inhoud bovenaan plaatsen.

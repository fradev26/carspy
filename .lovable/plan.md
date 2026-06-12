## Doel
De huidige actieve-tab indicator in `src/components/BottomNav.tsx` (een klein rood puntje onderaan de tab, onder het label) vervangen door een premium liquid-glass squircle die past bij het VATUUR design system en visueel familie is van de berichtenknop rechtsboven in de header.

## Scope
Uitsluitend `src/components/BottomNav.tsx`. Geen wijzigingen aan hoogte, iconen, labels, spacing of routing.

## Wijzigingen

### 1. Plaatsing herstructureren
Huidige structuur:
```
icon
label
[• puntje absoluut onderaan]
```
Nieuwe structuur:
```
icon
[glass indicator]  ← direct onder icoon, boven label
label
```

De indicator komt in de normale flow tussen icoon en label te staan (of als absolute element tussen die twee), nooit onder het label.

### 2. Visuele stijl (liquid glass)
Klein squircle-element (16×16px, `rounded-md` = 10px volgens onze radius scale, matching de header berichtenknop):
- Semi-transparante witte achtergrond: `bg-white/40 dark:bg-white/10`
- Backdrop blur: `backdrop-blur-md`
- Subtiele border: `border border-white/50 dark:border-white/15`
- Zachte shadow: `shadow-sm shadow-primary/20`
- Binnenin gecentreerd een kleine rode kern: 6×6px `rounded-full bg-primary` met lichte glow (`shadow-[0_0_6px_hsl(var(--primary)/0.5)]`)

Inactieve tabs renderen geen indicator (placeholder met `h-4` om verticale shift te voorkomen — of de indicator krijgt `opacity-0` zodat de layout stabiel blijft).

### 3. Animatie
- Verschijnen: `animate-scale-in` (bestaand, 200ms ease-out) of inline `transition-all duration-200`.
- Geen bounce, geen spring. Simpele opacity + scale transitie zodat het wisselen tussen tabs vloeiend voelt.
- Optioneel: bij hover op niet-actieve tab een zeer subtiele preview (opacity 0 → 30%). Standaard niet, om het clean te houden.

### 4. AI-knop ongewijzigd
De center AI-knop heeft geen actieve indicator nodig (is altijd een actieknop) — geen wijziging.

## Technische details
- Verwijder de huidige `<div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary animate-scale-in" />`.
- Voeg tussen `<item.icon />` en `<span>{label}</span>` een conditional in:
  ```tsx
  <div className={cn(
    "h-4 w-4 rounded-md flex items-center justify-center transition-all duration-200",
    isActive
      ? "bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/15 shadow-sm shadow-primary/20 scale-100 opacity-100"
      : "scale-75 opacity-0"
  )}>
    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
  </div>
  ```
- De `relative`/`absolute` wrapper rond het icoon kan vervallen voor de indicator (niet meer nodig).
- Behoud `text-primary` op het icoon en label bij actief — kleurherkenning blijft dubbel ondersteund.

## Verificatie
- Preview op mobile viewport (`/zoeken`, `/`, `/favorieten`) controleren: indicator zit netjes tussen icoon en label, glas-effect zichtbaar, geen layout shift bij tab-wissel, animatie soepel (~200ms, geen bounce).
- Donkere modus check.

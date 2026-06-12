## Doel
Verwijder de losse indicator en maak de actieve bottomnav-tab één samenhangende liquid-glass pill die zowel icoon als label omsluit.

## Scope
Uitsluitend `src/components/BottomNav.tsx`. Geen wijziging aan hoogte van de nav, iconen, labels, routing of de center AI-knop.

## Wijzigingen

### 1. Verwijderen
- De huidige glass-squircle `<div>` met rode kern tussen icoon en label verdwijnt volledig.
- Geen losse puntjes of indicatoren meer.

### 2. Nieuwe actieve staat: pill om icoon + label
De `<Link>` zelf wordt het glass-element. Layout binnen de link blijft `flex flex-col items-center` met icoon boven label, maar krijgt padding en achtergrond als de tab actief is.

Actief:
- `bg-white/50 dark:bg-white/10`
- `backdrop-blur-md`
- `border border-white/60 dark:border-white/15`
- `shadow-sm shadow-primary/15`
- `rounded-xl` (= 14px, matched aan onze radius scale en header berichtenknop)
- `text-primary` op icoon + label
- Lichte schaalverhoging niet nodig — pill is herkenbaar door de glass-achtergrond.

Inactief:
- Volledig transparant
- `text-muted-foreground`
- Geen border, geen shadow

### 3. Maatvoering & layout
- Bottomnav-rij blijft `h-16`. De pill krijgt verticaal `py-1` en horizontaal `px-2`, en wordt binnen een wrapper van `h-14` gecentreerd zodat de hoogte van de nav niet verandert.
- Elke tab-cel behoudt `w-full` zodat de spacing identiek blijft; de pill vult de cel met een kleine inner margin (`mx-1`) zodat actieve tabs visueel iets prominenter ogen zonder layout-shift voor naburige tabs.
- `gap-0.5` tussen icoon en label voor compacte verticale ritmiek.

### 4. Animatie
- `transition-all duration-200 ease-out` op de `<Link>` zodat background, border en shadow soepel infaden bij activatie.
- Geen layout-animatie (we vermijden `framer-motion`/shared-layout om complexiteit te beperken). De fade van de glass-achtergrond + kleurwissel geeft het gewenste "selectie verschuift" gevoel zonder bounce of spring.
- Active-press feedback: `active:scale-[0.97]` voor tactiele respons.

### 5. AI center-knop ongewijzigd
De ronde rode AI-knop in het midden blijft exact zoals nu.

## Technische details
Binnen de map in `BottomNav.tsx` wordt de `<Link>` zo opgebouwd:

```tsx
<Link
  to={path}
  aria-current={isActive ? 'page' : undefined}
  className={cn(
    'flex flex-col items-center justify-center gap-0.5 mx-1 my-2 px-2 rounded-xl transition-all duration-200 ease-out h-12 flex-1',
    isActive
      ? 'bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 shadow-sm shadow-primary/15 text-primary'
      : 'text-muted-foreground active:scale-[0.97]'
  )}
>
  <item.icon className="h-5 w-5" />
  <span className="text-[10px] font-medium leading-none">{item.label}</span>
</Link>
```

De buitenste rij blijft `flex items-center justify-around h-16` zodat AI-knop en tabs uitgelijnd blijven.

## Verificatie
- Preview op mobile (`/`, `/zoeken`, `/favorieten`): actieve tab toont één glass pill, geen los puntje of squircle meer, hoogte van nav onveranderd, geen layout-shift bij wissel, fade van achtergrond voelt premium.
- Donkere modus en safe-area (iOS) check.

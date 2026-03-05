

## Plan: Header verbergen tot voorbij hero gescrold

### Wat verandert er
Op de homepage is de header volledig onzichtbaar (opacity 0, pointer-events none) totdat de gebruiker voorbij de hero-sectie scrolt. Dan schuift de header met een vloeiende animatie in beeld als solid bar. Op alle andere pagina's blijft de header altijd zichtbaar en solid.

### Technische aanpak

**Bestand: `src/layouts/Header.tsx`**

1. Voeg een `visible` state toe naast `scrolled`:
   - Op homepage: header is onzichtbaar (`opacity-0`, `pointer-events-none`, `-translate-y-full`) totdat `window.scrollY > 300` (ca. hoogte hero sectie)
   - Op andere pagina's: header is altijd zichtbaar
   
2. Scroll threshold verhogen van 50 naar ~300px (hoogte van de hero) voor de homepage visibility trigger

3. CSS classes toevoegen:
   - Onzichtbaar: `opacity-0 -translate-y-full pointer-events-none`
   - Zichtbaar: `opacity-100 translate-y-0 pointer-events-auto`
   - Bestaande `transition-all duration-300` zorgt voor vloeiende animatie

### Wijzigingen samengevat

```
Header.tsx:
- scrolled threshold → ~300px voor visibility op homepage
- Nieuwe `isVisible` variabele: `!isHomepage || scrolled`
- Header krijgt conditionele classes voor opacity + translate + pointer-events
- Wanneer zichtbaar: altijd solid (bg-card/95 + blur + border)
- Wanneer onzichtbaar: volledig transparant en niet-klikbaar
```


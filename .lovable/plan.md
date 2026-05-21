# Horizontaal scrollen uitschakelen op mobiel

Doel: voorkomen dat de pagina op mobiele apparaten zijwaarts kan scrollen. Alle content blijft binnen de viewport breedte.

## Aanpak

Globale CSS-fix in `src/index.css` die op kleine schermen horizontaal overflow blokkeert en breedte begrenst tot 100vw.

```css
@media (max-width: 768px) {
  html, body {
    overflow-x: hidden;
    max-width: 100vw;
  }
  #root {
    overflow-x: hidden;
    max-width: 100vw;
  }
}
```

Daarnaast een algemene safeguard:
- `img, video, table { max-width: 100%; }` toevoegen als die nog niet aanwezig is.

## Te wijzigen bestanden

- `src/index.css` — voeg mobiele overflow-x: hidden regels toe.

## Out of scope

- Refactoren van individuele componenten die te brede content veroorzaken (eerst kijken of de globale fix volstaat).
- Desktop layout blijft ongewijzigd.

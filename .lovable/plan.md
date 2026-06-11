# Optimalisatie favorietenherkenbaarheid op listing cards

## Samenvatting
Verbeter de visuele herkenbaarheid van eerder gelikete advertenties op alle listing cards zodat gebruikers tijdens het scrollen onmiddellijk kunnen zien welke auto's al in hun favorieten staan.

## Huidige situatie
- `FavoritesProvider` beheert favorieten correct als enige bron van waarheid (Set<string> uit Supabase).
- `ListingCard` toont een hart-knop die bij favoriet `bg-primary` + `fill-current` krijgt.
- Dit is subtiel: de gebruiker moet actief naar het hartje kijken; er is geen visuele status op kaartniveau.

## Gewenste situatie
Een gelikete advertentie springt direct in het oog door een combinatie van een opvallend hartpictogram, een visueel accent op de kaart zelf, en een subtiele animatie bij het liken.

## Wijzigingen

### 1. ListingCard — opvallender hartpictogram
- Hart-knop krijgt bij favoriet een vaste `ring-2 ring-primary/40 ring-offset-1 ring-offset-background` voor extra contrast.
- Hart-icoon bij favoriet: vaste `fill-current text-primary-foreground` + `scale-110` (reeds aanwezig, behouden).
- Niet-favoriet hartje: lichtgrijze achtergrond, donkergrijs icoon (huidige `bg-card/90 text-accent` wordt duidelijker gescheiden van de actieve toestand).

### 2. ListingCard — visueel accent op favoriete kaarten
- De hele kaart krijgt bij favoriet een zeer subtiele roze achtergrondtint: `bg-primary/[0.03]` (licht gekleurd achtergrondaccent).
- Een dunne gekleurde rand aan de bovenkant van de afbeelding: `border-t-2 border-primary` wanneer favoriet. Dit is herkenbaar zonder de kaart te domineren.
- Op mobiel (waar de afbeelding bovenaan staat) werkt dit het beste; op horizontal variant wordt de rand links geplaatst (`border-l-2`).

### 3. ListingCard — "Favoriet"-badge
- Een kleine "Favoriet"-badge verschijnt naast de prijs-badge wanneer de advertentie als favoriet staat. Badge-styling: `bg-primary text-primary-foreground` met hart-icoon, compact formaat (`px-2 py-0.5 text-xs`).
- Deze badge wordt alleen getoond bij `favorite === true` en vervangt geen bestaande informatie.

### 4. ListingCard — animatie bij eerste like
- Wanneer een advertentie voor het eerst wordt geliket, speelt een korte `keyframes`-animatie af op het hartpictogram: een "pulse"-effect (`scale-110 -> scale-125 -> scale-110`) gedurende 300ms.
- Gebruik een lokale `useState` om het "net-geliket" moment vast te leggen zodat de animatie eenmalig afspelt, niet bij elke re-render.
- Dit vereist geen extra dependencies; implementatie met CSS `@keyframes` in `index.css`.

### 5. ListingGrid — geen wijzigingen nodig
- `ListingGrid` blijft ongewijzigd; het doorgeven van `isFavorite` en `onFavoriteToggle` werkt al correct.
- De visuele veranderingen leven volledig in `ListingCard`.

### 6. Favorites pagina — geen wijzigingen nodig
- `Favorites.tsx` blijft ongewijzigd; de gelikete kaarten zullen automatisch het nieuwe visuele accent tonen.

### 7. Performance & sync-garanties
- Geen extra API-calls: `FavoritesProvider` laadt eenmalig bij login; `isFavorite()` is een `Set.has()` O(1) lookup.
- Geen impact bij grote lijsten: styling is puur CSS op basis van een reeds beschikbare boolean; geen extra state of effect per kaart.
- Sync tussen pagina's: `FavoritesContext` blijft de enige bron van waarheid; de `toggle()` doet een optimistische update.

## Technische details
- Bestanden die gewijzigd worden: `src/modules/listings/ListingCard.tsx`, `src/index.css` (voor `@keyframes heart-pulse`).
- Geen wijzigingen aan database, API, of andere pagina's.
- CSS-animatie wordt toegevoegd als utility-klasse; geen extra JS-library nodig.

## Teststrategie
- Controleer op mobiel (390px viewport) dat favoriete kaarten duidelijk herkenbaar zijn tijdens scrollen.
- Controleer op tablet (768px) en desktop (1440px) dat layout consistent blijft.
- Verifieer dat niet-gelikete kaarten geen visuele verandering tonen.
- Controleer dat de "Favoriet"-badge niet overlapt met de prijs-badge op smalle schermen.
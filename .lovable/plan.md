

# Laadsnelheid Optimalisatie

## Huidige problemen

1. **Alle pagina's worden eager geïmporteerd** — App.tsx importeert alle 13 pagina's synchronous, waardoor de initiële bundle alles bevat
2. **Render-blocking Google Fonts** — 4 font families (Inter, JetBrains Mono, Montserrat, Sora) worden synchronous geladen in `<head>`
3. **Externe afbeeldingen zonder lazy loading** — Listing images van Unsplash laden allemaal direct
4. **Geen font subsetting** — JetBrains Mono en Sora worden geladen maar nauwelijks gebruikt
5. **Hero image niet geoptimaliseerd** — Geen preload voor de LCP (Largest Contentful Paint) afbeelding

## Wijzigingen

### 1. Lazy loading van pagina's (`src/App.tsx`)
Alle pagina-imports omzetten naar `React.lazy()` met `Suspense` fallback. Alleen `Index` blijft eager (homepage). De rest (Search, ListingDetail, Sell, Dashboard, etc.) wordt lazy geladen.

### 2. Font loading optimaliseren (`index.html`)
- Verwijder JetBrains Mono en Sora (niet/nauwelijks gebruikt)
- Voeg `&display=swap` toe (al aanwezig via Google Fonts URL)
- Voeg `<link rel="preload">` toe voor de kritieke font (Inter 400/500/600)
- Houd Montserrat (alleen weight 500 voor logo)
- Trim Inter weights naar 400;500;600;700 (verwijder 300, 800)

### 3. Hero image preloaden (`index.html`)
- Voeg `<link rel="preload" as="image" href="/hero-image.png">` toe voor snellere LCP

### 4. Lazy loading voor afbeeldingen (`src/modules/listings/ListingCard.tsx`)
- Voeg `loading="lazy"` toe aan alle `<img>` elementen

### 5. ChatWidget lazy laden (`src/layouts/AppLayout.tsx`)
- Wrap `ChatWidget` in `React.lazy()` omdat het niet direct zichtbaar is

## Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/App.tsx` | Lazy imports voor alle pagina's behalve Index |
| `index.html` | Font trimming, hero image preload |
| `src/modules/listings/ListingCard.tsx` | `loading="lazy"` op img tags |
| `src/layouts/AppLayout.tsx` | Lazy load ChatWidget |


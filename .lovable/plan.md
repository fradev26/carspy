

# Frades Workshop Platform Styling Toepassen

## Wat verandert er

Het volledige kleurenschema en typografie worden aangepast van het huidige "Deep Blue + Electric Orange" automotive thema naar het "Frades Workshop" thema met amber/rood-roze als primaire kleur, nieuwe statuskleur-tokens, extra fonts (JetBrains Mono, Sora), en visuele effecten (shine, glow).

## Aanpassingen per bestand

### 1. `src/index.css` — Design tokens bijwerken

**Light mode `:root`:**
- `--primary`: 347 77% 50% (amber/rood-roze)
- `--primary-foreground`: 0 0% 100%
- `--secondary`: 220 14% 96%
- `--secondary-foreground`: 220 13% 18%
- `--background`: 210 20% 98%
- `--foreground`: 220 13% 18%
- `--border` / `--input`: 220 13% 91%
- `--ring`: 347 77% 50% (volgt primary)
- `--muted`: 220 14% 96%
- `--muted-foreground`: 220 9% 46%
- `--accent`: 347 77% 50% (zelfde als primary voor dit thema)
- `--radius`: 0.75rem (was 0.625rem)

**Nieuwe status CSS-variabelen toevoegen:**
- `--status-pending`: 45 93% 47%
- `--status-diagnosing`: 199 89% 48%
- `--status-waiting-parts`: 280 67% 55%
- `--status-in-progress`: 24 95% 53%
- `--status-ready`: 142 71% 45%
- `--status-delivered`: 210 20% 55%

**Dark mode aanpassen** naar complementaire donkere variant.

**Nieuwe utility classes toevoegen:**
- `.shine-effect` — gloss gradient overlay op primary buttons
- `.glow-auth` — pulserende radiale gradient animatie (voor auth-pagina)

### 2. `tailwind.config.ts` — Fonts & statuskleur-mapping

- `fontFamily.sans`: `["Inter", "system-ui", "sans-serif"]` (blijft)
- `fontFamily.mono`: `["JetBrains Mono", "monospace"]` toevoegen
- `fontFamily.display`: `["Sora", "Inter", "sans-serif"]` toevoegen
- Nieuwe `colors.status` object met pending/diagnosing/waiting-parts/in-progress/ready/delivered
- Nieuwe keyframe `glow` voor pulserende auth-achtergrond
- Container padding naar `2rem`

### 3. `index.html` — Google Fonts import

JetBrains Mono en Sora toevoegen via Google Fonts `<link>` in de `<head>`.

### 4. `src/components/ui/button.tsx` — Shine effect

Primary button variant krijgt een extra `relative overflow-hidden` class met een `::after` pseudo-element voor het shine-effect (via de `.shine-effect` utility uit index.css).

## Bestanden die NIET wijzigen
- Alle pagina's en componenten die al `hsl(var(--primary))` etc. gebruiken via Tailwind — die pikken automatisch de nieuwe kleuren op.
- Supabase/backend bestanden.

## Volgorde
1. `index.html` — fonts laden
2. `src/index.css` — tokens + utilities
3. `tailwind.config.ts` — font families + statuskleuren + container padding
4. `src/components/ui/button.tsx` — shine effect


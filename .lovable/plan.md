# Herontwerp Berichtenpagina — Native chat-app feel

Volledige herwerking van `src/pages/Messages.tsx` zodat de pagina aanvoelt als WhatsApp/iMessage, zonder VATUUR-huisstijl te wijzigen.

## Layout

- Twee modi:
  - **Desktop (md+)**: split-view, conversatielijst links (max-w-sm), chat rechts. Volledige hoogte `h-[100dvh] - header - bottomnav`.
  - **Mobile**: één view tegelijk — lijst óf chat (full-screen). Bij geopende chat verbergt de bottom nav niet, maar de inputbalk plakt eronder.
- Container: vervang huidige `container py-6` door full-bleed `h-[100dvh]` met `flex flex-col`, padding-top voor fixed header (env safe-area-top), padding-bottom voor bottomnav + safe-area-bottom.
- Geen `Card` wrappers meer — directe surfaces met subtiele `border-b` scheidingen.

## Header (chat-modus)

- Sticky top, compact (h-14): terugknop links, in midden auto-titel (1 regel, truncate) + subtiele subregel (`other_name` of "Online"-stijl placeholder via `last_seen` — voor nu statische "Reageert meestal binnen 1u").
- Lichte border-bottom, geen schaduw.
- Klikbaar → navigeert naar `/auto/{listing_id}`.

## Berichten

- `flex-1 overflow-y-auto` (geen ScrollArea component — native scroll voor 60fps + momentum).
- Bubbles: max-w-[75%], rounded-2xl met asymmetrische "tail" hoek, eigen rechts (`bg-primary text-primary-foreground`), ontvangen links (`bg-muted`).
- Tijdstip in kleine tekst (10px) onder bubble buiten de bubble, of binnen — houden zoals huidige stijl maar verfijnd.
- Datum-separator (centered chip) bij dagwissel.
- Nieuwe berichten: `animate-fade-in` (al beschikbaar in Tailwind config).
- Auto-scroll naar onder: `useEffect` op messages.length → `scrollIntoView({behavior:'smooth', block:'end'})` op een sentinel `<div ref={endRef} />`.
- `useLayoutEffect` voor instant scroll bij initial load.

## Input

- Sticky onderaan binnen chat-container (`sticky bottom-0`), achtergrond `bg-background/95 backdrop-blur`.
- Eén pill-vormige textarea (rounded-full als 1-regel, rounded-2xl bij meerregels) met geïntegreerde verzendknop rechts (absolute positioned icon button).
- Textarea auto-grow tot 5 regels via `rows={1}` + scrollHeight measurement (kleine helper).
- Enter = verzend, Shift+Enter = nieuwe regel.
- Verzendknop disabled wanneer leeg; subtiele scale-in animatie wanneer actief.
- `padding-bottom: env(safe-area-inset-bottom)` op de input-wrapper.

## Mobiele UX

- `100dvh` (dynamic viewport) ipv `100vh` zodat keyboard de hoogte aanpast en laatste bericht zichtbaar blijft.
- `overscroll-behavior: contain` op messages container — geen pull-to-refresh interferentie.
- `touch-action: pan-y` op messages, `manipulation` op buttons (al globaal aanwezig).
- Geen horizontale overflow door `min-w-0` op flex children + `break-words` op bubble content.
- Touch targets ≥ 44×44 via `tap-target` utility (al beschikbaar).

## Performance

- Geen externe virtualizer-library installeren (out of scope per project conventies). In plaats daarvan: render alleen laatste 200 berichten; oudere worden via "Toon oudere berichten"-knop bovenaan geladen. Voor huidige scale (kleine 1-op-1 chats) is dit voldoende native-snel.
- Memoize bubble component met `React.memo`.
- `key={msg.id}` voor stable diffs.
- Geen layout shift: textarea-grow gebeurt boven de input, niet onder — messages scroll past mee.

## Lege staat

- Behoud huidige empty state maar zonder Card — gewoon centered icoon + tekst + CTA naar /zoeken.

## Bestanden

- **edit** `src/pages/Messages.tsx` — volledige rewrite van JSX en kleine helpers (datum-separator, auto-grow textarea via inline hook, scroll-to-bottom). Data-fetching, realtime subscription en `sendMessage` logica blijven onveranderd.

## Out of scope

- Geen huisstijl-, kleur-, of typografie-wijzigingen.
- Geen nieuwe routes, geen schema-wijzigingen, geen edge functions.
- Geen virtualizer-dependency, geen Capacitor.
- `BottomNav` / `Header` / `AppLayout` worden niet aangepast.

## Verificatie

Playwright op 375×812: open `/berichten`, selecteer eerste conversatie, controleer dat:
- header sticky is en compact (h-14)
- messages container vult de resterende hoogte
- input sticky onderaan zit boven bottom nav
- geen horizontale scrollbar
- screenshots: lijst-view, chat-view, met getypt bericht (multiline)

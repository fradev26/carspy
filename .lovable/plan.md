# Berichtenpagina — Native chat-app finetuning

Doel: laat `/berichten` aanvoelen als WhatsApp/iMessage. Geen huisstijl-wijzigingen.

## Probleemanalyse (huidige staat)

1. **Lege ruimte boven**: `AppLayout` voegt `pt-[3.5rem+safe-top]` toe op `<main>` zodat alle pagina's onder de fixed header passen. Op Messages voelt dat als loze ruimte tussen header en chat.
2. **Hoogte niet optimaal**: shell gebruikt `100dvh - header - bottomnav`, maar AppLayout heeft ook `pb-nav`, wat dubbele bottom-spacing geeft (input staat los van de bottom nav i.p.v. eraan vast).
3. **Tijdsaanduiding** is alleen `HH:MM` — spec wil "Gisteren • 14:37" en "18 juni 2026 • 14:37" voor oudere berichten.
4. **Geen virtualizer** — momenteel "verberg laatste 200" knop. Spec vraagt echte virtualisatie.
5. **Input voelt los** — door `px-2 pt-2` rond textarea + border-top zonder doorlopend chat-oppervlak.

## Wijzigingen

### `src/layouts/AppLayout.tsx`

- Detecteer `/berichten` route → render `<main>` zonder `pt-...` en zonder `pb-nav`, zodat Messages echt full-bleed onder de header en boven de bottom nav zit.
- Concreet: `const isMessages = location.pathname.startsWith('/berichten');` → conditioneel `pt-0 pb-0` op mobile voor messages, desktop blijft `lg:pt-16`.
- `Footer`, `CompareBar`, `ChatWidget` worden niet getoond/relevant voor messages (Footer al onder bottomnav, ChatWidget kan op messages-route verborgen worden om dubbele input te vermijden).

### `src/pages/Messages.tsx`

**Layout/shell**
- Shell-hoogte: `h-[100dvh]` (volledige viewport) minus alleen wat AppLayout nog overlaat. Met aanpassing in AppLayout: `h-[calc(100dvh-3.5rem-env(safe-area-inset-top)-4rem-env(safe-area-inset-bottom))]` op mobile, `lg:h-[calc(100dvh-4rem)]` op desktop. Geen extra margin.
- Header binnen chat: blijft `h-14` sticky top.
- Messages container: `flex-1 min-h-0 overflow-y-auto` met `px-3 py-2` (kleinere top-padding zodat eerste bericht dicht onder header zit).
- Input plakt onderkant zonder eigen `pt-2` boven — gebruik `py-2` symmetrisch en laat `bg-background` doorlopen tot bottom nav.

**Tijdsweergave per bericht**
- Helper `formatBubbleTime(d)`:
  - vandaag → `14:37`
  - gisteren → `Gisteren • 14:37`
  - dit jaar → `18 jun • 14:37`
  - ouder → `18 juni 2026 • 14:37`
- Datum-separators blijven, maar gebruik volledige labels ("Vandaag", "Gisteren", "donderdag 18 juni" / "18 juni 2026").

**Virtualisatie**
- Vervang "MAX_RENDER 200 + knop" door windowing zonder externe lib: bereken zichtbaar venster via `IntersectionObserver` op sentinel-divs aan beide kanten, render ±100 berichten rond scrollpositie. Voor huidige scale (kleine 1-op-1 chats) levert dit 60fps zonder dependency.
- Alternatief indien complexiteit te hoog: behoud `slice(-200)` + lazy laden van oudere chunks bij scroll-top via `IntersectionObserver` op een top-sentinel. **Kies dit** — eenvoudiger, geen layout-shift, en past bij realistische chatgroottes.
- `React.memo` op `Bubble` blijft. `key={msg.id}` blijft.

**Input**
- Verwijder eigen `border-t` als de container al een natuurlijke scheiding heeft via shadow van de scroll. Houd subtiele `border-t border-border/40`.
- Plak input direct boven bottom nav: `pb-[max(0.5rem,env(safe-area-inset-bottom))]` blijft; verwijder `pt-2`, gebruik `py-2`.
- Textarea auto-grow max 5 regels — blijft.

**Auto-scroll**
- Behoud `useLayoutEffect` initial + `useEffect` smooth scroll. Voeg `ResizeObserver` op messages container toe zodat scroll-bottom ook triggert wanneer keyboard opent en viewport krimpt (laatste bericht blijft zichtbaar).

**ChatWidget verbergen op /berichten**
- In `AppLayout.tsx`: render `ChatWidget` niet als `isMessages` — voorkomt floating AI-input bovenop de chat-input.

## Out of scope

- Geen kleuren/typografie/radius wijzigingen.
- Geen nieuwe dependency (geen `react-window`/`virtuoso`).
- Geen schema/edge function/bottomnav wijzigingen.
- Geen nieuwe routes.

## Verificatie (Playwright, 375×812)

- `/berichten` met conversatie open:
  - geen ruimte tussen header en eerste bericht meer dan ~8px
  - input zit direct boven bottom nav (geen gap)
  - typ multiline → textarea groeit, laatste bericht blijft zichtbaar, geen layout shift
  - screenshots: chat-view leeg + chat-view met berichten + multiline-typing
- Controleer `document.documentElement.scrollWidth === clientWidth` (geen horizontale overflow).

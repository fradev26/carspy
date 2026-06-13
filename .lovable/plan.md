## Probleem

Wanneer iemand in de fullscreen AI-chat (mobiel, `AIFullscreenChat`) op een autokaart ("Bekijk →") klikt, navigeert de `<Link>` naar `/auto/:id`, maar de chat-overlay (`fixed inset-0 z-[60]`) blijft erbovenop staan. De gebruiker ziet dus nog steeds de chat in plaats van de advertentie.

## Oplossing

1. **Sluit de chat zodra je naar een advertentie navigeert via een CarCard-link** in `src/modules/chat/ChatMessage.tsx`. In de `CarCard`-`onClick` dispatchen we een custom event `vatuur:chat-navigate-listing`. Geen `preventDefault` — de React Router-navigatie blijft normaal werken; de chat wordt alleen gesloten.

2. **Markeer dat de chat heropend moet worden bij terug-navigatie.** In dezelfde click handler zetten we `sessionStorage.setItem('vatuur:reopenChatOnBack', '1')`.

3. **Luister in `BottomNav` (`src/components/BottomNav.tsx`)** naar het custom event en zet `aiOpen` op `false`, zodat de fullscreen overlay direct verdwijnt en de advertentie zichtbaar wordt.

4. **Heropen de chat bij `popstate`** (klik op het terug-pijltje van de browser of het ArrowLeft-pijltje op de detailpagina, dat al `navigate(-1)` gebruikt). In `BottomNav` registreren we een `popstate`-listener: als de sessionStorage-vlag staat én we komen terug op de pagina waar we vandaan kwamen, zetten we `aiOpen=true` en wissen we de vlag. De vlag wordt ook gewist als de gebruiker een nieuwe vooruit-navigatie doet (via een gewone Link-klik) of de chat handmatig sluit, zodat hij niet onbedoeld opnieuw opent in een latere sessie.

## Out of scope

- Desktop `ChatWidget` (de gebruiker beschrijft het mobiele fullscreen-overlaygedrag; de desktop-widget is een hoek-popover die de pagina niet bedekt).
- Wijzigen van de back-knop op `/auto/:id` — die roept al `navigate(-1)` op, wat een `popstate` triggert.
- Geen routing- of statebeheer-refactor; we werken puur via een DOM-event en sessionStorage zodat we geen prop-drilling door `useChat`/`ChatMessage` hoeven te doen.

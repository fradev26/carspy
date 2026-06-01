## Doel

VATUUR. installeerbaar maken op mobiel (Add to Home Screen) zodat hij fullscreen opent als een echte app, zonder service worker (dus geen cache-problemen in de Lovable preview).

## Wat ik ga doen

1. **`public/manifest.webmanifest` aanmaken** met:
   - `name`: "VATUUR. - Tweedehands auto's"
   - `short_name`: "VATUUR."
   - `start_url`: "/"
   - `scope`: "/"
   - `display`: "standalone"
   - `orientation`: "portrait"
   - `theme_color`: "#E11D48" (primary rood)
   - `background_color`: "#FAFAFB" (matcht --background)
   - `lang`: "nl"
   - `icons`: 192x192 en 512x512 (beide "any maskable")
   - `shortcuts`: Zoeken, Verkopen, AI-chat

2. **App icons genereren** (rood VATUUR. logo op witte achtergrond) en in `public/` plaatsen:
   - `pwa-192.png` (192×192)
   - `pwa-512.png` (512×512, maskable safe-zone)
   - `apple-touch-icon.png` (180×180, voor iOS home screen)

3. **`index.html` uitbreiden** met:
   - `<link rel="manifest" href="/manifest.webmanifest">`
   - `<meta name="theme-color" content="#E11D48">`
   - `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
   - `<meta name="apple-mobile-web-app-capable" content="yes">`
   - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
   - `<meta name="apple-mobile-web-app-title" content="VATUUR.">`
   - `<meta name="mobile-web-app-capable" content="yes">`

4. **Mobile viewport polish** in `index.html`:
   - `viewport` uitbreiden met `viewport-fit=cover` zodat safe-area insets goed werken bij iPhone notch (BottomNav gebruikt al `env(safe-area-inset-bottom)`).

## Wat ik bewust NIET doe

- **Geen service worker / `vite-plugin-pwa`**: zou content cachen en de Lovable preview stale maken. Voor installeerbaarheid is dat ook niet nodig.
- **Geen offline-modus**: vereist een service worker.
- **Geen wijzigingen aan business logic** of bestaande mobile UI (BottomNav, Header, Sheet).

## Belangrijk om te weten

- PWA-installatie werkt op de **gepubliceerde URL** (vatuur.be / carspy.lovable.app). In de Lovable preview iframe verschijnt de install-prompt niet.
- Na installatie zit `start_url`, `scope` en `display` vast aan dat moment — wijzigingen daarna vereisen herinstallatie door de gebruiker.
- Wil je later toch offline support? Dan kunnen we een gecontroleerde service worker toevoegen, maar die zet ik nu bewust niet aan.

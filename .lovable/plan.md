
# Listings backlog — 4 verbeteringen

## 1. Fotozoom in galerij (`src/modules/listings/ImageGallery.tsx`)

In de lightbox: tap/dubbelklik om in/uit te zoomen, pinch-to-zoom op touch, en pan wanneer ingezoomd. Geen extra dependency.

- State toevoegen: `scale` (1 / 2.5), `offset {x,y}`, `pinchStart`.
- Dubbelklik / dubbel-tap op afbeelding → toggle scale tussen 1 en 2.
- `touchstart` met 2 vingers → bewaar afstand; `touchmove` → `scale = clamp(initialScale * dist/initialDist, 1, 4)`.
- Bij scale > 1: één-vinger pan via touchmove; muiswiel zoomt (`onWheel`, `preventDefault`); cursor wordt `grab/grabbing`.
- Bij sluiten lightbox of slidewissel: reset naar `scale=1`, `offset=0`.
- Bestaande swipe-naar-volgende blokkeren wanneer `scale > 1` (anders conflicteert pan).
- Toon kleine zoom-hint badge (`ZoomIn`-icoon + "Dubbeltik om te zoomen") gedurende 2s bij openen lightbox.

## 2. Dubbele sluitknop verwijderen (`src/modules/listings/ImageGallery.tsx`)

`DialogContent` van shadcn rendert al automatisch een `<X>`-knop rechtsboven. ImageGallery voegt op regel 204 een tweede `<DialogClose>` toe → dat geeft de dubbele knop. Verwijder die extra `DialogClose` (en de `DialogClose`-import). De auto-knop van `DialogContent` blijft; we hertinten 'm via klasse-override op `DialogContent` zodat hij goed leesbaar is op de zwarte lightbox-achtergrond (witte tint, `top-4 right-4`).

## 3. "Bekijk volledig aanbod" navigatie (`src/pages/ListingDetail.tsx` + `src/pages/DealerInventory.tsx`)

Link bestaat al twee keer (regels 821 en 982) als `<Link to={`/dealer/${dealerSlugFor(listing.seller)}`}>` en route `/dealer/:slug` is geregistreerd. We zorgen dat:
- De CTA-knop een expliciete `onClick`/route gebruikt die ook werkt vanuit de mobile sticky bottom-bar (waar overlay-click anders kan blokkeren).
- `DealerInventory` bovenaan een `window.scrollTo(0,0)` of `useEffect` heeft zodat de gebruiker bovenaan de dealerpagina landt.
- CTA-label uniform: **"Volledig dealeraanbod bekijken"** (i.p.v. huidige "Bekijk volledig aanbod") en `ChevronRight`-icoon erbij voor duidelijkheid.
- Test in build mode of beide instanties navigeren naar `/dealer/<slug>`.

## 4. Verkooptekst-editor UX (`src/pages/Sell.tsx` — STAP 5)

Het huidige veld is een kale `Textarea` met één AI-knop. Verbeteringen:

- **Label hernoemen** "Opmerkingen / beschrijving" → **"Verkooptekst"** met subtitel "Vertel wat jouw auto bijzonder maakt".
- **Tekenteller** rechtsonder (`{n} / 1500`); kleur naar `text-warning` boven 1300.
- **Min/max hoogte** + auto-resize (`rows={8}`, `min-h-48`, `resize-y`).
- **AI-toonkeuze** vóór genereren: kleine `ToggleGroup` (Kort / Uitgebreid / Verkoopgericht) — wordt meegestuurd als `tone` in de bestaande `generate-listing`-payload. Edge function negeert onbekende velden veilig; mocht backend nog niets ermee doen, dan blijft output gewoon werken.
- **Bevestiging vóór overschrijven**: als `description` al inhoud heeft → confirm-dialog "Bestaande tekst vervangen?" met "Vervangen" / "Toevoegen aan einde" / "Annuleren".
- **"Wissen"-knop** naast de AI-knop (alleen zichtbaar als veld niet leeg is).
- **Snelle quick-actions chips** boven de textarea: "+ APK genoemd", "+ Onderhoudshistorie", "+ Niet-roker" → voegt korte zin toe aan einde (geen AI-call nodig).
- **Inline tip** onder veld: "Tip: vermeld onderhoud, accessoires en reden van verkoop voor sneller resultaat."
- Behoudt huidige `generateDescription`-flow en toasts.

## Buiten scope

- Geen wijzigingen aan dealer-detailpagina layout zelf.
- Geen nieuwe editor-library (TipTap/Quill); blijft `<Textarea>` met quality-of-life features.
- Geen wijzigingen aan AI-prompt/edge function; `tone` wordt enkel meegestuurd.

## Technische details

- Zoom-state buiten `<img>` via `style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, transition: dragging ? 'none' : 'transform 200ms' }}`.
- Wheel/touch handlers met `passive: false` via `useEffect`+`addEventListener` zodat `preventDefault` werkt.
- ToggleGroup uit `@/components/ui/toggle-group` (al beschikbaar).
- Confirm dialog via bestaande `AlertDialog`.
- Geen DB-/route-/type-wijzigingen.

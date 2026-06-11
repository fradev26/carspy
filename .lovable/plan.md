## Probleem
Op mobiel staat de "Bericht/Bellen" CTA `fixed bottom-16` (boven de BottomNav). De main content gebruikt enkel `pb-nav` (≈ 4rem van de BottomNav) als bodemruimte, maar houdt geen rekening met deze extra contact-bar (~80px). Daardoor schuift de "VATUUR. AI Analyse" kaart (en de "Stuur bericht" knop in de prijskaart) onder de sticky CTA — niet meer volledig zichtbaar of klikbaar.

## Oplossing
Eén gerichte CSS/spacing-fix in `src/pages/ListingDetail.tsx` — geen wijziging aan navigatie, BottomNav, of desktoplayout.

### Wijziging in `src/pages/ListingDetail.tsx`
1. Op de container `<div className="container py-6">` (regel 191): vervang door
   `<div className="container py-6 pb-[7rem] lg:pb-6">`.
   - Mobiel: ~112px extra bodemruimte = hoogte sticky contact-bar (p-4 + h-12 button ≈ 80px) + buffer + `safe-area-inset-bottom` wordt al door de bar zelf afgehandeld.
   - `lg:pb-6` herstelt de originele desktop-padding (geen sticky bar daar).
2. Geef de sticky contact-bar (regel 627) een subtiele top-schaduw/border zodat de scheiding visueel duidelijk blijft: `shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]` toegevoegd naast bestaande classes. Geen layout-impact.

Geen wijziging aan `AppLayout` (`pb-nav` blijft) — anders krijgen andere pagina's onnodige bodemruimte.

## QA checklist
- 320 / 375 / 390 / 414 px: AI Analyse-kaart en "AI analyse starten" knop volledig zichtbaar en klikbaar bovenaan de sticky CTA; geen overlap met "Stuur bericht" knop in prijskaart.
- 768 px (tablet, `lg:hidden` actief tot 1024): zelfde gedrag, geen overlap.
- ≥ 1024 px (`lg`): sticky CTA verdwijnt, padding terug naar `py-6`, geen lege ruimte onderaan.
- BottomNav blijft op zijn plek, gerelateerde auto's-sectie blijft scrolbaar zonder afsnijding.
- Safe-area (iPhone notch/home-indicator) blijft correct via bestaande `safe-bottom` op de contact-bar en BottomNav.

## Buiten scope
Backend, types, andere pagina's, ImageGallery, EquipmentDialog.

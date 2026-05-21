# Knoppen + reviews direct onder zoekbox — consistente hoogte

## Doel
De CTA-knoppen ("Zoek auto's" / "Plaats advertentie") en de review-balk staan in beide zoekmodi (slim & klassiek) **direct onder** de zoekbox, zonder grote witruimte. Beide zoekmodi hebben dezelfde hoogte zodat de layout niet verspringt bij het wisselen.

## Probleem nu
`HeroSearch` reserveert een vaste hoogte (`h-[280px] sm:h-[260px] md:h-[72px]`) om layout-shift bij wisselen te voorkomen. Gevolg op mobiel:
- Slim zoeken (~72px) krijgt ~210px lege ruimte eronder → knoppen staan ver onder de zoekbalk.
- Klassiek zoeken vult de volle 280px (gestapeld) → knoppen staan er wél onder.

## Oplossing
Beide zoekvormen krijgen dezelfde compacte hoogte (~1 rij, ~72px) op alle viewports. De container wordt `auto` qua hoogte; CTA-knoppen en reviews volgen direct.

### Wijzigingen

**`src/modules/search/ClassicHeroSearch.tsx`** — mobiele variant compact maken
- Vervang de gestapelde mobiele layout (3 selects + 2 knoppen, ~280px) door één compacte rij: een trigger-knop "Merk · Model · Prijs" die een bottom-sheet opent met dezelfde 3 selects + Zoeken. Hoogte: ~56–64px, vergelijkbaar met de Slim-balk.
- Desktop layout (md:flex pill-rij, h-14) blijft ongewijzigd; hoogte komt al overeen met Slim variant op desktop.

**`src/modules/search/HeroSearch.tsx`** — vaste hoogte verwijderen
- Vervang `relative w-full h-[280px] sm:h-[260px] md:h-[72px]` door `relative w-full` (auto hoogte).
- Absolute inset blijft voor de fade-in animatie maar wrapper krijgt `min-h` matched aan de compacte zoekbalk-hoogte zodat er geen sprong is tijdens de fade.

**`src/pages/Index.tsx`** — spacing fijn afstemmen
- CTA-knoppen container: `mt-3 lg:mt-5` blijft (zit al strak).
- Review-balk container: behoud `mt-4`. Geen verdere wijziging nodig zodra hoogtes consistent zijn.

## Resultaat
- Slim en Klassiek zoeken nemen dezelfde verticale ruimte in.
- Knoppen + reviews staan in beide modi direct onder de zoekbox, geen lege ruimte.
- Geen layout-shift bij het wisselen tussen zoekmodi.
- Volledige filterfunctionaliteit blijft toegankelijk via de sheet op mobiel.

# CTA-knoppen visueel hoger binnen de hero

## Doel
De knoppen "Zoek auto's" en "Plaats advertentie" staan dichter onder het zoekveld in de hero op `/`, zodat ze sneller zichtbaar zijn zonder de hero-layout te verstoren.

## Wijziging
Een bestand: `src/pages/Index.tsx` — de marge boven de CTA-knoppencontainer op regel 185.

- Wijzig `mt-6 lg:mt-8` naar `mt-3 lg:mt-5` op de knoppencontainer.
- Dit verkleint de verticale afstand tussen `HeroSearch` en de knoppen.
- De rest van de hero (hoogte, padding, achtergrond, trust indicators, social proof) blijft ongewijzigd.

## Resultaat
Knoppen staan compacter onder het zoekveld, directer zichtbaar binnen dezelfde viewport, zonder dat de hero verschuift of andere elementen beïnvloedt.

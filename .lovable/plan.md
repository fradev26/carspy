# Hover-inversie favoriet- en vergelijk-knop op ListingCard

## Doel
De ronde icoonknoppen rechtsboven op de listingcards (favoriet & vergelijk) zijn standaard wit met rood icoon. Bij hover worden ze geïnverteerd: rode achtergrond, wit icoon.

## Wijziging
Eén bestand: `src/modules/listings/ListingCard.tsx` — drie knoppen (favoriet horizontal + favoriet default + vergelijk default).

Per knop hover-classes toevoegen:
- `hover:bg-primary` (rode achtergrond)
- `hover:text-primary-foreground` (wit icoon)
- `hover:border-primary` indien border zichtbaar
- Bestaande `hover:scale-110` blijft behouden

Voor de active states (favoriet aangevinkt / wordt vergeleken) wordt diezelfde geïnverteerde stijl gebruikt zodat de stijl consistent blijft.

Geen wijzigingen aan business logic of layout.

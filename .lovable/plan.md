# Fix merknaam wrapping in mobiel menu

## Wijziging
In `src/layouts/Header.tsx`, pas de className van de merk-knoppen aan in beide mobiele menu-secties (ingelogd en niet-ingelogd):

- Voeg `truncate` toe (whitespace-nowrap + overflow-hidden + text-ellipsis)
- Verklein horizontale padding van `px-3` naar `px-2` voor iets meer ruimte
- Behoud `grid-cols-2`, `gap-1`, `text-sm` en menu-breedte

## Resultaat
Alle merknamen staan op een regel; te lange namen worden afgekapt met ellipsis. Geen line breaks, geen layout shifts, menu-breedte ongewijzigd.

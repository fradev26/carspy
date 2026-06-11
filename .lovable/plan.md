
## Doel
"Zetels" weghalen uit de Key Specs op de voertuig-detailpagina en de volledige uitrusting verplaatsen naar een aparte "Volledige optielijst bekijken" CTA, die op mobiel een bottom sheet en op desktop een modal opent.

## Wijzigingen in `src/pages/ListingDetail.tsx`

### 1. Key Specs opschonen
- Verwijder het `Zetels`-item uit de `specs`-array (regel 163).
- `Users` import uit `lucide-react` verwijderen als die nergens anders gebruikt wordt.
- Grid-classes (`grid-cols-2 sm:grid-cols-4`) blijven ongewijzigd — wrap-gedrag werkt automatisch met minder items.

### 2. Equipment-kaart vervangen door CTA
De huidige "Uitrusting" kaart (regels 357–371) wordt vervangen door één CTA-knop direct onder de "Beschrijving" kaart:

- Visueel: full-width `Card`-achtige knop met label "Volledige optielijst bekijken", subtekst aantal opties (`{equipment.length} opties`), en een `ChevronRight` icoon rechts.
- VATUUR-styling: `border-border/60 shadow-card`, hover `bg-muted/40`, primary accent text, `focus-ring`, geschikt voor touch (min-h ~64px).
- Alleen renderen wanneer `equipment.length > 0`. Geen CTA = geen modal.

### 3. Nieuw component `EquipmentDialog`
Nieuw bestand `src/modules/listings/EquipmentDialog.tsx`:

- Props: `open`, `onOpenChange`, `equipment: string[]`, `title?: string`.
- Detecteert viewport met bestaande `useIsMobile()` hook.
  - Mobiel → shadcn `Sheet` met `side="bottom"`, `max-h-[85vh]`, scrollbare body.
  - Tablet/desktop (≥ md) → shadcn `Dialog`, `max-w-2xl`, `max-h-[80vh]`, scrollbare body.
- Header: titel "Volledige uitrusting" + sluitknop (ingebakken in Sheet/Dialog).
- Body: groepeert equipment per `category` uit `FEATURE_OPTIONS` (`comfort`, `safety`, `multimedia`, `exterior`, plus afgeleide `interior`, `rijhulpsystemen` indien aanwezig in dataset).
  - Mapping naar Nederlandse koppen: Comfort, Veiligheid, Multimedia, Exterieur, Interieur, Rijhulpsystemen, Overige.
  - Onbekende values (niet in `FEATURE_OPTIONS`) belanden in "Overige" en tonen de raw string.
  - Per groep: kopje + `grid grid-cols-1 sm:grid-cols-2` lijst met `Check` icoon, `break-anywhere` zodat lange labels wrappen. Geen horizontale scroll.
- Toegankelijkheid: `DialogTitle`/`SheetTitle` voor screen readers, ESC sluit (default Radix), focus trap (default).

### 4. State in `ListingDetail`
- `const [equipmentOpen, setEquipmentOpen] = useState(false);`
- CTA-knop opent dialog; component rendert dialog alleen als `equipment.length > 0`.

## Datacontract
- Bron blijft `listing.equipment ?? listing.features ?? []` (geen hardcoded data, geen schema-wijziging).
- Groepering puur client-side op basis van bestaande `FEATURE_OPTIONS.category`.

## QA
- 320 / 375 / 768 / 1280 px: geen horizontale scroll, key specs uitlijning correct, CTA klikbaar, sheet/dialog opent en sluit, lange labels wrappen.
- Listing zonder equipment: CTA niet zichtbaar.
- Toetsenbord: Tab focust CTA, Enter opent, Esc sluit.

## Geen wijzigingen aan
Backend, types, andere pagina's, listing card grid.

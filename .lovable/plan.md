# Herontwerp "Bewerken wagen" (`/zakelijk/voorraad/:id`)

Volledige rewrite van `src/pages/dealer/ListingOperating.tsx`. Geen wijziging aan routes, schema of `BoostDialog` (wordt hergebruikt).

## Pagina-structuur (top → bottom)

```text
┌─ Back-knop + hoofdfoto (16/10, gradient overlay)
│   titel · prijs · jaar · km · brandstof · transmissie
│   StatusBadge (Actief/Concept/Verkocht)
├─ Twee 50/50 actieknoppen: [Bewerken] [Boosten]
├─ SNELLE ACTIES — 2-koloms grid van 6 tap-kaarten
│   Foto's · Prijs · Status · Publicatie · Verkooptekst · Uitlichten
├─ VOERTUIGGEGEVENS — compacte lijst (label / waarde / chevron)
│   Merk · Model · Bouwjaar · KM-stand · Brandstof · Transmissie · Kleur
├─ VERKOOPTEKST — 3-regel preview · "Bewerken >" · ✨ AI-herschrijven
├─ PUBLICATIES — AutoScout24 · Gaspedaal · Facebook · Marktplaats
│   met status-dot (groen/geel/rood)
├─ PRESTATIES — 3 kolommen: Weergaven · Favorieten · Leads
└─ STICKY FOOTER — [Preview] [Opslaan] (of [Publiceren] bij concept)
    boven BottomNav, achtergrond `bg-background/95 backdrop-blur`
```

## Componenten (nieuw, inline in `ListingOperating.tsx`)

- `VehicleHeader` — foto + titel/prijs/specs + status badge
- `ActionPair` — twee 50/50 knoppen Bewerken / Boosten
- `QuickActions` — 2-koloms grid, opent juiste sheet via `setSheet('photos' | 'price' | ...)`
- `SpecList` — rij-component (label, value, onClick)
- `DescriptionPreview` — 3-line clamp + acties
- `PlatformList` — kleurdot + label + chevron
- `StatsRow` — drie cijferkaarten
- `StickyFooter` — fixed bottom, primaire opslaan

## Bottom sheets (één `Sheet`-host, geswitcht op `sheet` state)

Alle sheets gebruiken bestaande shadcn `Sheet` met `side="bottom"`, `max-h-[90vh] overflow-y-auto`.

| Sleutel | Inhoud |
| --- | --- |
| `photos` | Grid van bestaande images uit `listing.images` met drag-to-reorder (placeholder: pijlknoppen up/down), hoofdfoto-markering, upload via bestaand `supabase.storage` (`listing-images` bucket) en verwijderen |
| `price` | Numeric input + "Markt vergelijken" link naar `/zoeken?...` |
| `status` | Radio-keuze Actief/Concept/Gereserveerd/Verkocht |
| `publication` | Schakelaars per platform (AutoScout24 echt, andere disabled met "Binnenkort") |
| `description` | Volledige `Textarea` + "Opslaan" |
| `feature` | "Premium uitlichten" toggle (`is_premium`) |
| `spec` | Dynamisch per veld (merk/model/jaar/km/brandstof/transmissie/kleur) |

Sheet bevestiging → `supabase.from('listings').update({...}).eq('id', id)` → toast → lokale state refresh.

## Boosten

Hergebruik bestaande `<BoostDialog>` (al gebouwd, ondersteunt `lockedListing` + extra-kost waarschuwing met tekst die exact past op de spec: *"Deze boost valt buiten je abonnement…"*). Knop opent dialog met `listingId` en `listingTitle` vooringevuld.

## Publicaties data

Hergebruik bestaande query `autoscout_listings` (al opgehaald in huidige pagina). Andere platformen tonen statisch als "Niet gekoppeld" met grijze dot — geen nieuwe tabel.

## Data & state

- Behoud bestaande loaders (`listing`, `favorites`, `messages`, `trend`, `autoScout`, `aiInsight`).
- `trend`/`aiInsight`/grafiek verwijderen uit hoofdpagina; statistieken samenvatten in `StatsRow`. AI-insight verhuist naar de "AI herschrijven" knop in verkooptekst-sheet.
- Sticky footer "Opslaan" triggert algemene `handleSave` als er pending edits zijn (anders disabled).

## Styling

- Dark theme via bestaande semantische tokens (`bg-card`, `border-border/60`, `text-primary`, `bg-muted/40`).
- Rij-hoogte 56px voor alle tap-targets.
- Container `max-w-2xl px-4 py-4 space-y-5 pb-28` (footer-clearance).
- Section-titel `text-xs uppercase tracking-wider font-semibold text-muted-foreground px-1`.
- Transitions `transition-colors` only, geen scale-animaties.

## Buiten scope

- Drag-and-drop foto's met DnD-lib (gebruikt eenvoudige reorder-knoppen)
- Echte koppeling Gaspedaal/Facebook/Marktplaats (placeholders)
- Aparte preview-pagina — "Preview" linkt naar bestaande `/auto/:id` in nieuw tabblad
- Wijzigingen aan database, BoostDialog, of bottom navigation

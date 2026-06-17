# Plan: 80/20 "Toon resultaten" + "Zoekopdracht opslaan" combo

Splits de zoekknop op /zoeken in één gecombineerde 80/20 control en zorg dat opslaan écht naar `saved_searches` schrijft.

## Scope

Twee plekken in `src/modules/search/SearchBar.tsx` (gebruikt op `/zoeken`):

1. **Hoofdbalk** (rond regel 269-279) — bovenste "Toon resultaten" knop.
2. **Onderkant geavanceerde filters** (rond regel 388-395) — tweede "Toon resultaten" knop.

`ClassicHeroSearch.tsx` (homepage mobile sheet) blijft ongewijzigd; dat is een andere surface.

## Combined control (per locatie)

```
[ ─────────────  Toon resultaten  ───────────── ][ Bell ]
        flex-[4] (≈80%)                          flex-[1] (≈20%)
        primary, solid                            outline, kleiner
        rounded-l-md rounded-r-none               rounded-l-none rounded-r-md
        border-r-0                                -ml-px
```

- Wrapper: `<div class="flex w-full h-12 items-stretch">`.
- Primair: bestaande primary styling (`bg-primary`, `font-semibold`, `gap-2`, `Search` icon + tekst). `flex-[4]`, alleen rechts geen radius.
- Secundair: `variant="outline"`, `flex-[1]`, alleen links geen radius, `-ml-px` om naadloze rand te maken, `border-l border-border/60`, kleiner icon-only (`Bell` h-4) op mobiel met tooltip/aria-label "Zoekopdracht opslaan". Op `sm:` toont het label "Opslaan" naast de bell als de ruimte het toelaat. Hover: zacht `bg-muted`.
- Beide krijgen dezelfde `h-12` zodat ze als één control voelen.
- Disabled state voor de save-knop wanneer er geen actieve filters zijn (`activeFilterCount === 0`) of gebruiker niet ingelogd is — dan opent klik een toast "Log in om zoekopdrachten te bewaren" via toast + redirect naar `/auth`.

## Save-functionaliteit (echt opslaan)

In `SearchBar.tsx`:
- Toevoegen: `import { useSavedSearches } from '@/hooks/useSavedSearches'`, `useAuth`, `Dialog*`, `Input`, `Label`, `Bell`, `toast`.
- Lokale state: `saveOpen`, `searchName`.
- `const { save } = useSavedSearches();` — die hook doet al `supabase.from('saved_searches').insert(...)` met `user_id`, `name`, `filters` en toont een toast.
- Opslaan met de huidige `filters` state (synced via bestaande useEffect met basis-velden + advanced filters). Dezelfde inhoud als de huidige Search.tsx dialog (naam-veld, "Opslaan" knop).
- Default naam-suggestie genereren uit filters (bv. "Audi A4 onder €25.000") als pre-fill, leegmaken na opslaan.

## Opruimen in `src/pages/Search.tsx`

- Verwijder de losse `Dialog` met "Bewaar zoekopdracht"-knop in de header (regel ±253-293) en de bijhorende states (`saveDialogOpen`, `searchName`, `useSavedSearches` import en `useAuth` indien verder niet gebruikt). Hiermee voorkomen we dubbele opslagknoppen.
- Header behoudt dan alleen titel + telling + filters-drawer.

## Visuele consistentie

- Gebruik bestaande design-tokens (`bg-primary`, `border-border/60`, `text-primary-foreground`, hover-varianten). Geen hardcoded kleuren.
- Beide knoppen samen vullen dezelfde breedte als de huidige losse knop (full width binnen kolom).
- Focus-ring blijft per knop zichtbaar.
- Geen emoji's; Lucide `Search` + `Bell` iconen.

## Technische details

- Geen DB-migratie nodig (`saved_searches` heeft al `name`, `filters`, `user_id`, `paused`, `frequency`).
- Geen edge-function wijziging.
- Bestaande `useSavedSearches.save()` schrijft direct en toont toast — gebruiker ziet de nieuwe alert vervolgens onder `/favorieten?tab=alerts`.

## Out of scope

- `ClassicHeroSearch.tsx` op homepage (andere surface).
- Wijzigingen aan filter-logica zelf.
- Wijzigingen aan favorieten-pagina.

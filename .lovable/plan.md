

# AutoSpy Marketplace Improvements

## Assessment

After reviewing the codebase, **most of what you've described is already implemented**. The project has comprehensive filters (7 categories with 30+ filter options), a sidebar/grid search layout, compare feature, sorting, mobile slide panel, listing cards with icons, and proper navigation. Here's what actually needs improvement:

## Gaps to Address

### 1. Missing Filters
- **Country** (Netherlands / Belgium) — not present
- **City / postal code** input — not present (only province dropdown exists)
- **Radius options** — exists but limited; needs 25/50/100/250km values
- **Engine size filter** — field exists on listings but no filter UI

### 2. Listing Cards Missing Transmission
The `ListingCard` component shows year, mileage, fuel type, and location — but **not transmission**. This is a key spec buyers look for.

### 3. No Pagination
The search results page renders all filtered listings at once. Need pagination (e.g. 24 per page) with page controls.

### 4. Location Filter Improvements
The `FilterPanel` and `HomepageFilters` only have province + radius. Need country selector and city/postal code input.

## Changes

### `src/types/listing.ts`
- Add `COUNTRY_OPTIONS` constant: `[{ value: 'nl', label: 'Nederland' }, { value: 'be', label: 'België' }]`
- Add `RADIUS_OPTIONS` constant: `[25, 50, 100, 250]`
- Add `country?: string` and `postalCode?: string` to `SearchFilters`
- Add `country?: string` to `Listing.location`

### `src/modules/listings/ListingCard.tsx`
- Add transmission icon (Settings2 or similar) between fuel type and location in both default and horizontal variants

### `src/pages/Search.tsx`
- Add pagination state (`page`, `perPage = 24`)
- Slice `filteredListings` by page
- Add pagination controls (prev/next + page numbers) below listings
- Parse `country` and `postalCode` from URL params

### `src/modules/search/FilterPanel.tsx` — Location section
- Add country selector (NL/BE/both)
- Add city/postal code text input
- Update radius options to 25/50/100/250 km

### `src/modules/search/HomepageFilters.tsx` — Location tab
- Same additions: country, city/postal code, radius options

### `src/modules/search/SearchBar.tsx`
- Add `country` and `postalCode` to URL param serialization

### `src/modules/search/FilterChips.tsx`
- Add chip rendering for country and postalCode filters

## Files to Edit

| File | Change |
|------|--------|
| `src/types/listing.ts` | Add country/postalCode types and constants |
| `src/modules/listings/ListingCard.tsx` | Add transmission to card specs |
| `src/pages/Search.tsx` | Add pagination, new filter URL params |
| `src/modules/search/FilterPanel.tsx` | Add country, city/postal, radius options to location section |
| `src/modules/search/HomepageFilters.tsx` | Same location filter additions |
| `src/modules/search/SearchBar.tsx` | Serialize new filter params |
| `src/modules/search/FilterChips.tsx` | Display new filter chips |




## VATUUR Logo Refinement

### Current State
- Desktop header: `h-16` (64px), logo with Car icon + "VATUUR" text at `text-2xl` + bold period
- Mobile header: `h-14` (56px), logo with Car icon + "VATUUR" text at `text-xl` + bold period
- Footer: Logo with icon at `text-xl` with bold period

### User Requests
1. Remove the Car icon box entirely
2. Make the period normal weight (500, not 900)
3. Enlarge the text to nearly fill the header height without changing header height

### Implementation Strategy

**Text Sizing**: 
- Desktop header is 64px tall with padding. Using `text-5xl` (48px) will fill most of the vertical space
- Mobile header is 56px. Using `text-4xl` (36px) will be appropriately scaled
- Footer keeps `text-2xl` for brand consistency in smaller context

**Typography**:
- Remove the separate `<span>` wrapper for the period
- Apply normal `fontWeight: 500` to the entire "VATUUR." string uniformly

**Icon Removal**:
- Delete the `<div>` wrapper containing the Car icon from Header mobile section
- Delete the `<div>` wrapper containing the Car icon from Header desktop section  
- Delete the `<div>` wrapper containing the Car icon from Footer brand section
- Adjust gap/spacing since there's no icon

### Files to Edit
- `src/layouts/Header.tsx`: Remove icon divs, increase font size to `text-5xl` (desktop) and `text-4xl` (mobile), set period to normal weight
- `src/layouts/Footer.tsx`: Remove icon div, keep `text-2xl`, set period to normal weight

### Visual Result
Large, bold VATUUR. logo without icon, filling most of header height while maintaining clean spacing and proportions.


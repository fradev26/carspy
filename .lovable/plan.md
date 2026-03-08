

## Plan: Fix contrast issue on ghost button hover in header

### Root Cause
The `ghost` button variant in `button.tsx` applies `hover:bg-accent hover:text-accent-foreground`. Since `--accent-foreground` is white (`0 0% 100%`), hovering turns text white. The header buttons override `hover:bg-muted` (light gray) but fail to override the text color, resulting in **white text on a light gray background** — nearly invisible.

### Fix — `src/layouts/Header.tsx`

Add `hover:text-foreground` to all desktop nav buttons in the non-transparent (solid) state:

- Change all instances of `"text-foreground hover:bg-muted"` to `"text-foreground hover:bg-muted hover:text-foreground"`
- This applies to: Zoeken, Favorieten, Berichten, Account, and Inloggen buttons (5 occurrences)
- The transparent state (`text-white hover:bg-white/10`) also needs `hover:text-white` to prevent the same issue on the homepage hero

No other files need changes.


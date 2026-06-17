Het rode deel boven de app (mobile status bar / theme-color) komt door de hardcoded `<meta name="theme-color" content="#E11D48" />` in `index.html`. 

Deze meta-tag kleurt de browser-chrome (statusbalk) op mobiel. Omdat hij statisch rood is, blijft hij rood in zowel light als dark mode.

Wijziging:
- Pas de inline theme-detectie script in `<head>` aan zodat het naast `classList` en `colorScheme` ook het `theme-color` meta-element dynamisch update.
- Light mode → `#F8FAFC` (matches `--background`)
- Dark mode → `#13161B` (matches `--background` dark)

Bestand: `index.html` (enkel het inline script en de meta-tag).
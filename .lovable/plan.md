

## Plan: Mobiel header-icoon omzetten naar accountmenu

### Wat
Het vergrootglas-icoon rechtsboven in de mobiele header vervangen door een **Menu/hamburger-icoon** (of `MoreVertical`/`Menu`) dat een **Sheet (slide-in menu)** opent met:
- Account-links (Mijn advertenties, Favorieten, Berichten — als ingelogd)
- Inloggen/Registreren (als niet ingelogd)
- Zakelijk Dashboard (als dealer)
- Legal: Privacybeleid, Algemene voorwaarden
- Uitloggen

### Bestand: `src/layouts/Header.tsx`

**Wijzigingen:**
1. Vervang `Search` icoon door `Menu` icoon uit lucide-react
2. Verwijder de `<Link to="/zoeken">` wrapper — vervang door een `<button>` die een Sheet opent
3. Voeg een `Sheet` component toe (al beschikbaar in `src/components/ui/sheet.tsx`) met:
   - Als **ingelogd**: Dashboard, Favorieten, Berichten, Zakelijk Dashboard (dealer), scheidingslijn, Privacy, Voorwaarden, scheidingslijn, Uitloggen
   - Als **niet ingelogd**: Inloggen, scheidingslijn, Privacy, Voorwaarden
4. Import `Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger` + `Menu` icoon

Geen andere bestanden hoeven gewijzigd te worden.


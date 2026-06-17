
# Herontwerp Instellingen — VATUUR Zakelijk

Een complete rebuild van `src/pages/dealer/Settings.tsx` naar een compacte, rij-gebaseerde lijststijl à la Stripe/Linear/Notion, passend in de bestaande donkere VATUUR-stijl.

## Structuur

1. **SEOHead** (ongewijzigd, noindex).
2. **Bedrijfskaart** (bovenaan, licht verhoogd):
   - Bedrijfsnaam (`profile.dealer_name` → fallback `full_name` → "Test Garage")
   - BTW (`profile.vat_number`)
   - Knop "Profiel bewerken" met pencil icoon → `/account/profiel`
   - Lichte border, `bg-card`, `rounded-xl`, subtiele shadow.
3. **4 secties** met kleine accent-gekleurde titel, en een container (`rounded-xl border bg-card divide-y`) met rijen:
   - **Koppelingen**: AutoScout24, Marktplaats, Mobile.de, Facebook Marketplace
   - **Voorraad**: Voorraadvoorkeuren, Prijsinstellingen, Automatische publicatie
   - **Account**: Gebruikers beheren, Meldingen, Beveiliging, Abonnement
   - **Ondersteuning**: Support, Contact, Over VATUUR

## Row-component

Nieuw lokaal component `SettingsRow` (binnen Settings.tsx, geen apart bestand):
- `<Link>` of `<button>` met `flex items-center justify-between`
- Hoogte `h-14` (56px), `px-4 md:px-5`
- Linker icoon (lucide) + label (`text-sm font-medium`), optionele subtitel `text-xs text-muted-foreground`
- Rechts `ChevronRight` icoon, `text-muted-foreground`
- Hover: `hover:bg-muted/40`, actieve tap: `active:bg-muted/60`, `transition-colors`

## Routes / acties per rij

| Rij | Doel |
|---|---|
| AutoScout24 | opent AutoScoutPanel in een Sheet/Dialog of inline (zie hieronder) |
| Marktplaats, Mobile.de, Facebook Marketplace | `disabled`-rij met badge "Binnenkort" |
| Voorraadvoorkeuren | `/zakelijk/voorraad` |
| Prijsinstellingen | placeholder (toast "Binnenkort beschikbaar") |
| Automatische publicatie | placeholder toast |
| Gebruikers beheren | placeholder toast |
| Meldingen | `/account/meldingen` |
| Beveiliging | `/account/privacy` |
| Abonnement | placeholder toast |
| Support | `/help` |
| Contact | `/contact` |
| Over VATUUR | `/` (of placeholder) |

`AutoScoutPanel` blijft beschikbaar maar wordt verplaatst naar een Sheet die opent vanaf de AutoScout24-rij, zodat de hoofdpagina compact blijft en alles zichtbaar zonder veel scrollen.

## Stijl-details

- Sectietitel: `text-xs font-semibold uppercase tracking-wider text-primary/80 px-1 mb-2`
- Container: `rounded-xl border border-border/60 bg-card overflow-hidden divide-y divide-border/60`
- Pagina-wrapper: `container max-w-2xl py-6 space-y-6 pb-24` (bottom-nav clearance)
- Mobiel-first; werkt ook netjes op desktop door `max-w-2xl`
- Iconen consistent `h-4 w-4 text-muted-foreground`
- Animaties: alleen `transition-colors` op rijen, geen scale-effecten (Linear-stijl rust)

## Bestanden

- **Edit** `src/pages/dealer/Settings.tsx` — volledige rewrite volgens bovenstaande structuur.
- Geen wijzigingen aan routes, layout, BottomNav of AutoScoutPanel zelf.

## Out of scope

- Echte implementatie van Marktplaats / Mobile.de / Facebook-koppelingen, prijsinstellingen, gebruikersbeheer, abonnementen — deze rijen tonen placeholders/toasts zodat de visuele structuur compleet is.

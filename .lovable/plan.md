

# Audit: Problemen die investeerders kunnen afschrikken

Na een grondige analyse van de volledige codebase heb ik de volgende problemen geidentificeerd, ingedeeld per ernst.

---

## KRITIEK - Direct zichtbare problemen

### 1. 404-pagina is in het Engels
De NotFound-pagina toont "Oops! Page not found" en "Return to Home" terwijl de hele site in het Nederlands is. Dit breekt de consistentie en oogt onprofessioneel.

**Oplossing:** Vertaal naar Nederlands, voeg SEOHead toe, en gebruik een Link-component in plaats van een `<a>`-tag.

### 2. Footer-links naar "#" (dode links)
De footer bevat 5 links die naar `#` wijzen: Help center, Veelgestelde vragen, Privacybeleid, Algemene voorwaarden, en Cookies. Dit ziet er onaf uit bij een demo.

**Oplossing:** Maak aparte placeholder-pagina's aan voor de belangrijkste juridische pagina's (Privacy, Voorwaarden), of link naar de homepage FAQ voor "Veelgestelde vragen".

### 3. Nep-contactgegevens zichtbaar
De footer en JSON-LD tonen nepgegevens: "Autoweg 123, 1234 AB Amsterdam", "0800-123 4567", "info@autospy.nl". Dit kan vragen oproepen bij investeerders over legitimiteit.

**Oplossing:** Vervang door een generiek "Neem contact op"-formulier of verwijder de specifieke adresgegevens en toon alleen het e-mailadres.

### 4. Porsche ontbreekt in CAR_BRANDS
De mockdata bevat nu een Porsche Taycan (listing 15), maar "Porsche" staat niet in de `CAR_BRANDS` array in `types/listing.ts`. Dit betekent dat je Porsche niet kunt selecteren bij het verkopen of filteren.

**Oplossing:** Voeg "Porsche" toe aan de `CAR_BRANDS` array en `CAR_MODELS` mapping.

---

## HOOG - Functionele problemen

### 5. Share-knop doet niets
De Share-knop op de detailpagina (`<Share2>`) heeft geen onClick-handler. Een investeerder die dit probeert zal een niet-werkende knop zien.

**Oplossing:** Implementeer een eenvoudige share-functie met `navigator.share()` of kopieer de URL naar het klembord.

### 6. "Stuur bericht"-knop op detailpagina toont alleen een toast
De bericht-knop toont "Beschikbaar zodra er echte listings zijn" -- dit is een dev-message die investeerders niet moeten zien.

**Oplossing:** Navigeer naar de berichtenpagina of toon een professioneler bericht zoals "Deze functie is binnenkort beschikbaar".

### 7. Sell-formulier mist validatie tussen stappen
Je kunt door alle stappen klikken zonder verplichte velden in te vullen. Bij het overzicht staan dan lege velden.

**Oplossing:** Voeg stap-validatie toe die controleert of verplichte velden ingevuld zijn voordat je naar de volgende stap kunt.

### 8. Header zoekbalk doet niets nuttigs
De zoekbalk in de header navigeert naar `/zoeken?q=...` maar de zoekpagina filtert niet op `q`-parameter. De zoekterm wordt dus genegeerd.

**Oplossing:** Voeg een `q` (query) filter toe aan de zoekpagina die filtert op titel/merk/model.

---

## MEDIUM - Visuele en UX-problemen

### 9. "Vandaag toegevoegd" is niet waar
De homepage toont "Vandaag toegevoegd" bij de nieuwste advertenties, maar dit zijn statische mockdata. Investeerders die dit twee keer bekijken zien dezelfde "vandaag toegevoegde" auto's.

**Oplossing:** Verander naar "Uitgelichte advertenties" of "Recent toegevoegd".

### 10. "25.000+ auto's" claim versus 20 mocklistings
De hero-sectie claimt "25.000+ auto's" maar er zijn er maar 20. Bij het zoeken zie je direct dat dit niet klopt.

**Oplossing:** Verander naar een meer generieke tekst zoals "Vind jouw perfecte occasion" zonder specifieke aantallen.

### 11. Telefoonknop op detailpagina is niet klikbaar
De telefoonknop toont het nummer maar linkt niet naar `tel:`. Een investeerder op mobiel kan niet direct bellen.

**Oplossing:** Wrap de button in een `<a href="tel:...">`.

### 12. Geen loading state bij afbeeldingen op homepage
Als Unsplash-afbeeldingen langzaam laden, zien gebruikers lege kaarten. De shimmer-animatie werkt alleen op de ListingCard maar er is geen fallback bij netwerk-problemen.

**Oplossing:** Dit is al deels geimplementeerd via de shimmer in ListingCard -- controleer of het werkt met de nieuwe Unsplash URLs.

---

## Implementatieplan

### Bestanden die worden aangepast:
1. **src/pages/NotFound.tsx** -- Vertaling naar Nederlands + SEOHead
2. **src/layouts/Footer.tsx** -- Dode links fixen, contactgegevens aanpassen
3. **src/types/listing.ts** -- Porsche toevoegen aan CAR_BRANDS en CAR_MODELS
4. **src/pages/ListingDetail.tsx** -- Share-knop werkend maken, telefoonlink toevoegen, bericht-toast aanpassen
5. **src/pages/Index.tsx** -- "Vandaag toegevoegd" en "25.000+" tekst aanpassen
6. **src/pages/Sell.tsx** -- Stap-validatie toevoegen
7. **src/pages/Search.tsx** -- Zoekterm `q` parameter ondersteunen

### Bestanden die worden aangemaakt:
Geen nieuwe bestanden nodig.

### Volgorde:
Alle wijzigingen zijn onafhankelijk en kunnen parallel worden uitgevoerd. Geschatte omvang: ~150 regels code aanpassingen verspreid over 7 bestanden.


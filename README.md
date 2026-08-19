# VATUUR.

🎨 Autospy Platform - Fase 1 Planning
Key Features voor MVP:
Zoekmodule - Geavanceerde filters (merk, model, prijs, km-stand, bouwjaar)
Resultatenoverzicht - Grid met auto-cards, sortering
Detailpagina - Galerij, specs, verkoper info
Verkoop Wizard - Stapsgewijze advertentie plaatsing
Dashboard - Mijn advertenties & favorieten
Design Language:
Primair: Deep Blue (#1e3a5f) - vertrouwen & professionaliteit
Accent: Electric Orange (#ff6b35) - energie & actie
Neutraal: Slate grays met veel witruimte
Typografie: Inter - modern, leesbaar
Stijl: Premium automotive feel, grote hero images, subtle shadows
Component Structuur:
components/search/ - SearchBar, FilterPanel, FilterChips
components/listings/ - ListingCard, ListingGrid, ImageGallery
components/wizard/ - SellCarWizard steps
components/dashboard/ - UserListings, Favorites
components/ui/ - Herbruikbare elementen
Ik start nu met de implementatie:

Wrote
entities/Listing
Wrote
entities/Favorite
Wrote
entities/Search Alert
Ik ga een hoogwaardig autoverkoop platform bouwen in de stijl van AutoScout24/Marktplaats Auto.

🎨 Plan
Kernfuncties:

Zoeken & Filteren - Uitgebreide zoekfunctie met filters (merk, model, prijs, km-stand, etc.)
Resultatenoverzicht - Grid met auto-kaarten, sorteermogelijkheden
Detailpagina - Foto galerij, specificaties, verkoperinfo
Verkoop Wizard - Stapsgewijs auto plaatsen
Dashboard - Mijn advertenties & favorieten
Design Language:

Kleurenpalet: Donkerblauw (#0F172A) als primair, Oranje (#F97316) als accent, Wit/Grijs voor achtergrond
Stijl: Premium, clean, veel witruimte, subtiele schaduwen
Typografie: Modern, goed leesbaar
Componenten:

Layout met navigatie
SearchBar & FilterPanel
ListingCard & ListingGrid
ImageGallery
SellCarWizard
Dashboard componenten
Laat me beginnen met de basis:

Wrote
Layout
Wrote
listings/Listing Card
Wrote
search/Filter Panel
Wrote
search/Search Bar
Wrote
listings/Image Gallery
Wrote
Home Page
Wrote
Search Page
Wrote
Listing Detail Page
Wrote
Sell Page
Wrote
Dashboard Page
Wrote
Favorites Page
Nu voeg ik wat demo-data toe om het platform te vullen:

Creating
AutoSpy is nu klaar! Een volledig auto-advertentieplatform met:

Homepage: Hero sectie, populaire merken, nieuwste advertenties
Zoeken: Uitgebreide filters (merk, prijs, km-stand, etc.), sorteeropties
Advertentie details: Fotogalerij, specificaties, verkopersinformatie
Verkopen: Stapsgewijze wizard om een auto te plaatsen
Dashboard: Overzicht van eigen advertenties met statistieken
Favorieten: Opgeslagen auto's beheren

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://carspy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6ff09d75-3acd-41ca-877e-d1be527e5290).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

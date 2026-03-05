

# Visuele Optimalisaties — Plan

## Gevonden verbeterpunten

Na analyse van de codebase zijn dit de visuele optimalisaties die toegepast kunnen worden:

### 1. Vloeiende tab-overgangen (Dashboard, Auth, BusinessDashboard)
Tabs wisselen momenteel abrupt van inhoud. Door een fade+slide animatie toe te voegen aan `TabsContent` wordt het wisselen vloeiend.

**Bestand:** `src/components/ui/tabs.tsx`
- Voeg `data-[state=active]:animate-fade-in` toe aan TabsContent
- Voeg `transition-all duration-200` toe aan TabsTrigger voor een vloeiende active-state overgang

### 2. Pagina-overgangen in AppLayout
Bij navigatie tussen pagina's verschijnt content abrupt.

**Bestand:** `src/layouts/AppLayout.tsx`
- Wrap `<Outlet />` in een container met `animate-fade-in` class zodat elke paginawissel een subtiele fade-in krijgt

### 3. Card hover-effecten verbeteren
ListingCard heeft al hover, maar cards in Dashboard en andere pagina's missen consistente hover-lift.

**Bestand:** `src/components/ui/card.tsx`
- Voeg `transition-all duration-300` toe als standaard op de Card component

### 4. Auth-pagina glow-effect activeren
De `.glow-auth` utility class bestaat al in CSS maar wordt nergens gebruikt.

**Bestand:** `src/pages/Auth.tsx`
- Voeg `glow-auth` class toe aan de achtergrond-container van de auth-pagina

### 5. Bottom navigation active-state animatie
De BottomNav wisselt nu zonder visuele overgang van active state.

**Bestand:** `src/components/BottomNav.tsx`
- Voeg een animated dot/indicator toe onder het actieve item met `scale-in` animatie

### 6. Image loading shimmer consistentie
ListingCard heeft een shimmer, maar de Favorites en Dashboard loading states gebruiken alleen een spinner.

**Bestand:** `src/components/ui/skeleton-card.tsx`
- Controleer of shimmer-animatie consistent wordt toegepast

## Samenvatting wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/ui/tabs.tsx` | Fade-in animatie op TabsContent, smooth trigger transition |
| `src/layouts/AppLayout.tsx` | Fade-in wrapper rond Outlet |
| `src/components/ui/card.tsx` | Standaard transition op Card |
| `src/pages/Auth.tsx` | glow-auth achtergrond toevoegen |
| `src/components/BottomNav.tsx` | Animated active indicator |

Alle animaties gebruiken bestaande keyframes uit `tailwind.config.ts` — er hoeven geen nieuwe animaties aangemaakt te worden.


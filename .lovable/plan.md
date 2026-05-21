# AI-prijsanalyse: detecteer wijzigingen en biedt reset

## Doel
In de Sell-wizard (stap 4 — Prijs & Beschrijving) moet de AI-analyse altijd matchen met de huidige voertuigdata. Wanneer een gebruiker terugkeert naar een eerdere stap en iets aanpast, moet de bestaande analyse als "verouderd" gemarkeerd worden, met een duidelijke knop om opnieuw te berekenen.

## Wijzigingen — `src/pages/Sell.tsx`

### 1. Snapshot bijhouden van velden die de analyse beïnvloeden
De velden die de AI-analyse voeden zijn: `brand`, `model`, `year`, `mileage`, `fuelType`, `transmission`, `power`, `bodyType`, `price`.

Voeg een nieuwe state toe:
```ts
const [analysisSnapshot, setAnalysisSnapshot] = useState<string | null>(null);
```

Bij een succesvolle `fetchAnalysis()` wordt deze snapshot ingesteld op een stabiele hash/JSON van de relevante velden op het moment van de call.

### 2. "Stale" detectie
Een afgeleide waarde `isAnalysisStale` is `true` als:
- er een `analysisResult` bestaat, én
- de huidige snapshot afwijkt van `analysisSnapshot`.

### 3. UI-feedback bij verouderde analyse
Boven de bestaande analyse-card (en alleen zichtbaar wanneer `isAnalysisStale`):

- Een waarschuwingsbanner met `AlertTriangle`-icoon: tekst "Analyse verouderd — gegevens zijn gewijzigd sinds de laatste berekening".
- Primaire knop "Analyse opnieuw berekenen" die `fetchAnalysis()` opnieuw aanroept.
- De bestaande resultaten worden licht gedimd (`opacity-60`) zodat duidelijk is dat ze niet meer actueel zijn.

### 4. Reset-knop altijd beschikbaar
Naast de bestaande "Opnieuw proberen" (alleen bij error) komt er bij een succesvolle analyse altijd een subtiele tekstknop "Analyse vernieuwen" (met `RefreshCw`-icoon) in de header van de analyse-sectie. Hiermee kan de gebruiker handmatig een nieuwe berekening forceren, ook zonder wijzigingen.

### 5. Geen caching van verouderde data
- Bij een nieuwe `fetchAnalysis()` wordt `analysisResult` eerst op `null` gezet (zodat de oude waarden niet kort blijven hangen) en wordt de loader getoond.
- Update de snapshot pas ná een succesvolle response.

### 6. Automatische trigger bij prijswijziging op stap 4
Wanneer de gebruiker zelf de prijs aanpast op stap 4 (het veld `price` zit op deze stap), wordt de analyse als stale gemarkeerd — niet automatisch opnieuw uitgevoerd, om onnodige AI-calls te vermijden. De gebruiker beslist via de CTA.

## Technische samenvatting
- Eén helper `getAnalysisSignature(formData)` → string met alle analyse-relevante velden.
- `fetchAnalysis` zet `analysisSnapshot = getAnalysisSignature(formData)` na succes.
- `isAnalysisStale = analysisResult && analysisSnapshot !== getAnalysisSignature(formData)`.
- Nieuwe banner + reset-CTA in de bestaande step-3-render, gebruikmakend van bestaande design tokens (`bg-warning/10`, `text-warning`, `Button variant="outline"`).
- Geen wijzigingen in edge functions of business logic.

## Resultaat
De gebruiker ziet altijd direct of de getoonde AI-prijsanalyse nog overeenkomt met de huidige invoer, en kan met één klik een verse berekening triggeren.

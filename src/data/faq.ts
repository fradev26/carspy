export type FaqCategory =
  | 'kopen'
  | 'verkopen'
  | 'dealeraccount'
  | 'betalingen'
  | 'veiligheid'
  | 'account';

export interface FaqEntry {
  q: string;
  a: string;
  category: FaqCategory;
}

export const FAQ_CATEGORIES: { value: FaqCategory; label: string }[] = [
  { value: 'kopen', label: 'Kopen' },
  { value: 'verkopen', label: 'Verkopen' },
  { value: 'dealeraccount', label: 'Dealeraccount' },
  { value: 'betalingen', label: 'Betalingen' },
  { value: 'veiligheid', label: 'Veiligheid' },
  { value: 'account', label: 'Account' },
];

export const FAQS: FaqEntry[] = [
  // Kopen
  { category: 'kopen', q: 'Hoe neem ik contact op met een verkoper?', a: 'Open de advertentie en klik op "Bericht" om de verkoper rechtstreeks te bereiken via het VATUUR-berichtensysteem. Voor dealers kan je vaak ook telefonisch contact opnemen.' },
  { category: 'kopen', q: 'Kan ik een proefrit aanvragen?', a: 'Ja. Vraag dit via het berichtensysteem aan bij de verkoper. Dealers reageren meestal binnen één werkdag.' },
  { category: 'kopen', q: 'Wat doet de VATUUR AI-prijsanalyse?', a: 'Onze AI vergelijkt de vraagprijs met soortgelijke wagens op de markt en geeft een dealscore van 1 tot 10, met tips voor onderhandeling.' },
  { category: 'kopen', q: 'Hoe weet ik of een advertentie betrouwbaar is?', a: 'Let op het type verkoper (particulier of dealer), volledige historiek, recente foto’s en de AI-analyse. Twijfel je? Stel gerust extra vragen via het berichtensysteem.' },

  // Verkopen
  { category: 'verkopen', q: 'Hoe plaats ik een advertentie?', a: 'Klik op "Auto verkopen" en doorloop de wizard in 5 stappen. De AI helpt je met een eerlijke prijsindicatie en een verkoopstekst.' },
  { category: 'verkopen', q: 'Wat kost het om mijn wagen te verkopen?', a: 'Particulieren plaatsen gratis een advertentie. Boosts en premiumposities zijn optioneel om je advertentie hoger in de zoekresultaten te tonen.' },
  { category: 'verkopen', q: 'Hoe verleng of boost ik mijn advertentie?', a: 'Ga naar Account → Mijn advertenties. Daar kan je per advertentie verlengen, boosten, markeren als verkocht of verwijderen.' },
  { category: 'verkopen', q: 'Welke foto’s werken het best?', a: 'Minimaal 6 scherpe foto’s in daglicht: vooraan, achteraan, beide zijkanten, interieur en dashboard. Auto’s met meer foto’s krijgen significant meer weergaven.' },

  // Dealeraccount
  { category: 'dealeraccount', q: 'Hoe maak ik een dealeraccount aan?', a: 'Kies bij registratie voor "Ik ben dealer" en vul je btw-nummer in. Na validatie krijg je toegang tot het Zakelijk Dashboard.' },
  { category: 'dealeraccount', q: 'Welke statistieken zie ik als dealer?', a: 'Per advertentie: weergaven, favorieten, berichten en conversie. Op accountniveau: leadoverzicht, voorraadstatus en AI-marktanalyse.' },
  { category: 'dealeraccount', q: 'Kan ik mijn voorraad importeren?', a: 'Ja, via een CSV-import of via een AutoScout24-sync. Neem contact op met support voor toegang.' },

  // Betalingen
  { category: 'betalingen', q: 'Wordt de betaling via VATUUR afgehandeld?', a: 'Nee. VATUUR is een advertentieplatform — koper en verkoper regelen de betaling onderling. Wij raden aan om bij ophalen te betalen.' },
  { category: 'betalingen', q: 'Hoe factureer ik boosts of premiumposities?', a: 'Facturen vind je terug in je Zakelijk Dashboard onder "Facturatie". Dealers ontvangen automatisch een btw-factuur per e-mail.' },

  // Veiligheid
  { category: 'veiligheid', q: 'Hoe vermijd ik oplichting?', a: 'Maak nooit geld over zonder de wagen te zien. Vraag altijd om het chassisnummer, controleer de papieren en bezoek de wagen op een veilige locatie.' },
  { category: 'veiligheid', q: 'Hoe rapporteer ik een verdachte advertentie?', a: 'Gebruik de "Meld" knop op de advertentie of stuur een bericht naar support@vatuur.be met de link.' },

  // Account
  { category: 'account', q: 'Hoe wijzig ik mijn wachtwoord?', a: 'Ga naar Account → Profiel → Wachtwoord. Je ontvangt een bevestigingsmail om de wijziging te activeren.' },
  { category: 'account', q: 'Hoe verwijder ik mijn account?', a: 'Neem contact op met support via support@vatuur.be. Wij verwijderen je gegevens binnen 14 dagen conform GDPR.' },
  { category: 'account', q: 'Hoe beheer ik mijn meldingen?', a: 'Ga naar Account → Meldingen om per categorie aan/uit te zetten (berichten, zoekalerts, advertentiestatus, marketing).' },
];

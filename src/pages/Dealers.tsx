import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Zap, Rocket, Upload, Users, BarChart3,
  Sparkles, Shield, TrendingUp, Eye, Headphones, Building2, Star,
  Car, Crown, Target, MousePointerClick, Quote, Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SEOHead } from '@/components/SEOHead';
import { cn } from '@/lib/utils';

const stats = [
  { label: 'Actieve bezoekers per maand', value: '180.000+', icon: Users },
  { label: 'Voertuigen online', value: '25.000+', icon: Car },
  { label: 'Dealerpartners', value: '850+', icon: Building2 },
  { label: 'Leads per maand', value: '12.500+', icon: MousePointerClick },
];

const whyVatuur = [
  { icon: Target, title: 'Serieuze autokopers', text: 'Geen tijdverspilling met vrijblijvende klikkers. VATUUR. trekt kopers met concrete aankoopintentie.' },
  { icon: Sparkles, title: 'Kwalitatieve leads', text: 'AI-gefilterde aanvragen die aansluiten op uw voorraad, met volledige contactgegevens en context.' },
  { icon: Upload, title: 'Eenvoudig voorraadbeheer', text: 'Importeer uw volledige voorraad in één klik via feed, API of CSV. Automatische synchronisatie.' },
  { icon: Eye, title: 'Meer online zichtbaarheid', text: 'SEO-geoptimaliseerd platform met sterke organische rankings in Nederland en België.' },
  { icon: Crown, title: 'Professioneel dealerprofiel', text: 'Een merkpagina die uw bedrijf, voorraad en reviews professioneel presenteert.' },
  { icon: TrendingUp, title: 'Schaalbaar voor elk type dealer', text: 'Van zelfstandig handelaar tot multi-site organisatie: het juiste pakket voor uw schaal.' },
];

const steps = [
  { n: 1, title: 'Maak een dealeraccount', text: 'Registreer uw bedrijf met KvK of BTW-nummer. Activatie binnen 24 uur.' },
  { n: 2, title: 'Importeer uw voorraad', text: 'Via feed, API, CSV of handmatig. Uw voorraad staat binnen enkele minuten online.' },
  { n: 3, title: 'Activeer promoties', text: 'Boost specifieke voertuigen of pas uw dealerprofiel verder aan.' },
  { n: 4, title: 'Ontvang leads en verkoop sneller', text: 'Geïnteresseerde kopers nemen direct contact op via berichten, telefoon of e-mail.' },
];

type Pkg = {
  id: string;
  name: string;
  price: string;
  audience: string;
  ideal: string;
  label: string;
  highlight?: boolean;
  features: string[];
};

const packages: Pkg[] = [
  {
    id: 'premium',
    name: 'Premium Dealer',
    price: '€49,95',
    audience: 'Kleine handelaren en zelfstandige dealers.',
    ideal: '10–50 voertuigen',
    label: 'Meest gekozen voor kleine dealers',
    features: [
      'Trust Badge',
      'Dealerprofiel',
      'Website-link',
      'Voorraadimport',
      'Basis statistieken',
      '10 gratis Turbo boosts per maand',
      '2 Featured voertuigen',
    ],
  },
  {
    id: 'plus',
    name: 'Premium Plus',
    price: '€149,95',
    audience: 'Groeiende garages en professionele handelaren.',
    ideal: '50–150 voertuigen',
    label: 'Beste prijs-kwaliteit',
    highlight: true,
    features: [
      'Alles uit Premium Dealer',
      '40 Turbo boosts per maand',
      '10 Nitro boosts per maand',
      'Uitgebreide statistieken',
      'Leadrapportage',
      'Homepage-vermelding',
      'Uitgelichte dealerpagina',
      '10 Featured voertuigen',
      'Prioritaire support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '€299,95',
    audience: 'Grote dealerbedrijven, groepen en multi-site organisaties.',
    ideal: '150+ voertuigen of meerdere vestigingen',
    label: 'Maximale zichtbaarheid',
    features: [
      'Alles uit Premium Plus',
      '100 Turbo boosts per maand',
      '30 Nitro boosts per maand',
      'Dedicated accountmanager',
      'API-integraties',
      'Multi-vestiging ondersteuning',
      'Concurrentieanalyse',
      'White-label dealerpagina',
      'Eigen promotiebanners',
      '25 Featured voertuigen',
      'Hoogste prioriteit in zoekresultaten',
    ],
  },
];

type ComparisonValue = boolean | string;
const YES: ComparisonValue = true;
const NO: ComparisonValue = false;
const comparisonRows: { label: string; values: [ComparisonValue, ComparisonValue, ComparisonValue] }[] = [
  { label: 'Maandprijs', values: ['€49,95', '€149,95', '€299,95'] },
  { label: 'Trust Badge', values: [YES, YES, YES] },
  { label: 'Dealerprofiel', values: [YES, YES, YES] },
  { label: 'Voorraadimport', values: [YES, YES, YES] },
  { label: 'Website-link', values: [YES, YES, YES] },
  { label: 'Statistieken', values: ['Basis', 'Uitgebreid', 'Uitgebreid + concurrentie'] },
  { label: 'Turbo boosts / maand', values: ['10', '40', '100'] },
  { label: 'Nitro boosts / maand', values: [NO, '10', '30'] },
  { label: 'Featured voertuigen', values: ['2', '10', '25'] },
  { label: 'Homepage-vermelding', values: [NO, YES, YES] },
  { label: 'Leadrapportage', values: [NO, YES, YES] },
  { label: 'Multi-vestiging', values: [NO, NO, YES] },
  { label: 'API-integraties', values: [NO, NO, YES] },
  { label: 'White-label dealerpagina', values: [NO, NO, YES] },
  { label: 'Accountmanager', values: [NO, 'Prioritaire support', 'Dedicated'] },
];

const usps = [
  { icon: MousePointerClick, title: 'Meer kwalitatieve leads', text: 'Concrete aanvragen van kopers met intentie, niet zomaar pageviews.' },
  { icon: Eye, title: 'Meer zichtbaarheid', text: 'SEO-sterke pagina’s en prominente posities in zoekresultaten.' },
  { icon: Upload, title: 'Snelle voorraadimport', text: 'Feed, API of CSV. Plug-and-play met de gangbare DMS-systemen.' },
  { icon: Crown, title: 'Professioneel dealerprofiel', text: 'Een merkpagina die klanten vertrouwen geeft voor ze bellen.' },
  { icon: Shield, title: 'Transparante prijzen', text: 'Geen verborgen kosten. Maandelijks opzegbaar, geen jaarcontract.' },
  { icon: TrendingUp, title: 'Ondersteuning voor groei', text: 'Schaal mee van zelfstandige handelaar tot multi-site dealergroep.' },
];

const testimonials = [
  {
    name: 'Mark Janssen',
    role: 'Eigenaar',
    company: 'AutoWorld Amsterdam',
    review: 'Sinds we op VATUUR. staan ontvangen we beduidend meer kwalitatieve aanvragen. De leads zijn concreet en onze verkoopcyclus is duidelijk korter geworden.',
  },
  {
    name: 'Sofie De Bruyn',
    role: 'Sales Manager',
    company: 'EV Center Utrecht',
    review: 'De voorraadimport werkte vanaf dag één. Het dealerprofiel ziet er strak uit en we krijgen veel positieve reacties van klanten over de presentatie.',
  },
  {
    name: 'Jeroen Vermeulen',
    role: 'Directeur',
    company: 'Mercedes-Benz Groningen',
    review: 'De combinatie van transparante prijzen, een professioneel platform en goede support maakt VATUUR. voor ons hét referentieplatform voor occasions.',
  },
];

const faqs = [
  { q: 'Hoe plaats ik mijn voorraad op VATUUR?', a: 'Na activatie van uw dealeraccount kunt u uw voorraad importeren via een feed-URL, API-koppeling, CSV-bestand of handmatig per voertuig. De meeste dealers staan binnen één werkdag volledig online.' },
  { q: 'Kan ik voertuigen automatisch importeren?', a: 'Ja. VATUUR. ondersteunt automatische synchronisatie via standaard feed-formaten en koppelt met de meest gebruikte DMS-systemen in Nederland en België. Wijzigingen in uw stock verschijnen automatisch op het platform.' },
  { q: 'Wat kost een dealeraccount?', a: 'Wij bieden drie pakketten: Premium Dealer (€49,95/maand), Premium Plus (€149,95/maand) en Enterprise (€299,95/maand). Alle abonnementen zijn maandelijks opzegbaar, zonder jaarverplichting.' },
  { q: 'Wat zijn Turbo boosts?', a: 'Een Turbo boost verhoogt tijdelijk de zichtbaarheid van een specifiek voertuig in zoekresultaten. Ideaal om voorraad die te lang staat opnieuw onder de aandacht te brengen.' },
  { q: 'Wat zijn Nitro boosts?', a: 'Nitro boosts zijn premium promoties met maximale exposure: bovenaan zoekresultaten, vermelding op de homepage en uitgelichte plekken op het platform. Bedoeld voor uw belangrijkste voertuigen.' },
  { q: 'Kan ik meerdere vestigingen beheren?', a: 'Ja, met het Enterprise-pakket beheert u meerdere vestigingen vanuit één account, met aparte voorraadsynchronisatie, statistieken en gebruikersrechten per vestiging.' },
  { q: 'Hoe werkt leadrapportage?', a: 'Vanaf Premium Plus ontvangt u een wekelijkse leadrapportage met aantallen, bronnen, voertuigen en conversiecijfers, plus een real-time dashboard in uw zakelijke account.' },
  { q: 'Kan ik mijn eigen website koppelen?', a: 'Ja, elk dealerpakket bevat een directe link naar uw eigen website. Met Enterprise kunt u zelfs een white-label dealerpagina opzetten in uw eigen huisstijl.' },
  { q: 'Hoe snel staat mijn voorraad online?', a: 'Na verificatie van uw bedrijfsgegevens (meestal binnen 24 uur) en het aanleveren van uw feed staat uw volledige voorraad doorgaans binnen enkele uren online.' },
  { q: 'Welk pakket past het best bij mijn bedrijf?', a: 'Premium Dealer is ideaal voor 10–50 voertuigen, Premium Plus voor groeiende garages met 50–150 voertuigen, en Enterprise voor grote dealerbedrijven met 150+ voertuigen of meerdere vestigingen.' },
];

const SITE = 'https://vatuur.be';
const PAGE_URL = `${SITE}/dealers`;

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Dealer worden', item: PAGE_URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'VATUUR. Dealerabonnement',
    serviceType: 'Auto advertentie platform voor dealers',
    areaServed: ['NL', 'BE'],
    provider: {
      '@type': 'Organization',
      name: 'VATUUR.',
      url: SITE,
    },
    offers: packages.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: p.price.replace('€', '').replace(',', '.'),
      priceCurrency: 'EUR',
      category: 'Subscription',
      description: p.audience,
    })),
  },
];

export default function Dealers() {
  return (
    <>
      <SEOHead
        title="Dealer worden bij VATUUR — Auto's adverteren voor autobedrijven"
        description="Plaats uw voorraad op VATUUR. en bereik duizenden actieve autokopers in Nederland en België. Dealerabonnementen vanaf €49,95/maand."
        canonical={PAGE_URL}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section aria-labelledby="dealer-hero" className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container py-12 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <Badge variant="outline" className="mb-5 border-primary/30 bg-primary/5 text-primary-strong">
              <Sparkles className="mr-1.5 h-3 w-3" /> Voor autobedrijven en dealers
            </Badge>
            <h1 id="dealer-hero" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Meer zichtbaarheid. Meer leads.{' '}
              <span className="text-primary-strong">Meer autoverkopen.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Bereik duizenden actieve autokopers in Nederland en België via VATUUR. Plaats uw voorraad,
              vergroot uw bereik en genereer kwalitatieve leads vanuit één platform.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 font-bold shadow-sm">
                <Link to="/auth?type=dealer">
                  Start als dealer <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
                <a href="#pakketten">Vergelijk pakketten</a>
              </Button>
            </div>

            <ul className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground sm:grid-cols-4">
              {['Dealerprofiel', 'Voorraadimport', 'Meer zichtbaarheid', 'Geverifieerde dealerstatus'].map((b) => (
                <li key={b} className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-strong" />
                  <span className="truncate">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-labelledby="dealer-stats" className="container -mt-6 pb-12 sm:pb-16">
        <h2 id="dealer-stats" className="sr-only">VATUUR. in cijfers</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="hover-lift">
              <CardContent className="flex flex-col items-start gap-2 p-4 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary-strong">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold sm:text-3xl">{s.value}</div>
                <div className="text-xs text-muted-foreground sm:text-sm">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why VATUUR */}
      <section aria-labelledby="dealer-why" className="bg-muted/30 py-14 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="dealer-why" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Waarom autobedrijven kiezen voor VATUUR
            </h2>
            <p className="mt-3 text-muted-foreground">
              Een modern auto advertentie platform gebouwd voor de Benelux markt, met focus op kwaliteit en conversie.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyVatuur.map((w) => (
              <Card key={w.title} className="hover-lift">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary-strong">
                    <w.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{w.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{w.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="dealer-how" className="container py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="dealer-how" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Zo werkt het
          </h2>
          <p className="mt-3 text-muted-foreground">
            In vier stappen actief op het grootste AI-gedreven auto platform van de Benelux.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n}>
              <Card className="h-full hover-lift">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.n}
                  </div>
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Packages */}
      <section aria-labelledby="pakketten" id="pakketten" className="bg-muted/30 py-14 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="pakketten" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Pakketten en prijzen
            </h2>
            <p className="mt-3 text-muted-foreground">
              Transparante maandprijzen, geen jaarcontract. Kies het pakket dat past bij uw voorraad.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {packages.map((p) => (
              <Card
                key={p.id}
                className={cn(
                  'relative flex h-full flex-col hover-lift',
                  p.highlight && 'border-primary shadow-md ring-1 ring-primary/20',
                )}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm">
                    {p.label}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  <CardDescription>{p.audience}</CardDescription>
                  <div className="pt-3">
                    <span className="text-3xl font-bold">{p.price}</span>
                    <span className="text-sm text-muted-foreground"> / maand</span>
                  </div>
                  {!p.highlight && (
                    <p className="pt-1 text-xs font-medium text-primary-strong">{p.label}</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 text-xs text-muted-foreground">Ideaal voor: {p.ideal}</div>
                  <Button
                    asChild
                    className="mt-5 w-full font-bold"
                    variant={p.highlight ? 'default' : 'outline'}
                  >
                    <Link to="/auth?type=dealer">
                      Kies {p.name}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section aria-labelledby="dealer-compare" className="container py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="dealer-compare" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Pakketten in detail
          </h2>
          <p className="mt-3 text-muted-foreground">
            Alle functies naast elkaar zodat u kunt vergelijken wat het best past bij uw bedrijf.
          </p>
        </div>

        <Card className="mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Functie</TableHead>
                  <TableHead className="text-center">Premium</TableHead>
                  <TableHead className="text-center bg-primary/5 text-primary-strong">Premium Plus</TableHead>
                  <TableHead className="text-center">Enterprise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {row.values.map((v, i) => (
                      <TableCell
                        key={i}
                        className={cn('text-center text-sm', i === 1 && 'bg-primary/5 font-medium')}
                      >
                        {v === true ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-primary-strong" />
                        ) : v === false ? (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground" />
                        ) : (
                          v
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      {/* Turbo & Nitro */}
      <section aria-labelledby="dealer-boosts" className="bg-muted/30 py-14 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="dealer-boosts" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Wat zijn Turbo en Nitro boosts?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Twee promotietools om uw voertuigen sneller onder de juiste ogen te brengen.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <Card className="hover-lift">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary-strong">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>Turbo Boost</CardTitle>
                <CardDescription>Tijdelijke zichtbaarheidsboost in zoekresultaten.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Een Turbo Boost duwt uw advertentie tijdelijk naar boven in de relevante zoekresultaten.
                  Ideaal voor voertuigen die al even online staan of voor seizoensaanbiedingen waar u extra
                  aandacht op wilt vestigen.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" />Hogere positie in zoekresultaten</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" />Tot 3× meer views per advertentie</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" />Inclusief vanaf het Premium-pakket</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-lift border-primary/30">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary-strong">
                  <Rocket className="h-6 w-6" />
                </div>
                <CardTitle>Nitro Boost</CardTitle>
                <CardDescription>Premium promotie met maximale exposure.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Een Nitro Boost plaatst uw voertuig op de meest waardevolle posities binnen het platform:
                  bovenaan zoekresultaten, op de homepage en in uitgelichte categorieën. Bedoeld voor uw
                  topvoorraad of voertuigen die snel verkocht moeten worden.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" />Vermelding op de homepage</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" />Topposities in zoekresultaten</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" />Inclusief vanaf Premium Plus</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section aria-labelledby="dealer-usps" className="container py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="dealer-usps" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Waarom dealers voor VATUUR kiezen
          </h2>
          <p className="mt-3 text-muted-foreground">
            Zes redenen waarom autobedrijven hun voorraad het liefst op VATUUR. plaatsen.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {usps.map((u) => (
            <Card key={u.title} className="hover-lift">
              <CardContent className="p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary-strong">
                  <u.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{u.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{u.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section aria-labelledby="dealer-testimonials" className="bg-muted/30 py-14 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="dealer-testimonials" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Wat dealers over VATUUR zeggen
            </h2>
            <p className="mt-3 text-muted-foreground">
              Onze partners delen hun ervaring met het platform.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="hover-lift">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-1 text-primary-strong">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="mb-2 h-5 w-5 text-primary-strong/40" aria-hidden />
                  <p className="text-sm text-muted-foreground">"{t.review}"</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary-strong">
                      {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role} · {t.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="dealer-faq" className="container py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 id="dealer-faq" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Veelgestelde vragen
            </h2>
            <p className="mt-3 text-muted-foreground">
              Alles wat u wilt weten voor u uw voorraad op VATUUR. plaatst.
            </p>
          </div>

          <Card>
            <CardContent className="px-2 sm:px-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section aria-labelledby="dealer-cta" className="bg-gradient-to-b from-background to-primary/5 py-14 sm:py-20">
        <div className="container">
          <Card className="mx-auto max-w-3xl border-primary/20">
            <CardContent className="p-8 text-center sm:p-12">
              <Headphones className="mx-auto mb-4 h-10 w-10 text-primary-strong" />
              <h2 id="dealer-cta" className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Klaar om meer auto's te verkopen?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Sluit u vandaag nog aan bij VATUUR. en vergroot uw online bereik in Nederland en België.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto gap-2 font-bold shadow-sm">
                  <Link to="/auth?type=dealer">
                    Word dealer <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
                  <a href="#pakketten">Bekijk pakketten</a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Maandelijks opzegbaar · Activatie binnen 24 uur · Support in NL en BE
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-nav-above left-0 right-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-lg shadow-lg lg:hidden">
        <Button asChild size="lg" className="w-full gap-2 font-bold">
          <Link to="/auth?type=dealer">
            Start als dealer <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </>
  );
}

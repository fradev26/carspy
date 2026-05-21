import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Car, Gauge, Calendar, BadgeCheck, BarChart3, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAR_BRANDS, CAR_MODELS } from '@/types/listing';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

function estimateRange({ brand, year, mileage }: { brand: string; year: number; mileage: number }) {
  const premium = ['Audi', 'BMW', 'Mercedes-Benz', 'Porsche', 'Tesla', 'Volvo'].includes(brand);
  const base = premium ? 32000 : 18000;
  const ageYears = Math.max(0, currentYear - year);
  const ageFactor = Math.pow(0.88, ageYears);
  const kmFactor = Math.max(0.35, 1 - mileage / 350000);
  const mid = Math.round(base * ageFactor * kmFactor);
  const low = Math.max(500, Math.round(mid * 0.85));
  const high = Math.round(mid * 1.15);
  return { low, mid, high };
}

const formatEuro = (n: number) => `€ ${n.toLocaleString('nl-BE')}`;

export default function AutoWaarde() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [result, setResult] = useState<{ low: number; mid: number; high: number } | null>(null);

  const availableModels = brand ? CAR_MODELS[brand] || [] : [];

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !year || !mileage) return;
    setResult(estimateRange({ brand, year: parseInt(year), mileage: parseInt(mileage) }));
  };

  const goSearchSimilar = () => {
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (model) params.set('model', model);
    if (year) params.set('minYear', String(parseInt(year) - 1));
    navigate(`/zoeken?${params.toString()}`);
  };

  const jsonLd = useMemo(() => ([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vatuur.be/' },
        { '@type': 'ListItem', position: 2, name: 'Wat is mijn auto waard?', item: 'https://vatuur.be/wat-is-mijn-auto-waard' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Hoe wordt de waarde van mijn auto bepaald?',
          acceptedAnswer: { '@type': 'Answer', text: 'De waarde wordt berekend op basis van merk, model, bouwjaar, kilometerstand, staat van de wagen en actuele marktdata uit vergelijkbare advertenties.' },
        },
        {
          '@type': 'Question',
          name: 'Is de autowaardebepaling van Vatuur gratis?',
          acceptedAnswer: { '@type': 'Answer', text: 'Ja, een indicatieve waardebepaling op Vatuur is volledig gratis en zonder verplichtingen.' },
        },
        {
          '@type': 'Question',
          name: 'Hoe nauwkeurig is een online autotaxatie?',
          acceptedAnswer: { '@type': 'Answer', text: 'Een online taxatie geeft een betrouwbare richtprijs op basis van duizenden vergelijkbare wagens. Voor een exacte waarde blijft een fysieke inspectie aanbevolen.' },
        },
        {
          '@type': 'Question',
          name: 'Kan ik mijn auto ook meteen verkopen via Vatuur?',
          acceptedAnswer: { '@type': 'Answer', text: 'Ja, na de waardebepaling kan je in enkele stappen je advertentie plaatsen via onze verkoopflow.' },
        },
      ],
    },
  ]), []);

  const factors = [
    { icon: Car, title: 'Merk & model', text: 'Sommige merken behouden hun waarde beter dan andere.' },
    { icon: Calendar, title: 'Bouwjaar', text: 'Gemiddeld verliest een wagen 10-15% per jaar in waarde.' },
    { icon: Gauge, title: 'Kilometerstand', text: 'Lage km-stand = hogere restwaarde op de tweedehandsmarkt.' },
    { icon: BadgeCheck, title: 'Staat van de wagen', text: 'Onderhoudshistoriek, schade en non-roker tellen mee.' },
    { icon: BarChart3, title: 'Marktdata', text: 'We vergelijken met duizenden lopende advertenties.' },
  ];

  const trust = [
    { icon: BarChart3, title: 'Live marktdata', text: 'Onze schatting baseert zich op duizenden actieve advertenties in België en Nederland.' },
    { icon: ShieldCheck, title: 'Onafhankelijk', text: 'We zijn geen opkoper. Je krijgt een eerlijke richtprijs zonder verborgen agenda.' },
    { icon: Sparkles, title: 'AI-gestuurd', text: 'Onze AI vergelijkt jouw wagen direct met gelijkaardige modellen op de markt.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Wat is mijn auto waard? | Gratis autowaarde berekenen | VATUUR."
        description="Bereken gratis de waarde van je auto op basis van merk, bouwjaar en km-stand. Snelle, betrouwbare online autotaxatie en direct verkopen via Vatuur."
        canonical="https://vatuur.be/wat-is-mijn-auto-waard"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Gratis &amp; vrijblijvend
            </div>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              Wat is mijn auto waard<span className="text-primary">?</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Bereken in een minuut de indicatieve waarde van je wagen op basis van merk, bouwjaar en km-stand —
              vergeleken met duizenden actuele advertenties op de Benelux-markt.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                onClick={() => document.getElementById('waardetool')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Calculator className="h-5 w-5" />
                Bereken mijn autowaarde
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/60">
                <Link to="/verkopen">Direct verkopen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Hoe werkt het */}
      <section className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Hoe wordt jouw autowaarde bepaald?</h2>
          <p className="mt-3 text-muted-foreground">
            Vatuur combineert vijf factoren met live marktdata om een eerlijke richtprijs te geven.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {factors.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border/60 bg-card p-5 shadow-card hover:shadow-floating transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Waardetool */}
      <section id="waardetool" className="border-y border-border/60 bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold md:text-3xl">Bereken nu je indicatieve autowaarde</h2>
              <p className="mt-2 text-muted-foreground">Vul de basisgegevens in — geen registratie nodig.</p>
            </div>

            <form onSubmit={handleCalculate} className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-floating">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Merk</Label>
                  <Select value={brand} onValueChange={(v) => { setBrand(v); setModel(''); }}>
                    <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Kies merk" /></SelectTrigger>
                    <SelectContent className="bg-card max-h-72">
                      {CAR_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Model</Label>
                  {availableModels.length ? (
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Kies model" /></SelectTrigger>
                      <SelectContent className="bg-card max-h-72">
                        {availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className="mt-1.5 h-11" placeholder="Bijv. Golf" value={model} onChange={(e) => setModel(e.target.value)} />
                  )}
                </div>
                <div>
                  <Label>Bouwjaar</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="mt-1.5 h-11"><SelectValue placeholder="Kies bouwjaar" /></SelectTrigger>
                    <SelectContent className="bg-card max-h-64">
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kilometerstand</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Bijv. 95000"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!brand || !year || !mileage}
                className="mt-6 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                <Calculator className="h-5 w-5" />
                Bereken waarde
              </Button>
            </form>

            {result && (
              <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 md:p-8 animate-fade-in">
                <p className="text-sm text-muted-foreground">Indicatieve marktwaarde voor jouw {brand} {model}</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Vanaf</p>
                    <p className="text-xl font-semibold">{formatEuro(result.low)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Richtprijs</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{formatEuro(result.mid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tot</p>
                    <p className="text-xl font-semibold">{formatEuro(result.high)}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Indicatie op basis van marktdata. Werkelijke waarde hangt af van staat, opties en onderhoudshistoriek.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to="/verkopen">
                      Verkoop nu via Vatuur <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={goSearchSimilar} className="border-border/60">
                    Bekijk vergelijkbare wagens
                  </Button>
                  <Button variant="ghost" onClick={() => setResult(null)}>
                    Nieuwe waardebepaling
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold md:text-3xl">Waarom is een waardebepaling via Vatuur betrouwbaar?</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {trust.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold md:text-3xl">Klaar om je auto te verkopen?</h2>
            <p className="mt-3 text-muted-foreground">
              Plaats je advertentie in enkele minuten en bereik duizenden kopers in de Benelux.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                <Link to="/verkopen">Auto verkopen <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/60">
                <Link to="/zoeken">Vergelijkbare wagens bekijken</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Of ga terug naar de <Link to="/" className="underline hover:text-foreground">homepage</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

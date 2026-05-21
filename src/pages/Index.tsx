import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users, Car, CheckCircle2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSearch } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { mockListings } from '@/data/mockListings';
import { SEOHead } from '@/components/SEOHead';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const faqCategories = [
  {
    title: "Gebruik & platform",
    items: [
      { question: "Is VATUUR gratis te gebruiken?", answer: "Ja, zoeken, vergelijken en advertenties plaatsen op VATUUR. is volledig gratis. Premium opties zijn beschikbaar voor dealers die extra zichtbaarheid willen." },
      { question: "Moet ik een account aanmaken om auto's te zoeken op VATUUR?", answer: "Nee, je kunt vrij door het volledige aanbod van 25.000+ occasions bladeren zonder account. Een account heb je pas nodig om favorieten op te slaan, zoekopdrachten te bewaren of contact op te nemen met dealers." },
      { question: "Kan ik VATUUR gebruiken op mijn mobiel?", answer: "Ja, VATUUR. is volledig responsive en geoptimaliseerd voor smartphone en tablet. Je vindt onderaan een snelle navigatiebalk met directe toegang tot zoeken, AI-assistent, favorieten en je account." },
    ],
  },
  {
    title: "Zoeken naar auto's",
    items: [
      { question: "Hoe werkt auto zoeken op VATUUR?", answer: "Je kunt op twee manieren zoeken: klassiek met filters (merk, model, prijs, brandstof, kilometerstand) of slim via een AI-zoekbalk waar je in gewone taal beschrijft wat je zoekt. De resultaten komen uit 25.000+ occasions van geverifieerde dealers in Nederland en België." },
      { question: "Wat is het verschil tussen klassiek zoeken en slim zoeken?", answer: "Klassiek zoeken gebruikt dropdowns en filters voor wie precies weet wat hij wil. Slim zoeken laat je vrij beschrijven wat je zoekt (bijvoorbeeld 'zuinige gezinsauto onder 15.000 euro met automaat') en VATUUR. AI vertaalt dat naar de juiste filters." },
      { question: "Kan ik auto's zoeken met AI of natuurlijke taal?", answer: "Ja, via slim zoeken typ je gewoon wat je zoekt in een zin. De AI begrijpt budget, gebruik, voorkeuren en levert direct passende wagens met een dealscore en eerlijk advies." },
      { question: "Kan ik mijn zoekopdracht opslaan voor later?", answer: "Ja, ingelogde gebruikers kunnen elke zoekopdracht opslaan vanuit het zoekresultaat. Je vindt je opgeslagen zoekopdrachten terug in je dashboard en kunt ze met één klik opnieuw uitvoeren." },
      { question: "Kan ik meldingen krijgen voor nieuwe auto's die aan mijn criteria voldoen?", answer: "Ja, opgeslagen zoekopdrachten functioneren als zoekalerts. Zodra er nieuwe wagens beschikbaar komen die aan je criteria voldoen, krijg je daar bericht van in je dashboard." },
    ],
  },
  {
    title: "Auto's vergelijken & kiezen",
    items: [
      { question: "Hoe kan ik auto's vergelijken op VATUUR?", answer: "Klik op de vergelijkknop bij maximaal 3 advertenties. Onderaan je scherm verschijnt een vergelijkbalk waarmee je prijs, specificaties, uitrusting en kilometerstand naast elkaar bekijkt." },
      { question: "Kan ik favoriete auto's opslaan?", answer: "Ja, klik op het hartje bij een advertentie om die toe te voegen aan je favorieten. Je vindt ze allemaal terug onder 'Mijn favorieten' in je account." },
      { question: "Geeft VATUUR aankoopadvies bij het kiezen van een auto?", answer: "Ja, elke advertentie krijgt een AI-analyse met een dealscore (1-10), prijsindicatie ten opzichte van de markt en concrete aandachtspunten. Daarnaast kan je via de AI-assistent vragen stellen zoals 'is dit een goede deal?' of 'wat moet ik checken bij een proefrit?'." },
    ],
  },
  {
    title: "Prijs & waarde",
    items: [
      { question: "Hoe werkt de prijsindicatie van auto's op VATUUR?", answer: "De prijsindicatie vergelijkt de vraagprijs met vergelijkbare wagens (zelfde merk, model, bouwjaar en kilometerstand) op de markt. Je ziet direct of de prijs onder, op of boven marktwaarde ligt." },
      { question: "Hoe weet ik of een auto een goede prijs heeft?", answer: "Naast de prijsindicatie geeft VATUUR. AI een dealscore van 1 tot 10 op basis van prijs, kilometerstand, uitrusting en marktaanbod. Een score boven 7 wijst op een scherpe deal." },
    ],
  },
  {
    title: "Betrouwbaarheid & dealers",
    items: [
      { question: "Hoe weet ik of een dealer betrouwbaar is?", answer: "Op VATUUR. plaatsen enkel geverifieerde dealers advertenties. Bij elke advertentie zie je het profiel van de verkoper met handelsgeschiedenis, beoordelingen en contactgegevens." },
      { question: "Hoe controleert VATUUR dealers?", answer: "Voor activatie controleren we KvK- of BTW-registratie, bedrijfsgegevens en handelsgeschiedenis. Particuliere opkopers en anonieme advertenties worden geweerd." },
      { question: "Wat betekent een geverifieerde dealer?", answer: "Een geverifieerde dealer is een officieel geregistreerd autobedrijf waarvan VATUUR. de gegevens heeft gecontroleerd. Zo weet je dat je met een echte professional zaken doet, niet met een anonieme tussenpersoon." },
    ],
  },
  {
    title: "Auto-informatie",
    items: [
      { question: "Hoe betrouwbaar zijn de voertuiggegevens op VATUUR?", answer: "Voertuiggegevens worden door de dealer aangeleverd en waar mogelijk gekoppeld aan officiële bronnen. Bij twijfel raden we altijd aan om documenten en historie tijdens een bezoek of proefrit te controleren." },
      { question: "Worden kilometerstanden gecontroleerd?", answer: "Dealers zijn verplicht om correcte kilometerstanden door te geven. VATUUR. signaleert opvallende afwijkingen, maar we adviseren bij aankoop altijd een NAP- of Car-Pass-rapport op te vragen." },
      { question: "Kan ik de onderhoudshistorie van een auto bekijken?", answer: "Veel advertenties vermelden onderhoudshistorie in de beschrijving. Voor het volledige boekje of de servicegeschiedenis neem je rechtstreeks contact op met de dealer via VATUUR." },
    ],
  },
  {
    title: "Kopen & contact",
    items: [
      { question: "Kan ik een auto kopen via VATUUR?", answer: "VATUUR. is een marktplaats die kopers en geverifieerde dealers verbindt. De effectieve verkoop, betaling en levering verlopen rechtstreeks met de dealer, niet via VATUUR. zelf." },
      { question: "Hoe neem ik contact op met een autodealer?", answer: "Op elke advertentie vind je de contactopties van de dealer: telefonisch, via e-mail of via het ingebouwde berichtensysteem. Berichten verlopen in real-time via je VATUUR.-account." },
      { question: "Kan ik een proefrit aanvragen via VATUUR?", answer: "Ja, je kunt rechtstreeks een proefrit voorstellen via het berichtensysteem of contactformulier op de advertentie. De dealer bevestigt het tijdstip met jou." },
    ],
  },
  {
    title: "Account & technisch",
    items: [
      { question: "Waarom werkt slim zoeken niet goed?", answer: "Slim zoeken werkt het best met concrete vragen ('SUV met automaat onder 20.000 euro, max 80.000 km'). Te vage of zeer specifieke termen kunnen weinig resultaten geven. Verfijn je zin of schakel terug naar klassiek zoeken met filters." },
      { question: "Hoe verwijder of wijzig ik mijn account?", answer: "In je dashboard onder accountinstellingen kun je je profielgegevens aanpassen of je account verwijderen. Bij verwijdering worden je persoonsgegevens en favorieten definitief gewist." },
    ],
  },
  {
    title: "Privacy & veiligheid",
    items: [
      { question: "Is mijn data veilig bij VATUUR?", answer: "Ja, VATUUR. is volledig GDPR-conform. Je gegevens worden versleuteld opgeslagen, nooit verkocht aan derden en enkel gebruikt om het platform te laten werken. Lees ons privacybeleid voor de details." },
    ],
  },
  {
    title: "Toekomst & platform",
    items: [
      { question: "Komt VATUUR beschikbaar in andere landen?", answer: "VATUUR. richt zich nu op Nederland en België. Uitbreiding naar andere Europese landen staat op de roadmap, maar er is nog geen vaste datum." },
    ],
  },
];

const faqItems = faqCategories.flatMap(c => c.items);

const websiteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "VATUUR.",
    "url": "https://vatuur.nl/",
    "description": "Tweedehands auto's kopen en verkopen in Nederland en België. Vind jouw perfecte occasion bij geverifieerde dealers.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://vatuur.nl/zoeken?brand={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VATUUR.",
    "url": "https://vatuur.nl",
    "logo": "https://vatuur.nl/favicon.ico",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@vatuur.nl",
      "contactType": "customer service",
      "availableLanguage": "Dutch"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
];

const Index = () => {
  const latestListings = mockListings.slice(0, 6);

  return (
    <div className="flex flex-col">
      <SEOHead
        title="VATUUR. - Tweedehands auto's kopen en verkopen in Nederland en België"
        description="Doorzoek 25.000+ occasions. Vind jouw perfecte tweedehands auto bij geverifieerde dealers in Nederland en België."
        canonical="https://vatuur.nl/"
        jsonLd={websiteJsonLd}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden -mt-14 lg:-mt-16 pt-24 pb-6 lg:pt-44 lg:pb-36 min-h-0 lg:min-h-[720px]">
        {/* Background Image (LCP, eager + responsive) */}
        <picture>
          <source
            type="image/webp"
            srcSet="/hero-image-768.webp 768w, /hero-image-1280.webp 1280w, /hero-image-1920.webp 1920w"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
          />
          <img
            src="/hero-image-1280.jpg"
            srcSet="/hero-image-768.jpg 768w, /hero-image-1280.jpg 1280w, /hero-image-1920.jpg 1920w"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover object-[65%_center] sm:object-[60%_center] lg:object-center"
          />
        </picture>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />

        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-white md:text-5xl lg:text-6xl leading-tight">
                Vind je volgende auto in één zin.
              </h1>
              <p className="mt-1.5 text-sm text-white/80 md:text-xl max-w-2xl mx-auto leading-relaxed lg:mt-5 lg:text-lg">
                Beschrijf wat je zoekt — VATUUR. doorzoekt 25.000+ occasions van geverifieerde dealers in Nederland & België en filtert direct het beste resultaat.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-4 max-w-4xl animate-fade-in-up lg:mt-10" style={{ animationDelay: '0.1s' }}>
            <HeroSearch />
          </div>

          {/* CTA Buttons */}
          <div className="mt-3 grid grid-cols-2 gap-3 max-w-md mx-auto animate-fade-in-up lg:mt-5" style={{ animationDelay: '0.2s' }}>
            <Button
              asChild
              size="lg"
              className="w-full bg-primary text-white hover:bg-primary/90 shadow-lg text-sm lg:text-base px-4"
            >
              <Link to="/zoeken">Zoek auto's</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm text-sm lg:text-base px-4"
            >
              <Link to="/verkopen">Plaats advertentie</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 hidden md:flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/90 lg:mt-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>Alleen geverifieerde verkopers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>25.000+ actuele occasions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>Dagelijks vers aanbod</span>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-white/70 lg:mt-4">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span>4.8/5 op basis van 1.200+ reviews</span>
          </div>
        </div>
      </section>



      {/* Popular Brands */}
      <section className="border-b border-border/50 bg-background py-8 md:py-10">
        <div className="container">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Populaire merken
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {[
              'Volkswagen',
              'BMW',
              'Audi',
              'Mercedes-Benz',
              'Toyota',
              'Ford',
              'Volvo',
              'Peugeot',
              'Renault',
              'Hyundai',
              'Kia',
              'Tesla',
              'Skoda',
              'Seat',
              'Opel',
            ].map((brand) => (
              <Link
                key={brand}
                to={`/zoeken?brand=${encodeURIComponent(brand)}`}
                className="rounded-md border border-border/70 bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold">Uitgelichte advertenties</h2>
              <p className="mt-1 text-sm text-muted-foreground">Recent toegevoegd</p>
            </div>
            <Button variant="outline" asChild className="gap-2 shadow-sm">
              <Link to="/zoeken">
                Bekijk alle 25.000+ wagens <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ListingGrid listings={latestListings} columns={3} />
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold md:text-3xl">Waarom VATUUR?</h2>
            <p className="mt-2 text-muted-foreground">Concrete verschillen, geen marketingpraat</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-card-hover">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">Geverifieerde dealers</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Elke verkoper KvK-gecontroleerd. Geen anonieme advertenties of dubieuze opkopers.
              </p>
            </div>
            <div className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-card-hover">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 group-hover:bg-accent/15 transition-colors">
                <Zap className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">AI doet het zoekwerk</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Beschrijf wat je zoekt, VATUUR. AI levert de top-matches met dealscore en eerlijk advies.
              </p>
            </div>
            <div className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-card-hover">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 group-hover:bg-success/15 transition-colors">
                <Users className="h-7 w-7 text-success" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">25.000+ wagens</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Vers aanbod uit heel Nederland & België, dagelijks bijgewerkt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-accent to-accent/90 py-16 md:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container relative z-10 text-center">
          <h2 className="text-2xl font-bold text-accent-foreground md:text-4xl">
            Auto verkopen in 2 minuten
          </h2>
          <p className="mt-3 text-lg text-accent-foreground/90 max-w-md mx-auto">
            Gratis advertentie, AI-prijssuggestie en directe zichtbaarheid bij duizenden kopers.
          </p>
          <Button 
            asChild 
            size="lg" 
            className="mt-8 bg-card text-foreground hover:bg-card/90 shadow-floating text-base px-8"
          >
            <Link to="/verkopen">Plaats mijn advertentie</Link>
          </Button>
        </div>
      </section>
      {/* FAQ */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold md:text-3xl">Veelgestelde vragen</h2>
              <p className="mt-2 text-muted-foreground">Alles wat je wilt weten over VATUUR.</p>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {faqCategories.map((cat, ci) => (
                <div key={cat.title} className="space-y-3">
                  <h3 className="mt-8 first:mt-0 mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.title}
                  </h3>
                  {cat.items.map((faq, i) => (
                    <AccordionItem
                      key={`${ci}-${i}`}
                      value={`faq-${ci}-${i}`}
                      className="bg-card rounded-xl border border-border/60 px-6 shadow-sm data-[state=open]:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users, Car, CheckCircle2, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSearch, SmartSearchBar } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { useListings } from '@/hooks/useListings';
import { useFavorites } from '@/hooks/useFavorites';
import { SEOHead } from '@/components/SEOHead';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { CategorySections } from '@/components/home/CategoryGrid';


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
    "url": "https://vatuur.be/",
    "description": "Tweedehands auto's kopen en verkopen in Nederland en België. Vind jouw perfecte occasion bij geverifieerde dealers.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://vatuur.be/zoeken?brand={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VATUUR.",
    "url": "https://vatuur.be",
    "logo": "https://vatuur.be/favicon.ico",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@vatuur.be",
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
  const { listings: allListings, loading: listingsLoading } = useListings();
  const latestListings = allListings.slice(0, 6);
  const [faqExpanded, setFaqExpanded] = useState(false);
  const { favorites, toggle } = useFavorites();

  return (
    <div className="flex flex-col">
      <SEOHead
        title="VATUUR. - Tweedehands auto's kopen en verkopen in Nederland en België"
        description="Doorzoek 25.000+ occasions. Vind jouw perfecte tweedehands auto bij geverifieerde dealers in Nederland en België."
        canonical="https://vatuur.be/"
        jsonLd={websiteJsonLd}
      />
      {/* Mobile-only H1 for SEO (desktop H1 lives inside hero) */}
      <h1 className="sr-only lg:hidden">Tweedehands auto's kopen en verkopen in Nederland en België</h1>


      {/* Hero Section — desktop only */}
      <section className="relative overflow-hidden -mt-14 lg:-mt-16 pt-32 pb-16 lg:pt-44 lg:pb-36 min-h-[560px] sm:min-h-[620px] lg:min-h-[720px] hidden lg:block">

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
              <h1 className="text-3xl font-bold text-white md:text-5xl lg:text-6xl leading-tight">
                Vind je volgende auto in één zin.
              </h1>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-4xl animate-fade-in-up lg:mt-10" style={{ animationDelay: '0.1s' }}>
            <HeroSearch />
          </div>

          {/* CTA Buttons */}
          <div className="mt-3 grid grid-cols-2 gap-3 max-w-md mx-auto animate-fade-in-up lg:mt-5" style={{ animationDelay: '0.2s' }}>
            <Button
              asChild
              size="lg"
              className="w-full bg-primary text-white hover:bg-primary/90 shadow-lg text-base px-4"
            >
              <Link to="/zoeken">Zoek auto's</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm text-base px-4"
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
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/70">
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
      <section className="hidden lg:block border-b border-border/50 bg-background py-8 md:py-10">
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
      {/* Mobile compact AI search — primary action on mobile homepage */}
      <section className="lg:hidden bg-background pt-4 pb-2">
        <div className="container">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Wat zoek je?</h2>
          <SmartSearchBar
            variant="compact"
            placeholder="Ik zoek een zwarte Audi A4 automaat onder €25.000"
          />
          <div className="mt-2 text-right">
            <Link to="/zoeken" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Of zoek met filters→
            </Link>
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
                Bekijk alle wagens <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {listingsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <ListingGrid listings={latestListings} columns={3} />
          )}
          <div className="mt-8 text-center">
            <Link
              to="/zoeken"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all min-h-[48px]"
            >
              Bekijk alle advertenties <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
      <CategorySections allListings={allListings} loading={listingsLoading} />

      {/* Features */}
      <section className="hidden lg:block py-12 md:py-20">
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
      <section className="hidden lg:block relative overflow-hidden bg-gradient-to-r from-accent to-accent/90 py-16 md:py-20">
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

            {/* Mobile toggle */}
            <button
              onClick={() => setFaqExpanded((v) => !v)}
              className="lg:hidden flex items-center justify-center gap-2 w-full rounded-xl border border-border/60 bg-card px-6 py-4 text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
            >
              {faqExpanded ? 'Minder vragen' : 'Meer vragen?'}
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${faqExpanded ? 'rotate-180' : ''}`} />
            </button>

            <div className={`${!faqExpanded ? 'hidden' : ''} lg:block`}>
              <Accordion type="single" collapsible className="space-y-3 mt-4 lg:mt-0">
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
        </div>
      </section>
    </div>
  );
};

export default Index;

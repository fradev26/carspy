import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users, Car, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { mockListings } from '@/data/mockListings';
import { SEOHead } from '@/components/SEOHead';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
  { question: "Is AutoSpy gratis te gebruiken?", answer: "Ja, zoeken en vergelijken op AutoSpy is volledig gratis. Ook het plaatsen van een advertentie is gratis. Premium opties zijn beschikbaar voor extra zichtbaarheid." },
  { question: "Hoe weet ik of een dealer betrouwbaar is?", answer: "Alle dealers op AutoSpy worden geverifieerd voordat ze advertenties mogen plaatsen. We controleren KvK-registratie, reviews en handelsgeschiedenis om jouw veiligheid te waarborgen." },
  { question: "Kan ik auto's vergelijken op AutoSpy?", answer: "Ja, je kunt tot 3 auto's naast elkaar vergelijken op prijs, specificaties, uitrusting en meer. Gebruik de vergelijkknop op elke advertentie om te starten." },
  { question: "Hoe werkt de prijsindicatie?", answer: "Onze prijsindicatie vergelijkt de vraagprijs met vergelijkbare auto's op basis van merk, model, bouwjaar en kilometerstand. Zo zie je direct of een auto scherp geprijsd is." },
  { question: "In welke regio's is AutoSpy actief?", answer: "AutoSpy is actief in heel Nederland en België. Je kunt zoeken op provincie of stad om auto's bij jou in de buurt te vinden." },
];

const websiteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AutoSpy",
    "url": "https://autospy.nl/",
    "description": "Tweedehands auto's kopen en verkopen in Nederland en België. Vind jouw perfecte occasion bij geverifieerde dealers.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://autospy.nl/zoeken?brand={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AutoSpy",
    "url": "https://autospy.nl",
    "logo": "https://autospy.nl/favicon.ico",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@autospy.nl",
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
        title="AutoSpy - Tweedehands auto's kopen en verkopen in Nederland en België"
        description="Doorzoek 25.000+ occasions. Vind jouw perfecte tweedehands auto bij geverifieerde dealers in Nederland en België."
        canonical="https://autospy.nl/"
        jsonLd={websiteJsonLd}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80')` }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/80" />
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white md:text-5xl lg:text-6xl tracking-tight">
                Vind jouw perfecte auto
              </h1>
              <p className="mt-4 text-lg text-white/80 md:text-xl max-w-2xl mx-auto">
                Doorzoek duizenden occasions en vind de auto die bij je past
              </p>
            </div>
          </div>
          
          <div className="mx-auto mt-10 max-w-4xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <SearchBar variant="hero" />
          </div>
          
          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Geverifieerde dealers</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>Duizenden occasions</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Dagelijks nieuwe advertenties</span>
            </div>
          </div>
        </div>
      </section>


      {/* Latest Listings */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold">Uitgelichte advertenties</h2>
              <p className="mt-1 text-sm text-muted-foreground">Recent toegevoegd</p>
            </div>
            <Button variant="outline" asChild className="gap-2 shadow-sm">
              <Link to="/zoeken">
                Bekijk alles <ArrowRight className="h-4 w-4" />
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
            <h2 className="text-2xl font-semibold md:text-3xl">Waarom AutoSpy?</h2>
            <p className="mt-2 text-muted-foreground">De slimste manier om jouw volgende auto te vinden</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-card-hover">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">Betrouwbaar</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Alle dealers worden geverifieerd voor jouw veiligheid en gemak
              </p>
            </div>
            <div className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-card-hover">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 group-hover:bg-accent/15 transition-colors">
                <Zap className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">Snel & Eenvoudig</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Vind in minuten de perfecte auto met onze slimme filters
              </p>
            </div>
            <div className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-card-hover">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 group-hover:bg-success/15 transition-colors">
                <Users className="h-7 w-7 text-success" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">Grote keuze</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Duizenden auto's van particulieren en betrouwbare dealers
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
            Auto verkopen?
          </h2>
          <p className="mt-3 text-lg text-accent-foreground/90 max-w-md mx-auto">
            Plaats gratis je advertentie en bereik duizenden kopers
          </p>
          <Button 
            asChild 
            size="lg" 
            className="mt-8 bg-card text-foreground hover:bg-card/90 shadow-floating text-base px-8"
          >
            <Link to="/verkopen">Start nu met verkopen</Link>
          </Button>
        </div>
      </section>
      {/* FAQ */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold md:text-3xl">Veelgestelde vragen</h2>
              <p className="mt-2 text-muted-foreground">Alles wat je wilt weten over AutoSpy</p>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
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
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users, Car, Truck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { mockListings } from '@/data/mockListings';
import { BODY_TYPES } from '@/types/listing';

const bodyTypeIcons: Record<string, React.ReactNode> = {
  sedan: <Car className="h-6 w-6" />,
  hatchback: <Car className="h-6 w-6" />,
  stationwagon: <Car className="h-6 w-6" />,
  suv: <Truck className="h-6 w-6" />,
  cabrio: <Car className="h-6 w-6" />,
  coupe: <Car className="h-6 w-6" />,
  mpv: <Car className="h-6 w-6" />,
  bestelwagen: <Truck className="h-6 w-6" />,
};

const Index = () => {
  const latestListings = mockListings.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 py-16 md:py-24">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-primary-foreground md:text-5xl lg:text-6xl tracking-tight">
                Vind jouw perfecte auto
              </h1>
              <p className="mt-4 text-lg text-primary-foreground/80 md:text-xl max-w-2xl mx-auto">
                Doorzoek duizenden occasions en vind de auto die bij je past
              </p>
            </div>
          </div>
          
          <div className="mx-auto mt-10 max-w-4xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <SearchBar variant="hero" />
          </div>
          
          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/70">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Geverifieerde dealers</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>25.000+ auto's</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Dagelijks nieuwe advertenties</span>
            </div>
          </div>
        </div>
      </section>

      {/* Body Types - Hidden on mobile */}
      <section className="hidden py-12 md:block md:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">Zoek op carrosserie</h2>
            <Button variant="ghost" asChild className="gap-1 text-muted-foreground hover:text-foreground">
              <Link to="/zoeken">
                Alle auto's <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {BODY_TYPES.map((bodyType) => (
              <Link
                key={bodyType.value}
                to={`/zoeken?bodyType=${encodeURIComponent(bodyType.value)}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                  {bodyTypeIcons[bodyType.value] || <Car className="h-6 w-6" />}
                </div>
                <span className="text-sm font-medium text-center text-foreground/80 group-hover:text-foreground transition-colors">
                  {bodyType.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold">Nieuwste advertenties</h2>
              <p className="mt-1 text-sm text-muted-foreground">Vandaag toegevoegd</p>
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
    </div>
  );
};

export default Index;

import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/modules/search';
import { ListingGrid } from '@/modules/listings';
import { mockListings, popularBrands } from '@/data/mockListings';

const Index = () => {
  const latestListings = mockListings.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-primary py-16 md:py-24">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold text-primary-foreground md:text-5xl">
              Vind jouw perfecte auto
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Doorzoek duizenden occasions en vind de auto die bij je past
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* Popular Brands */}
      <section className="py-12 md:py-16">
        <div className="container">
          <h2 className="text-2xl font-semibold">Populaire merken</h2>
          <div className="mt-6 grid grid-cols-4 gap-4 md:grid-cols-8">
            {popularBrands.map((brand) => (
              <Link
                key={brand.name}
                to={`/zoeken?brand=${encodeURIComponent(brand.name)}`}
                className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-all hover:shadow-card-hover hover:border-primary/20"
              >
                <span className="text-2xl">{brand.logo}</span>
                <span className="text-sm font-medium">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Nieuwste advertenties</h2>
            <Button variant="ghost" asChild>
              <Link to="/zoeken" className="gap-2">
                Bekijk alles <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6">
            <ListingGrid listings={latestListings} columns={3} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Betrouwbaar</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Alle dealers worden geverifieerd voor jouw veiligheid
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Snel & Eenvoudig</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Vind in minuten de auto die bij je past
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Grote keuze</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Duizenden auto's van particulieren en dealers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent py-12 md:py-16">
        <div className="container text-center">
          <h2 className="text-2xl font-bold text-accent-foreground md:text-3xl">
            Auto verkopen?
          </h2>
          <p className="mt-2 text-accent-foreground/80">
            Plaats gratis je advertentie en bereik duizenden kopers
          </p>
          <Button asChild size="lg" className="mt-6 bg-card text-foreground hover:bg-card/90">
            <Link to="/verkopen">Start nu met verkopen</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;

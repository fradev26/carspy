import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Gauge, Fuel, Settings, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImageGallery, ListingGrid } from '@/modules/listings';
import { getListingById, getRelatedListings } from '@/data/mockListings';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const listing = getListingById(id || '');

  if (!listing) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">Advertentie niet gevonden</h1>
        <Button asChild className="mt-4">
          <Link to="/zoeken">Terug naar zoeken</Link>
        </Button>
      </div>
    );
  }

  const relatedListings = getRelatedListings(listing, 3);
  const formatPrice = (price: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
  const formatMileage = (mileage: number) => new Intl.NumberFormat('nl-NL').format(mileage);

  return (
    <div className="container py-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/zoeken"><ArrowLeft className="mr-2 h-4 w-4" />Terug naar resultaten</Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={listing.images} alt={listing.title} />

          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{listing.title}</h1>
            <p className="mt-2 text-3xl font-bold text-accent">{formatPrice(listing.price)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div><div className="text-xs text-muted-foreground">Bouwjaar</div><div className="font-semibold">{listing.year}</div></div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <Gauge className="h-5 w-5 text-muted-foreground" />
              <div><div className="text-xs text-muted-foreground">Km-stand</div><div className="font-semibold">{formatMileage(listing.mileage)} km</div></div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <Fuel className="h-5 w-5 text-muted-foreground" />
              <div><div className="text-xs text-muted-foreground">Brandstof</div><div className="font-semibold capitalize">{listing.fuelType}</div></div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div><div className="text-xs text-muted-foreground">Transmissie</div><div className="font-semibold capitalize">{listing.transmission}</div></div>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Beschrijving</h2>
              <p className="mt-3 text-muted-foreground whitespace-pre-line">{listing.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Uitrusting</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.features.map((feature) => (
                  <Badge key={feature} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {listing.seller.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{listing.seller.name}</h3>
                  <Badge variant="outline">{listing.seller.type === 'dealer' ? 'Dealer' : 'Particulier'}</Badge>
                </div>
              </div>

              {listing.seller.rating && (
                <div className="mt-4 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-medium">{listing.seller.rating}</span>
                  <span className="text-sm text-muted-foreground">({listing.seller.reviewCount} reviews)</span>
                </div>
              )}

              <Separator className="my-4" />

              <div className="space-y-3">
                {listing.seller.phone && (
                  <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Phone className="h-4 w-4" />{listing.seller.phone}
                  </Button>
                )}
                <Button variant="outline" className="w-full gap-2">
                  <Mail className="h-4 w-4" />Stuur bericht
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {listing.location.city}, {listing.location.province}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {relatedListings.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Vergelijkbare auto's</h2>
          <ListingGrid listings={relatedListings} columns={3} />
        </section>
      )}
    </div>
  );
}

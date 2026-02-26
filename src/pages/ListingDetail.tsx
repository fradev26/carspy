import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Gauge, Fuel, Settings, Star, Heart, Share2, Shield, Check, GitCompareArrows, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImageGallery, ListingGrid, PriceIndicator } from '@/modules/listings';
import { useCompare } from '@/hooks/useCompare';
import { getListingById, getRelatedListings } from '@/data/mockListings';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const listing = getListingById(id || '');
  const [isFavorite, setIsFavorite] = useState(false);
  const { add, has } = useCompare();
  const isComparing = has(listing?.id || '');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPrice = (price: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
  const formatMileage = (mileage: number) => new Intl.NumberFormat('nl-NL').format(mileage);

  const jsonLdSchemas = useMemo(() => {
    if (!listing) return undefined;
    const vehicle = {
      "@context": "https://schema.org",
      "@type": "Vehicle",
      "name": listing.title,
      "brand": { "@type": "Brand", "name": listing.brand },
      "model": listing.model,
      "vehicleModelDate": listing.year.toString(),
      "mileageFromOdometer": { "@type": "QuantitativeValue", "value": listing.mileage, "unitCode": "KMT" },
      "fuelType": listing.fuelType,
      "vehicleTransmission": listing.transmission,
      "color": listing.color,
      "numberOfDoors": listing.doors,
      "image": listing.images[0],
      "description": listing.description,
      "offers": {
        "@type": "Offer",
        "price": listing.price,
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": listing.seller.type === 'dealer' ? "AutoDealer" : "Person",
          "name": listing.seller.name
        }
      }
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://autospy.nl/" },
        { "@type": "ListItem", "position": 2, "name": "Zoeken", "item": "https://autospy.nl/zoeken" },
        { "@type": "ListItem", "position": 3, "name": listing.title, "item": `https://autospy.nl/auto/${listing.id}` }
      ]
    };
    return [vehicle, breadcrumb];
  }, [listing]);

  const handleSendMessage = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!listing) return;
    toast({ title: 'Bericht verzenden', description: 'De berichtenfunctie wordt binnenkort gelanceerd.' });
  };

  const handleShare = async () => {
    if (!listing) return;
    const url = `${window.location.origin}/auto/${listing.id}`;
    const shareData = { title: listing.title, text: `Bekijk ${listing.title} op AutoSpy`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link gekopieerd', description: 'De link is naar je klembord gekopieerd.' });
      }
    } catch {
      // User cancelled share
    }
  };

  if (!listing) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Advertentie niet gevonden</h1>
        <p className="mt-2 text-muted-foreground">Deze auto is mogelijk al verkocht of verwijderd.</p>
        <Button asChild className="mt-6">
          <Link to="/zoeken">Terug naar zoeken</Link>
        </Button>
      </div>
    );
  }

  const relatedListings = getRelatedListings(listing, 3);

  const specs = [
    { icon: Calendar, label: 'Bouwjaar', value: listing.year.toString() },
    { icon: Gauge, label: 'Km-stand', value: `${formatMileage(listing.mileage)} km` },
    { icon: Fuel, label: 'Brandstof', value: listing.fuelType },
    { icon: Settings, label: 'Transmissie', value: listing.transmission },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${listing.title} - AutoSpy`}
        description={`${listing.title} - ${formatPrice(listing.price)} - ${formatMileage(listing.mileage)} km - Bouwjaar ${listing.year} - ${listing.fuelType} - ${listing.transmission}`}
        canonical={`https://autospy.nl/auto/${listing.id}`}
        ogImage={listing.images[0]}
        jsonLd={jsonLdSchemas}
      />
      <div className="container py-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/zoeken">Zoeken</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[200px] truncate">{listing.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <ImageGallery images={listing.images} alt={listing.title} />

            {/* Title & Price - Mobile */}
            <div className="lg:hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                  <p className="mt-1 text-3xl font-bold text-accent">{formatPrice(listing.price)}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className={cn("border-border/60", isFavorite && "text-accent")}
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                  </Button>
                  <Button variant="outline" size="icon" className="border-border/60" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {specs.map((spec) => (
                <div key={spec.label} className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 border border-border/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                    <spec.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{spec.label}</div>
                    <div className="font-semibold capitalize">{spec.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Indicator */}
            <PriceIndicator listing={listing} />

            {/* Description */}
            <Card className="border-border/60 shadow-card">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Beschrijving</h2>
                <p className="mt-4 text-muted-foreground whitespace-pre-line leading-relaxed">
                  {listing.description}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-border/60 shadow-card">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Uitrusting</h2>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {listing.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card - Desktop */}
            <Card className="hidden lg:block sticky top-20 border-border/60 shadow-elevated">
              <CardContent className="p-6 space-y-6">
                {/* Title & Price */}
                <div>
                  <h1 className="text-xl font-bold">{listing.title}</h1>
                  <p className="mt-2 text-3xl font-bold text-accent">{formatPrice(listing.price)}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className={cn("border-border/60 flex-shrink-0", isFavorite && "text-accent border-accent")}
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                  </Button>
                  <Button variant="outline" size="icon" className="border-border/60 flex-shrink-0" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={isComparing ? "default" : "outline"}
                    size="icon"
                    className={cn("flex-shrink-0", !isComparing && "border-border/60")}
                    onClick={() => listing && add(listing)}
                    disabled={isComparing}
                  >
                    <GitCompareArrows className="h-5 w-5" />
                  </Button>
                </div>

                <Separator />

                {/* Seller Info */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {listing.seller.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{listing.seller.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-medium">
                          {listing.seller.type === 'dealer' ? 'Dealer' : 'Particulier'}
                        </Badge>
                        {listing.seller.type === 'dealer' && (
                          <div className="flex items-center gap-1 text-xs text-success">
                            <Shield className="h-3 w-3" />
                            Geverifieerd
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {listing.seller.rating && (
                    <div className="mt-3 flex items-center gap-2">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-medium">{listing.seller.rating}</span>
                      <span className="text-sm text-muted-foreground">({listing.seller.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Contact Buttons */}
                <div className="space-y-3">
                {listing.seller.phone && (
                    <Button asChild className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base shadow-sm">
                      <a href={`tel:${listing.seller.phone.replace(/\s/g, '')}`}>
                        <Phone className="h-5 w-5" />
                        {listing.seller.phone}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full gap-2 h-12 text-base border-border/60" onClick={handleSendMessage}>
                    <Mail className="h-5 w-5" />
                    Stuur bericht
                  </Button>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <MapPin className="h-4 w-4" />
                  {listing.location.city}, {listing.location.province}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Contact Bar */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-lg p-4 safe-bottom">
              <div className="flex gap-3">
                {listing.seller.phone && (
                  <Button asChild className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-12 shadow-sm">
                    <a href={`tel:${listing.seller.phone.replace(/\s/g, '')}`}>
                      <Phone className="h-5 w-5" />
                      Bellen
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="flex-1 gap-2 h-12 border-border/60" onClick={handleSendMessage}>
                  <Mail className="h-5 w-5" />
                  Bericht
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Listings */}
        {relatedListings.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold mb-6">Vergelijkbare auto's</h2>
            <ListingGrid listings={relatedListings} columns={3} />
          </section>
        )}
      </div>
    </div>
  );
}

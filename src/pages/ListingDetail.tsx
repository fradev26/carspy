import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Gauge, Fuel, Settings, Star, Heart, Share2,
  Shield, Check, GitCompareArrows, Home, Sparkles, Loader2, Wrench, AlertTriangle, Users,
  Cog, Leaf, BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImageGallery, ListingGrid, PriceIndicator } from '@/modules/listings';
import { useCompare } from '@/hooks/useCompare';
import { useListing, useRelatedListings } from '@/hooks/useListings';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FEATURE_OPTIONS } from '@/types/listing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { dealerSlugFor } from '@/lib/dealers';
import {
  formatPrice, formatMileage, formatPower, formatConsumption, formatNumberWithUnit, formatDate,
} from '@/lib/units';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { listing, loading } = useListing(id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [vehicleAnalysis, setVehicleAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { add, has } = useCompare();
  const isComparing = has(listing?.id || '');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const relatedListings = useRelatedListings(listing, 3);

  const displayPrice = listing?.pricePublic ?? listing?.price;
  const isAS24 = listing?.source === 'autoscout';

  const jsonLdSchemas = useMemo(() => {
    if (!listing) return undefined;
    const vehicle: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Vehicle",
      "name": listing.title,
      "brand": { "@type": "Brand", "name": listing.brand },
      "model": listing.model,
      "vehicleModelDate": listing.year.toString(),
      "mileageFromOdometer": { "@type": "QuantitativeValue", "value": listing.mileage, "unitCode": "KMT" },
      "fuelType": listing.fuelType,
      "vehicleTransmission": listing.transmission,
      "bodyType": listing.bodyType,
      "color": listing.color,
      "numberOfDoors": listing.doorCount ?? listing.doors,
      "image": listing.images[0],
      "description": listing.description,
      "offers": {
        "@type": "Offer",
        "price": displayPrice,
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": listing.seller.type === 'dealer' ? "AutoDealer" : "Person",
          "name": listing.seller.name
        }
      }
    };
    if (listing.vin) vehicle.vehicleIdentificationNumber = listing.vin;
    if (listing.firstRegistrationDate) vehicle.dateVehicleFirstRegistered = listing.firstRegistrationDate;
    if (listing.consumptionCombined) {
      vehicle.fuelConsumption = { "@type": "QuantitativeValue", value: listing.consumptionCombined, unitText: listing.combinedUnit ?? 'l/100km' };
    }
    if (listing.co2Emissions) vehicle.emissionsCO2 = listing.co2Emissions;

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vatuur.nl/" },
        { "@type": "ListItem", "position": 2, "name": "Zoeken", "item": "https://vatuur.nl/zoeken" },
        { "@type": "ListItem", "position": 3, "name": listing.title, "item": `https://vatuur.nl/auto/${listing.id}` }
      ]
    };
    return [vehicle, breadcrumb];
  }, [listing, displayPrice]);

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
    const shareData = { title: listing.title, text: `Bekijk ${listing.title} op VATUUR.`, url };
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

  const handleVehicleAnalysis = async () => {
    if (vehicleAnalysis || analysisLoading || !listing) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const { data, error } = await supabase.functions.invoke('vehicle-analysis', {
        body: { listing: { title: listing.title, brand: listing.brand, model: listing.model, year: listing.year, mileage: listing.mileage, fuelType: listing.fuelType, transmission: listing.transmission, power: listing.power, bodyType: listing.bodyType, features: listing.features, price: listing.price } },
      });
      if (error) throw new Error(error.message);
      setVehicleAnalysis(data);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : 'Analyse niet beschikbaar');
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Advertentie laden...</p>
      </div>
    );
  }

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

  const specs = [
    { icon: Calendar, label: 'Bouwjaar', value: listing.year.toString() },
    { icon: Gauge, label: 'Km-stand', value: formatMileage(listing.mileage, listing.mileageUnit) ?? '—' },
    { icon: Fuel, label: 'Brandstof', value: listing.fuelType },
    { icon: Settings, label: 'Transmissie', value: listing.transmission },
    listing.power ? { icon: Cog, label: 'Vermogen', value: formatPower(listing.power, listing.powerUnit) ?? '—' } : null,
    { icon: Settings, label: 'Carrosserie', value: listing.bodyType },
    listing.color ? { icon: Settings, label: 'Kleur', value: listing.color } : null,
    { icon: Settings, label: 'Deuren', value: String(listing.doorCount ?? listing.doors) },
    { icon: Users, label: 'Zetels', value: String(listing.seatCount ?? listing.seats) },
    listing.drivetrain ? { icon: Cog, label: 'Aandrijving', value: listing.drivetrain.toUpperCase() } : null,
  ].filter(Boolean) as { icon: typeof Calendar; label: string; value: string }[];

  const hasEmissions =
    listing.consumptionCombined != null || listing.consumptionCity != null ||
    listing.consumptionCountry != null || listing.co2Emissions != null ||
    !!listing.emissionClass || !!listing.efficiencyClass ||
    !!listing.emissionSticker || listing.particleFilter != null;

  const hasWarrantyInfo =
    listing.warrantyMonths != null || !!listing.warrantyType ||
    !!listing.warrantyDetails || !!listing.inspectionDate || !!listing.nextInspectionDate;

  const highlights = listing.highlights ?? [];
  const equipment = listing.equipment ?? listing.features ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${listing.title} - VATUUR.`}
        description={`${listing.title} - ${formatPrice(displayPrice)} - ${formatMileage(listing.mileage, listing.mileageUnit)} - Bouwjaar ${listing.year} - ${listing.fuelType} - ${listing.transmission}`}
        canonical={`https://vatuur.nl/auto/${listing.id}`}
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
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Gallery */}
            <ImageGallery images={listing.images} alt={listing.title} />

            {/* Title & Price - Mobile */}
            <div className="lg:hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                  {listing.modelVersion && (
                    <p className="text-sm text-muted-foreground mt-0.5">{listing.brand} {listing.model} {listing.modelVersion}</p>
                  )}
                  <p className="mt-1 text-3xl font-bold text-accent">{formatPrice(displayPrice)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isAS24 && <Badge variant="secondary" className="gap-1"><BadgeCheck className="h-3 w-3" />AutoScout24 import</Badge>}
                    {listing.vatDeductible && <Badge variant="secondary">Btw aftrekbaar</Badge>}
                    {listing.priceNegotiable && <Badge variant="outline">Prijs bespreekbaar</Badge>}
                  </div>
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
              {specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 border border-border/40 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background flex-shrink-0">
                    <spec.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">{spec.label}</div>
                    <div className="font-semibold capitalize break-anywhere">{spec.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Indicator */}
            <PriceIndicator listing={listing} />

            {/* Verbruik & emissies */}
            {hasEmissions && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-success" />
                    Verbruik & emissies
                  </h2>
                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                    {listing.consumptionCombined != null && (
                      <div>
                        <dt className="text-muted-foreground">Gecombineerd</dt>
                        <dd className="font-medium break-anywhere">{formatConsumption(listing.consumptionCombined, listing.combinedUnit)}</dd>
                      </div>
                    )}
                    {listing.consumptionCity != null && (
                      <div>
                        <dt className="text-muted-foreground">Stad</dt>
                        <dd className="font-medium break-anywhere">{formatConsumption(listing.consumptionCity, listing.combinedUnit)}</dd>
                      </div>
                    )}
                    {listing.consumptionCountry != null && (
                      <div>
                        <dt className="text-muted-foreground">Buitenweg</dt>
                        <dd className="font-medium break-anywhere">{formatConsumption(listing.consumptionCountry, listing.combinedUnit)}</dd>
                      </div>
                    )}
                    {listing.co2Emissions != null && (
                      <div>
                        <dt className="text-muted-foreground">CO₂</dt>
                        <dd className="font-medium break-anywhere">{formatNumberWithUnit(listing.co2Emissions, listing.co2EmissionsUnit ?? 'g/km')}</dd>
                      </div>
                    )}
                    {listing.emissionClass && (
                      <div>
                        <dt className="text-muted-foreground">Emissieklasse</dt>
                        <dd className="font-medium break-anywhere">{listing.emissionClass}</dd>
                      </div>
                    )}
                    {listing.efficiencyClass && (
                      <div>
                        <dt className="text-muted-foreground">Efficiëntieklasse</dt>
                        <dd className="font-medium break-anywhere">{listing.efficiencyClass}</dd>
                      </div>
                    )}
                    {listing.emissionSticker && (
                      <div>
                        <dt className="text-muted-foreground">Milieusticker</dt>
                        <dd className="font-medium break-anywhere">{listing.emissionSticker}</dd>
                      </div>
                    )}
                    {listing.particleFilter != null && (
                      <div>
                        <dt className="text-muted-foreground">Roetfilter</dt>
                        <dd className="font-medium break-anywhere">{listing.particleFilter ? 'Ja' : 'Nee'}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold">Highlights</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {highlights.map((h) => (
                      <Badge key={h} variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" /> {h}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {listing.description && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold">Beschrijving</h2>
                  <p className="mt-4 text-muted-foreground whitespace-pre-line leading-relaxed break-anywhere">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Equipment */}
            {equipment.length > 0 && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold">Uitrusting</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {equipment.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-foreground/80">{FEATURE_OPTIONS.find(f => f.value === feature)?.label || feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Garantie & inspectie */}
            {hasWarrantyInfo && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Garantie & inspectie
                  </h2>
                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {listing.warrantyMonths != null && (
                      <div>
                        <dt className="text-muted-foreground">Garantie</dt>
                        <dd className="font-medium break-anywhere">{listing.warrantyMonths} {listing.warrantyUnit ?? 'maanden'}</dd>
                      </div>
                    )}
                    {listing.warrantyType && (
                      <div>
                        <dt className="text-muted-foreground">Type garantie</dt>
                        <dd className="font-medium break-anywhere">{listing.warrantyType}</dd>
                      </div>
                    )}
                    {listing.inspectionDate && (
                      <div>
                        <dt className="text-muted-foreground">Laatste keuring</dt>
                        <dd className="font-medium break-anywhere">{formatDate(listing.inspectionDate)}</dd>
                      </div>
                    )}
                    {listing.nextInspectionDate && (
                      <div>
                        <dt className="text-muted-foreground">Volgende keuring</dt>
                        <dd className="font-medium break-anywhere">{formatDate(listing.nextInspectionDate)}</dd>
                      </div>
                    )}
                  </dl>
                  {listing.warrantyDetails && (
                    <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{listing.warrantyDetails}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Analysis Card */}
            <Card className="border-primary/30 shadow-elevated overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">VATUUR. AI Analyse</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Betrouwbaarheid, onderhoud & geschiktheid</p>
              </div>
              <CardContent className="p-5">
                {!vehicleAnalysis && !analysisLoading && !analysisError && (
                  <Button onClick={handleVehicleAnalysis} className="w-full gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI-analyse starten
                  </Button>
                )}
                {analysisLoading && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">AI analyseert dit voertuig...</p>
                  </div>
                )}
                {analysisError && (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">{analysisError}</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleVehicleAnalysis}>Opnieuw</Button>
                  </div>
                )}
                {vehicleAnalysis && (
                  <div className="space-y-4">
                    {vehicleAnalysis.reliability && (
                      <div className="flex items-start gap-3">
                        <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Betrouwbaarheid</p>
                          <p className="text-sm text-foreground/80 mt-0.5">{vehicleAnalysis.reliability}</p>
                        </div>
                      </div>
                    )}
                    {vehicleAnalysis.commonIssues?.length > 0 && (
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aandachtspunten</p>
                          <ul className="mt-1 space-y-1">
                            {vehicleAnalysis.commonIssues.map((issue: string, i: number) => (
                              <li key={i} className="text-sm text-foreground/80">• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {vehicleAnalysis.maintenanceCost && (
                      <div className="flex items-start gap-3">
                        <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Onderhoud</p>
                          <p className="text-sm text-foreground/80 mt-0.5">{vehicleAnalysis.maintenanceCost}</p>
                        </div>
                      </div>
                    )}
                    {vehicleAnalysis.suitability?.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Geschikt voor</p>
                          <ul className="mt-1 space-y-1">
                            {vehicleAnalysis.suitability.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-foreground/80">✓ {s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {vehicleAnalysis.verdict && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mt-2">
                        <p className="text-sm font-medium text-foreground">{vehicleAnalysis.verdict}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Card - Desktop */}
            <Card className="hidden lg:block sticky top-20 border-border/60 shadow-elevated">
              <CardContent className="p-6 space-y-6">
                {/* Title & Price */}
                <div>
                  <h1 className="text-xl font-bold">{listing.title}</h1>
                  {listing.modelVersion && (
                    <p className="text-sm text-muted-foreground mt-0.5">{listing.brand} {listing.model} {listing.modelVersion}</p>
                  )}
                  <p className="mt-2 text-3xl font-bold text-accent">{formatPrice(displayPrice)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isAS24 && <Badge variant="secondary" className="gap-1"><BadgeCheck className="h-3 w-3" />AutoScout24</Badge>}
                    {listing.vatDeductible && <Badge variant="secondary">Btw aftrekbaar</Badge>}
                    {listing.priceNegotiable && <Badge variant="outline">Bespreekbaar</Badge>}
                  </div>
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-lg">
                      {listing.seller.name.charAt(0)}
                    </div>
                    <div>
                      {listing.seller.type === 'dealer' ? (
                        <Link
                          to={`/dealer/${dealerSlugFor(listing.seller)}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {listing.seller.name}
                        </Link>
                      ) : (
                        <h3 className="font-semibold">{listing.seller.name}</h3>
                      )}
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

                  {listing.seller.type === 'dealer' && (
                    <Button asChild variant="outline" size="sm" className="mt-3 w-full border-border/60">
                      <Link to={`/dealer/${dealerSlugFor(listing.seller)}`}>
                        Bekijk volledig aanbod
                      </Link>
                    </Button>
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
                  {listing.location.city}{listing.location.province ? `, ${listing.location.province}` : ''}
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

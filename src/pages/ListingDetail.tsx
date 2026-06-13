import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Calendar, Gauge, Fuel, Settings, Star, Heart, Share2,
  Shield, ShieldCheck, GitCompareArrows, Home, Sparkles, Loader2, Wrench, AlertTriangle, Users,
  Cog, Leaf, BadgeCheck, ChevronRight, ChevronDown, Calculator, History, Crown, CheckCircle2, Car,
} from 'lucide-react';
import { EquipmentDialog } from '@/modules/listings/EquipmentDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ImageGallery, ListingGrid, PriceIndicator } from '@/modules/listings';
import { ListingCard } from '@/modules/listings/ListingCard';
import { useCompare } from '@/hooks/useCompare';
import { useListing, useRelatedListings } from '@/hooks/useListings';
import { useState, useMemo, useRef, useEffect } from 'react';
import { pushRecentListing } from '@/hooks/useRecentlyViewedListings';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { dealerSlugFor } from '@/lib/dealers';
import type { Listing } from '@/types/listing';
import {
  formatPrice, formatMileage, formatPower, formatConsumption, formatNumberWithUnit, formatDate,
} from '@/lib/units';
import {
  FEATURE_CATALOG, FEATURE_CATEGORY_ORDER, VEHICLE_INFO_ITEMS, labelForFeature, type FeatureCategory,
} from '@/modules/sell/featureCatalog';

const PREMIUM_OPTION_PATTERNS: { match: string; label: string }[] = [
  { match: 'panorama', label: 'Panoramadak' },
  { match: 'schuifdak', label: 'Schuifdak' },
  { match: 'adaptive cruise', label: 'Adaptive Cruise Control' },
  { match: 'adaptieve cruise', label: 'Adaptive Cruise Control' },
  { match: 'head-up', label: 'Head-up Display' },
  { match: 'head up', label: 'Head-up Display' },
  { match: 'stoelverwarming', label: 'Stoelverwarming' },
  { match: 'verwarmde stoel', label: 'Verwarmde stoelen' },
  { match: 'ventilatie', label: 'Stoelventilatie' },
  { match: 'massage', label: 'Massagestoelen' },
  { match: 'leder', label: 'Lederen bekleding' },
  { match: 'leather', label: 'Lederen bekleding' },
  { match: '360', label: '360° camera' },
  { match: 'achteruitrijcamera', label: 'Achteruitrijcamera' },
  { match: 'camera', label: 'Camera' },
  { match: 'matrix', label: 'Matrix LED' },
  { match: 'led', label: 'LED-verlichting' },
  { match: 'xenon', label: 'Xenon' },
  { match: 'bang', label: 'Bang & Olufsen audio' },
  { match: 'harman', label: 'Harman Kardon audio' },
  { match: 'bose', label: 'Bose audio' },
  { match: 'burmester', label: 'Burmester audio' },
  { match: 'navigatie', label: 'Navigatie' },
  { match: 'apple carplay', label: 'Apple CarPlay' },
  { match: 'android auto', label: 'Android Auto' },
  { match: 'trekhaak', label: 'Trekhaak' },
  { match: 'keyless', label: 'Keyless entry' },
  { match: 'elektrische klep', label: 'Elektrische achterklep' },
  { match: 'lane assist', label: 'Lane Assist' },
  { match: 'dodehoek', label: 'Dodehoekdetectie' },
  { match: 'blind spot', label: 'Dodehoekdetectie' },
  { match: 'sportstoel', label: 'Sportstoelen' },
  { match: 'sfeerverlichting', label: 'Sfeerverlichting' },
  { match: 'virtual cockpit', label: 'Virtual Cockpit' },
];

function pickPremiumOptions(equipment: string[]): string[] {
  const lower = equipment.map((e) => e.toLowerCase());
  const seen = new Set<string>();
  const result: string[] = [];
  for (const { match, label } of PREMIUM_OPTION_PATTERNS) {
    if (seen.has(label)) continue;
    if (lower.some((e) => e.includes(match))) {
      seen.add(label);
      result.push(label);
    }
    if (result.length >= 8) break;
  }
  return result;
}

function buildWhyBuy(listing: Listing): string[] {
  const points: string[] = [];
  const currentYear = new Date().getFullYear();
  const age = currentYear - listing.year;

  if (listing.mileage && age > 0 && listing.mileage / age < 12000) {
    points.push(`Lage kilometerstand: ${formatMileage(listing.mileage, listing.mileageUnit)} (${Math.round(listing.mileage / age).toLocaleString('nl-NL')} km/jaar)`);
  }
  if (listing.previousOwnerCount === 1) {
    points.push('Slechts één eigenaar — volledig herleidbare historie');
  } else if (listing.previousOwnerCount === 0) {
    points.push('Nieuwe wagen, nog geen eerdere eigenaars');
  }
  if (listing.warrantyMonths && listing.warrantyMonths > 0) {
    points.push(`${listing.warrantyMonths} ${listing.warrantyUnit ?? 'maanden'} garantie inbegrepen${listing.warrantyType ? ` (${listing.warrantyType})` : ''}`);
  }
  if (listing.power && listing.power >= 150) {
    points.push(`Sterk vermogen: ${formatPower(listing.power, listing.powerUnit)}`);
  }
  const premium = pickPremiumOptions(listing.equipment ?? listing.features ?? []);
  if (premium.length >= 3) {
    points.push(`Rijk uitgerust met ${premium.slice(0, 3).join(', ')}`);
  } else if (premium.length > 0) {
    points.push(`Premium uitrusting: ${premium.join(', ')}`);
  }
  if (listing.nextInspectionDate) {
    const next = new Date(listing.nextInspectionDate);
    if (!isNaN(next.getTime()) && next > new Date()) {
      points.push(`Recent gekeurd — volgende keuring ${formatDate(listing.nextInspectionDate)}`);
    }
  }
  if (listing.vatDeductible) {
    points.push('Btw aftrekbaar — interessant voor zelfstandigen en bedrijven');
  }
  return points.slice(0, 5);
}

type TimelineItem = { date: string; sortKey: number; title: string; description?: string };

function buildTimeline(listing: Listing): TimelineItem[] {
  const items: TimelineItem[] = [];
  const push = (dateStr: string | undefined | null, title: string, description?: string) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    items.push({ date: formatDate(dateStr) ?? dateStr, sortKey: d.getTime(), title, description });
  };
  push(listing.firstRegistrationDate, 'Eerste inschrijving', `${listing.brand} ${listing.model}`);
  if (listing.previousOwnerCount != null) {
    items.push({
      date: '—',
      sortKey: (listing.firstRegistrationDate ? new Date(listing.firstRegistrationDate).getTime() : 0) + 1,
      title: `${listing.previousOwnerCount} ${listing.previousOwnerCount === 1 ? 'eigenaar' : 'eigenaars'}`,
      description: listing.previousOwnerCount === 1 ? 'Eén zorgvuldige eigenaar' : undefined,
    });
  }
  push(listing.inspectionDate, 'Laatste keuring uitgevoerd');
  // Service history
  const sh = listing.serviceHistory;
  if (Array.isArray(sh)) {
    for (const entry of sh as Array<Record<string, unknown>>) {
      const dateStr = (entry?.date as string) ?? (entry?.performed_at as string);
      const title = (entry?.title as string) ?? (entry?.type as string) ?? 'Onderhoud';
      const desc = (entry?.description as string) ?? (entry?.notes as string);
      push(dateStr, title, desc);
    }
  }
  push(listing.nextInspectionDate, 'Volgende keuring gepland');
  return items.sort((a, b) => a.sortKey - b.sortKey);
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { listing, loading } = useListing(id);
  const { isFavorite: isFavCheck, toggle: toggleFav } = useFavorites();
  const isFavorite = listing ? isFavCheck(listing.id) : false;
  const handleFavoriteToggle = () => { if (listing) toggleFav(listing.id); };
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [optionAccordion, setOptionAccordion] = useState<string>('');
  const optionListRef = useRef<HTMLDivElement | null>(null);
  const [vehicleAnalysis, setVehicleAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { add, has } = useCompare();
  const isComparing = has(listing?.id || '');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const relatedListings = useRelatedListings(listing, 6);

  useEffect(() => {
    if (!listing) return;
    pushRecentListing({
      id: listing.id,
      title: listing.title,
      price: listing.pricePublic ?? listing.price ?? null,
      image: listing.images?.[0] ?? null,
      city: listing.location?.city ?? null,
    });
  }, [listing]);

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
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vatuur.be/" },
        { "@type": "ListItem", "position": 2, "name": "Zoeken", "item": "https://vatuur.be/zoeken" },
        { "@type": "ListItem", "position": 3, "name": listing.title, "item": `https://vatuur.be/auto/${listing.id}` }
      ]
    };
    return [vehicle, breadcrumb];
  }, [listing, displayPrice]);

  const handleSendMessage = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!listing) return;
    toast({ title: 'Bericht verzenden', description: 'De berichtenfunctie wordt binnenkort gelanceerd.' });
  };

  const handleShare = async () => {
    if (!listing) return;
    const url = `${window.location.origin}/auto/${listing.id}`;
    const shareData = { title: listing.title, text: `Bekijk ${listing.title} op VATUUR.`, url };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link gekopieerd', description: 'De link is naar je klembord gekopieerd.' });
      }
    } catch { /* cancelled */ }
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

  // Key specs — exactly the 6 prescribed, always in this order
  const keySpecs = [
    { icon: Calendar, label: 'Bouwjaar', value: listing.year.toString() },
    { icon: Gauge, label: 'Km-stand', value: formatMileage(listing.mileage, listing.mileageUnit) ?? '—' },
    { icon: Fuel, label: 'Brandstof', value: listing.fuelType },
    { icon: Settings, label: 'Transmissie', value: listing.transmission },
    { icon: Cog, label: 'Vermogen', value: listing.power ? (formatPower(listing.power, listing.powerUnit) ?? '—') : '—' },
    { icon: Car, label: 'Carrosserie', value: listing.bodyType },
  ];

  const equipment = listing.equipment ?? listing.features ?? [];
  const highlights = listing.highlights ?? [];
  const premiumOptions = pickPremiumOptions(equipment);
  const whyBuy = buildWhyBuy(listing);
  const timeline = buildTimeline(listing);

  // Categorized feature list — built from specs.vehicle_features (new wizard) with fallback to equipment[]
  const vehicleFeatures = (listing.specs?.vehicle_features as Partial<Record<FeatureCategory | 'vehicle_information', string[]>> | undefined) ?? null;
  const categorizedSections: { key: string; title: string; labels: string[] }[] = [];
  if (vehicleFeatures) {
    for (const cat of FEATURE_CATEGORY_ORDER) {
      const vals = vehicleFeatures[cat] ?? [];
      if (vals.length) categorizedSections.push({ key: cat, title: FEATURE_CATALOG[cat].title, labels: vals.map(labelForFeature) });
    }
    const info = vehicleFeatures.vehicle_information ?? [];
    if (info.length) categorizedSections.push({ key: 'vehicle_information', title: 'Voertuiginformatie', labels: info.map(labelForFeature) });
  } else if (equipment.length) {
    categorizedSections.push({ key: 'all', title: 'Opties & uitrusting', labels: equipment });
  }
  const totalOptionCount = categorizedSections.reduce((sum, s) => sum + s.labels.length, 0);

  const scrollToOptions = () => {
    setOptionAccordion('options');
    setTimeout(() => optionListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };


  const hasTrustData =
    listing.warrantyMonths != null || !!listing.warrantyType || !!listing.inspectionDate ||
    !!listing.nextInspectionDate || listing.previousOwnerCount != null ||
    (listing.seller.type === 'dealer') ||
    (listing.includedServices && listing.includedServices.length > 0);

  const monthlyEstimate = displayPrice ? Math.round(displayPrice * 0.0185) : null;

  const hasEmissions =
    listing.consumptionCombined != null || listing.consumptionCity != null ||
    listing.consumptionCountry != null || listing.co2Emissions != null ||
    !!listing.emissionClass || !!listing.efficiencyClass ||
    !!listing.emissionSticker || listing.particleFilter != null;

  const engineSpecs = [
    listing.power && { label: 'Vermogen', value: formatPower(listing.power, listing.powerUnit) },
    listing.engineSize && { label: 'Cilinderinhoud', value: formatNumberWithUnit(listing.cylinderCapacity ?? listing.engineSize, listing.cylinderCapacityUnit ?? 'cc') },
    listing.cylinderCount && { label: 'Cilinders', value: String(listing.cylinderCount) },
    listing.gearCount && { label: 'Versnellingen', value: String(listing.gearCount) },
    listing.drivetrain && { label: 'Aandrijving', value: listing.drivetrain.toUpperCase() },
    listing.transmission && { label: 'Transmissie', value: listing.transmission },
  ].filter(Boolean) as { label: string; value: string }[];

  const dimensionsSpecs = [
    listing.doorCount && { label: 'Deuren', value: String(listing.doorCount ?? listing.doors) },
    listing.seatCount && { label: 'Zitplaatsen', value: String(listing.seatCount ?? listing.seats) },
    listing.color && { label: 'Kleur', value: listing.color },
    listing.alloyWheelSize && { label: 'Velgmaat', value: formatNumberWithUnit(listing.alloyWheelSize, listing.alloyWheelSizeUnit ?? 'inch') },
    listing.emptyWeight && { label: 'Leeggewicht', value: formatNumberWithUnit(listing.emptyWeight, listing.emptyWeightUnit ?? 'kg') },
  ].filter(Boolean) as { label: string; value: string }[];

  const identitySpecs = [
    listing.vin && { label: 'VIN', value: listing.vin },
    listing.licencePlate && { label: 'Kenteken', value: listing.licencePlate },
    listing.countryVersion && { label: 'Landuitvoering', value: listing.countryVersion },
    listing.modelVersion && { label: 'Uitvoering', value: listing.modelVersion },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${listing.title} - VATUUR.`}
        description={`${listing.title} - ${formatPrice(displayPrice)} - ${formatMileage(listing.mileage, listing.mileageUnit)} - Bouwjaar ${listing.year} - ${listing.fuelType} - ${listing.transmission}`}
        canonical={`https://vatuur.be/auto/${listing.id}`}
        ogImage={listing.images[0]}
        jsonLd={jsonLdSchemas}
      />
      <div className="container py-6 pb-[7rem] lg:pb-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/"><Home className="h-4 w-4" /></Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/zoeken">Zoeken</Link></BreadcrumbLink>
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
            {/* 1. Gallery */}
            <ImageGallery images={listing.images} alt={listing.title} />

            {/* 2. Title & Price - Mobile */}
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
                  <Button variant="outline" size="icon" className={cn("border-border/60", isFavorite && "text-accent")} onClick={handleFavoriteToggle}>
                    <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                  </Button>
                  <Button variant="outline" size="icon" className="border-border/60" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 3. Key Specs - exactly 6 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {keySpecs.map((spec, i) => (
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

            {/* 3b. Quick action — jump to full option list */}
            {totalOptionCount > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={scrollToOptions}
                className="w-full justify-between border-border/60 bg-card hover:bg-muted/40"
              >
                <span className="font-medium">Bekijk volledige optielijst ({totalOptionCount})</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}


            {/* 4. Why this car */}
            {whyBuy.length > 0 && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Waarom deze auto interessant is
                  </h2>
                  <ul className="mt-4 space-y-2.5">
                    {whyBuy.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/85 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 5. Trust block */}
            {hasTrustData && (
              <Card className="border-border/60 shadow-card overflow-hidden">
                <div className="bg-gradient-to-r from-success/10 to-success/5 px-6 py-3 border-b border-success/20">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-success" />
                    Vertrouwen & zekerheid
                  </h2>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {listing.seller.type === 'dealer' && (
                      <div className="flex items-start gap-3">
                        <BadgeCheck className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">Verkoper</div>
                          <div className="font-medium">Geverifieerde dealer</div>
                        </div>
                      </div>
                    )}
                    {listing.previousOwnerCount != null && (
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">Aantal eigenaren</div>
                          <div className="font-medium">{listing.previousOwnerCount}</div>
                        </div>
                      </div>
                    )}
                    {listing.warrantyMonths != null && (
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">Garantie</div>
                          <div className="font-medium">{listing.warrantyMonths} {listing.warrantyUnit ?? 'maanden'}{listing.warrantyType ? ` · ${listing.warrantyType}` : ''}</div>
                        </div>
                      </div>
                    )}
                    {listing.inspectionDate && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">Laatste keuring</div>
                          <div className="font-medium">{formatDate(listing.inspectionDate)}</div>
                        </div>
                      </div>
                    )}
                    {listing.nextInspectionDate && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">Volgende keuring</div>
                          <div className="font-medium">{formatDate(listing.nextInspectionDate)}</div>
                        </div>
                      </div>
                    )}
                    {listing.includedServices && listing.includedServices.length > 0 && (
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <Wrench className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">Inbegrepen diensten</div>
                          <div className="font-medium break-anywhere">{listing.includedServices.join(' · ')}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {listing.warrantyDetails && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line border-t border-border/40 pt-3">{listing.warrantyDetails}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 6. Price Indicator */}
            <PriceIndicator listing={listing} />

            {/* 7. Total cost */}
            {displayPrice != null && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Totale kostprijs
                  </h2>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-muted/40 border border-border/40 p-4">
                      <dt className="text-xs text-muted-foreground">Vraagprijs</dt>
                      <dd className="text-2xl font-bold text-accent mt-1">{formatPrice(displayPrice)}</dd>
                      {listing.priceNegotiable && (
                        <p className="text-xs text-muted-foreground mt-1">Prijs bespreekbaar</p>
                      )}
                    </div>
                    {monthlyEstimate && (
                      <div className="rounded-lg bg-muted/40 border border-border/40 p-4">
                        <dt className="text-xs text-muted-foreground">Geschatte maandlast</dt>
                        <dd className="text-2xl font-bold mt-1">{formatPrice(monthlyEstimate)}<span className="text-sm font-normal text-muted-foreground">/mnd</span></dd>
                        <p className="text-xs text-muted-foreground mt-1">Indicatief · 60 mnd · 5% rente</p>
                      </div>
                    )}
                  </dl>
                  {(listing.vatDeductible != null || listing.vatRate != null) && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-border/40 p-3 text-sm">
                      <BadgeCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Btw-informatie</div>
                        <div className="text-muted-foreground">
                          {listing.vatDeductible ? 'Btw aftrekbaar' : 'Marge-regeling — geen btw aftrekbaar'}
                          {listing.vatRate != null && ` · ${listing.vatRate}% btw`}
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Bijkomende kosten zoals registratie, verzekering en transport zijn niet inbegrepen.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 8. Highlights / Premium equipment */}
            {(highlights.length > 0 || premiumOptions.length > 0 || equipment.length > 0) && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Hoogtepunten uitrusting
                  </h2>
                  {highlights.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {highlights.map((h) => (
                        <Badge key={h} variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" /> {h}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {premiumOptions.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {premiumOptions.map((opt) => (
                        <div key={opt} className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          <span className="truncate">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {totalOptionCount > 0 && (
                    <div ref={optionListRef} className="mt-4 scroll-mt-24">
                      <Accordion
                        type="single"
                        collapsible
                        value={optionAccordion}
                        onValueChange={setOptionAccordion}
                      >
                        <AccordionItem value="options" className="rounded-xl border border-border/60 bg-card px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="font-semibold text-foreground">
                              Bekijk optielijst ({totalOptionCount})
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-5 pb-2">
                              {categorizedSections.map((section) => (
                                <div key={section.key}>
                                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    {section.title}
                                  </h3>
                                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                    {section.labels.map((label) => (
                                      <li key={label} className="flex items-start gap-2 text-sm text-foreground/85">
                                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                        <span className="break-anywhere">{label}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      {/* Behouden voor backwards-compat / interne triggers — niet meer primair zichtbaar */}
                      <EquipmentDialog open={equipmentOpen} onOpenChange={setEquipmentOpen} equipment={equipment} />
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* 9. Vehicle history timeline */}
            {timeline.length >= 2 && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Voertuiggeschiedenis
                  </h2>
                  <ol className="mt-5 space-y-5 border-l border-border/60 pl-5">
                    {timeline.map((item, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="text-xs text-muted-foreground">{item.date}</div>
                        <div className="font-medium text-foreground">{item.title}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground mt-0.5">{item.description}</div>
                        )}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* 10/11. Detailed specifications (incl. emissions) */}
            {(engineSpecs.length > 0 || dimensionsSpecs.length > 0 || hasEmissions || identitySpecs.length > 0) && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Cog className="h-5 w-5 text-primary" />
                    Gedetailleerde specificaties
                  </h2>

                  {engineSpecs.length > 0 && (
                    <SpecGroup title="Motor & prestaties" items={engineSpecs} />
                  )}
                  {dimensionsSpecs.length > 0 && (
                    <SpecGroup title="Afmetingen & comfort" items={dimensionsSpecs} />
                  )}
                  {hasEmissions && (
                    <SpecGroup
                      title="Verbruik & emissies"
                      icon={<Leaf className="h-4 w-4 text-success" />}
                      items={[
                        listing.consumptionCombined != null && { label: 'Gecombineerd', value: formatConsumption(listing.consumptionCombined, listing.combinedUnit) ?? '—' },
                        listing.consumptionCity != null && { label: 'Stad', value: formatConsumption(listing.consumptionCity, listing.combinedUnit) ?? '—' },
                        listing.consumptionCountry != null && { label: 'Buitenweg', value: formatConsumption(listing.consumptionCountry, listing.combinedUnit) ?? '—' },
                        listing.co2Emissions != null && { label: 'CO₂', value: formatNumberWithUnit(listing.co2Emissions, listing.co2EmissionsUnit ?? 'g/km') ?? '—' },
                        listing.emissionClass && { label: 'Emissieklasse', value: listing.emissionClass },
                        listing.efficiencyClass && { label: 'Efficiëntieklasse', value: listing.efficiencyClass },
                        listing.emissionSticker && { label: 'Milieusticker', value: listing.emissionSticker },
                        listing.particleFilter != null && { label: 'Roetfilter', value: listing.particleFilter ? 'Ja' : 'Nee' },
                      ].filter(Boolean) as { label: string; value: string }[]}
                    />
                  )}
                  {identitySpecs.length > 0 && (
                    <SpecGroup title="Identificatie" items={identitySpecs} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* 12. Seller description */}
            {listing.description && (
              <Card className="border-border/60 shadow-card">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold">Beschrijving van de verkoper</h2>
                  <p className="mt-4 max-w-prose text-muted-foreground whitespace-pre-line leading-relaxed break-anywhere">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 13. Dealer info (mobile only — desktop sidebar already shows it) */}
            <Card className="lg:hidden border-border/60 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-lg">
                    {listing.seller.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    {listing.seller.type === 'dealer' ? (
                      <Link to={`/dealer/${dealerSlugFor(listing.seller)}`} className="font-semibold hover:text-primary transition-colors block truncate">
                        {listing.seller.name}
                      </Link>
                    ) : (
                      <h3 className="font-semibold truncate">{listing.seller.name}</h3>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="secondary" className="font-medium">
                        {listing.seller.type === 'dealer' ? 'Dealer' : 'Particulier'}
                      </Badge>
                      {listing.seller.type === 'dealer' && (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <Shield className="h-3 w-3" /> Geverifieerd
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {listing.location.city}{listing.location.province ? `, ${listing.location.province}` : ''}
                </div>
                {listing.seller.type === 'dealer' && (
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full border-border/60">
                    <Link to={`/dealer/${dealerSlugFor(listing.seller)}`}>Bekijk volledig aanbod</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
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
                    <Sparkles className="h-4 w-4" /> AI-analyse starten
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

                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className={cn("border-border/60 flex-shrink-0", isFavorite && "text-accent border-accent")} onClick={handleFavoriteToggle}>
                    <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                  </Button>
                  <Button variant="outline" size="icon" className="border-border/60 flex-shrink-0" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button variant={isComparing ? "default" : "outline"} size="icon" className={cn("flex-shrink-0", !isComparing && "border-border/60")} onClick={() => listing && add(listing)} disabled={isComparing}>
                    <GitCompareArrows className="h-5 w-5" />
                  </Button>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-lg">
                      {listing.seller.name.charAt(0)}
                    </div>
                    <div>
                      {listing.seller.type === 'dealer' ? (
                        <Link to={`/dealer/${dealerSlugFor(listing.seller)}`} className="font-semibold hover:text-primary transition-colors">
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
                            <Shield className="h-3 w-3" /> Geverifieerd
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
                      <Link to={`/dealer/${dealerSlugFor(listing.seller)}`}>Bekijk volledig aanbod</Link>
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  {listing.seller.phone && (
                    <Button asChild className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base shadow-sm">
                      <a href={`tel:${listing.seller.phone.replace(/\s/g, '')}`}>
                        <Phone className="h-5 w-5" /> {listing.seller.phone}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full gap-2 h-12 text-base border-border/60" onClick={handleSendMessage}>
                    <Mail className="h-5 w-5" /> Stuur bericht
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <MapPin className="h-4 w-4" />
                  {listing.location.city}{listing.location.province ? `, ${listing.location.province}` : ''}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Contact Bar */}
            <div className="lg:hidden fixed left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-lg p-4 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
              <div className="flex gap-3">
                {listing.seller.phone && (
                  <Button asChild className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-12 shadow-sm">
                    <a href={`tel:${listing.seller.phone.replace(/\s/g, '')}`}>
                      <Phone className="h-5 w-5" /> Bellen
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="flex-1 gap-2 h-12 border-border/60" onClick={handleSendMessage}>
                  <Mail className="h-5 w-5" /> Bericht
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 14. Related Listings */}
        {relatedListings.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold mb-6">Vergelijkbare auto's</h2>
            {/* Mobile: horizontal scroll */}
            <div className="lg:hidden -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {relatedListings.map((rl) => (
                <div key={rl.id} className="snap-start flex-shrink-0 w-[80%] max-w-[320px]">
                  <ListingCard listing={rl} />
                </div>
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden lg:block">
              <ListingGrid listings={relatedListings.slice(0, 3)} columns={3} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SpecGroup({ title, items, icon }: { title: string; items: { label: string; value: string }[]; icon?: React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5 first:mt-4">
      <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
        {items.map((item, i) => (
          <div key={i}>
            <dt className="text-muted-foreground text-xs">{item.label}</dt>
            <dd className="font-medium break-anywhere">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

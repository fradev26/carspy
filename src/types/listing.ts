export interface Listing {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  bodyType: BodyType;
  color: string;
  power: number; // in HP
  engineSize: number; // in liters
  doors: number;
  seats: number;
  images: string[];
  description: string;
  features: string[];
  location: {
    city: string;
    province: string;
  };
  seller: Seller;
  createdAt: string;
  updatedAt: string;
  views: number;
  status: ListingStatus;
  // Extended fields for advanced filtering
  driveType?: DriveType;
  paintType?: PaintType;
  interiorColor?: string;
  interiorMaterial?: InteriorMaterial;
  euroNorm?: EuroNorm;
  previousOwners?: number;
  warrantyMonths?: number;
  hasDamageHistory?: boolean;
  vatDeductible?: boolean;
  isNonSmoker?: boolean;
  hasMaintenanceHistory?: boolean;
  lastMaintenance?: string;
  isPremium?: boolean;
  boostUntil?: string;

  // ===== VATUUR datacontract — manual + AutoScout24 shared schema =====
  source?: 'manual' | 'autoscout' | string;
  as24ListingId?: string;
  as24PublicationStatus?: string;
  vin?: string;
  licencePlate?: string;
  crossReferenceId?: string;
  offerReferenceId?: string;
  vehicleType?: string;
  conditionType?: string;
  modelVersion?: string;

  mileageUnit?: string;
  powerUnit?: string;
  alloyWheelSize?: number;
  alloyWheelSizeUnit?: string;
  emptyWeight?: number;
  emptyWeightUnit?: string;
  doorCount?: number;
  seatCount?: number;

  additionalFuelTypes?: string[];
  cylinderCapacity?: number;
  cylinderCapacityUnit?: string;
  cylinderCount?: number;
  drivetrain?: string;
  gearCount?: number;

  co2Emissions?: number;
  co2EmissionsUnit?: string;
  consumptionCombined?: number;
  consumptionCity?: number;
  consumptionCountry?: number;
  combinedUnit?: string;
  emissionClass?: string;
  emissionSticker?: string;
  efficiencyClass?: string;
  particleFilter?: boolean;

  firstRegistrationDate?: string;
  previousOwnerCount?: number;
  countryVersion?: string;

  pricePublic?: number;
  priceNegotiable?: boolean;
  vatRate?: number;

  warrantyUnit?: string;
  warrantyType?: string;
  warrantyDetails?: string;
  inspectionDate?: string;
  nextInspectionDate?: string;

  equipment?: string[];
  highlights?: string[];
  includedServices?: string[];

  serviceHistory?: unknown;
  leasingOffers?: unknown;
  marketing?: unknown;
  publication?: unknown;
  availability?: unknown;
  condition?: unknown;
  specs?: Record<string, unknown>;
}

export interface Seller {
  id: string;
  name: string;
  type: 'private' | 'dealer';
  phone?: string;
  email?: string;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  memberSince: string;
  responseTime?: string;
}

export type FuelType = 'benzine' | 'diesel' | 'elektrisch' | 'hybride' | 'plug-in hybride' | 'lpg';
export type TransmissionType = 'handgeschakeld' | 'automaat' | 'semi-automaat';
export type BodyType = 'sedan' | 'hatchback' | 'stationwagon' | 'suv' | 'cabrio' | 'coupe' | 'mpv' | 'bestelwagen';
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'draft';

// New extended types
export type DriveType = 'fwd' | 'rwd' | 'awd';
export type PaintType = 'uni' | 'metallic' | 'pearl' | 'matte';
export type InteriorMaterial = 'fabric' | 'leather' | 'half-leather' | 'alcantara';
export type EuroNorm = 'euro4' | 'euro5' | 'euro6' | 'euro6d' | 'euro6d-temp';
export type OnlineSince = 'today' | '3d' | '7d' | '14d' | '30d' | '30d+';
export type WarrantyOption = '6m' | '12m' | '24m' | '36m';

export type PowerUnit = 'pk' | 'kW';

export interface SearchFilters {
  // 1. Quick Selection (Snelle selectie)
  /** @deprecated single-brand form, kept for legacy consumers (SearchBar, dealer inventory). */
  brand?: string;
  /** @deprecated single-model form, kept for legacy consumers. */
  model?: string;
  /** Multi-select merken. */
  brands?: string[];
  /** Multi-select modellen, gecodeerd als "Merk:Model". */
  models?: string[];
  /** Vrije zoekterm op uitvoering / model_version. */
  trim?: string;
  /** Staat van het voertuig (condition_type). */
  conditionTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  fuelTypes?: FuelType[];
  bodyTypes?: BodyType[];

  
  // 2. Drive & Performance (Aandrijving & prestaties)
  transmissions?: TransmissionType[];
  driveTypes?: DriveType[];
  minPower?: number;
  maxPower?: number;
  /** Eenheid waarin minPower/maxPower zijn ingevuld (default 'pk'). */
  powerUnit?: PowerUnit;
  /** Emissieklasse (emission_class), bv. "Euro 6d". */
  emissionClasses?: string[];
  /** Maximale CO2-uitstoot in g/km. */
  maxCo2?: number;

  // 3. Exterior & Interior (Carrosserie & uiterlijk)
  paintTypes?: PaintType[];
  colors?: string[];
  interiorColors?: string[];
  interiorMaterials?: InteriorMaterial[];
  
  // 4. Practical (Praktisch)
  minDoors?: number;
  minSeats?: number;
  
  // 5. Location & Timing (Locatie & timing)
  country?: string;
  postalCode?: string;
  location?: string;
  province?: string;
  radius?: number;
  onlineSince?: OnlineSince;
  
  // 6. History & Trust (Historiek & zekerheid)
  sellerType?: 'private' | 'dealer';
  maxPreviousOwners?: number;
  minWarranty?: WarrantyOption;
  noDamageHistory?: boolean;
  vatDeductible?: boolean;
  /** Nog lopende fabrieks-/dealergarantie. */
  factoryWarranty?: boolean;
  /** Car-Pass / onderhoudshistoriek aanwezig. */
  carPass?: boolean;
  hasMaintenanceHistory?: boolean;
  isNonSmoker?: boolean;
  
  // 7. Options & Features (Opties & extra's)
  features?: string[];
}

/** Staat van het voertuig — labels voor de waarden die in condition_type voorkomen. */
export const CONDITION_TYPE_LABELS: Record<string, string> = {
  new: 'Nieuw',
  nieuw: 'Nieuw',
  used: 'Tweedehands',
  tweedehands: 'Tweedehands',
  damaged: 'Beschadigd',
  beschadigd: 'Beschadigd',
  excellent: 'Uitstekend',
  good: 'Goed',
  fair: 'Redelijk',
  poor: 'Matig',
};

export const CONDITION_TYPES: { value: string; label: string }[] = [
  { value: 'new', label: 'Nieuw' },
  { value: 'used', label: 'Tweedehands' },
  { value: 'damaged', label: 'Beschadigd' },
];

export const CO2_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '0 g/km (emissievrij)' },
  { value: 95, label: 'Max. 95 g/km' },
  { value: 120, label: 'Max. 120 g/km' },
  { value: 150, label: 'Max. 150 g/km' },
  { value: 200, label: 'Max. 200 g/km' },
];


export interface SortOption {
  value: string;
  label: string;
}

export const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'benzine', label: 'Benzine' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'elektrisch', label: 'Elektrisch' },
  { value: 'hybride', label: 'Hybride' },
  { value: 'plug-in hybride', label: 'Plug-in Hybride' },
  { value: 'lpg', label: 'LPG' },
];

export const TRANSMISSION_TYPES: { value: TransmissionType; label: string }[] = [
  { value: 'handgeschakeld', label: 'Handgeschakeld' },
  { value: 'automaat', label: 'Automaat' },
  { value: 'semi-automaat', label: 'Semi-automaat' },
];

export const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'stationwagon', label: 'Stationwagon' },
  { value: 'suv', label: 'SUV' },
  { value: 'cabrio', label: 'Cabrio' },
  { value: 'coupe', label: 'Coupé' },
  { value: 'mpv', label: 'MPV' },
  { value: 'bestelwagen', label: 'Bestelwagen' },
];

export const DRIVE_TYPES: { value: DriveType; label: string }[] = [
  { value: 'fwd', label: 'Voorwielaandrijving' },
  { value: 'rwd', label: 'Achterwielaandrijving' },
  { value: 'awd', label: 'Vierwielaandrijving / 4WD' },
];

export const PAINT_TYPES: { value: PaintType; label: string }[] = [
  { value: 'uni', label: 'Uni' },
  { value: 'metallic', label: 'Metallic' },
  { value: 'pearl', label: 'Parelmoer' },
  { value: 'matte', label: 'Mat' },
];

export const INTERIOR_MATERIALS: { value: InteriorMaterial; label: string }[] = [
  { value: 'fabric', label: 'Stof' },
  { value: 'leather', label: 'Leder' },
  { value: 'half-leather', label: 'Half leder' },
  { value: 'alcantara', label: 'Alcantara' },
];

export const EURO_NORMS: { value: EuroNorm; label: string }[] = [
  { value: 'euro4', label: 'Euro 4' },
  { value: 'euro5', label: 'Euro 5' },
  { value: 'euro6', label: 'Euro 6' },
  { value: 'euro6d-temp', label: 'Euro 6d-temp' },
  { value: 'euro6d', label: 'Euro 6d' },
];

export const ONLINE_SINCE_OPTIONS: { value: OnlineSince; label: string }[] = [
  { value: 'today', label: 'Vandaag' },
  { value: '3d', label: 'Afgelopen 3 dagen' },
  { value: '7d', label: 'Afgelopen 7 dagen' },
  { value: '14d', label: 'Afgelopen 14 dagen' },
  { value: '30d', label: 'Afgelopen 30 dagen' },
  { value: '30d+', label: 'Langer dan 30 dagen' },
];

export const WARRANTY_OPTIONS: { value: WarrantyOption; label: string }[] = [
  { value: '6m', label: '6 maanden' },
  { value: '12m', label: '12 maanden' },
  { value: '24m', label: '24 maanden' },
  { value: '36m', label: '36 maanden' },
];

export interface ColorOption {
  value: string;
  label: string;
  hex?: string;
  /** Special swatch style (gradient, hatch). */
  swatch?: 'two-tone' | 'other';
}

export const COLOR_OPTIONS: ColorOption[] = [
  { value: 'Zwart', label: 'Zwart', hex: '#111111' },
  { value: 'Wit', label: 'Wit', hex: '#FFFFFF' },
  { value: 'Grijs', label: 'Grijs', hex: '#7A7A7A' },
  { value: 'Zilver', label: 'Zilver', hex: '#C6C9CC' },
  { value: 'Blauw', label: 'Blauw', hex: '#1E40AF' },
  { value: 'Rood', label: 'Rood', hex: '#DC2626' },
  { value: 'Groen', label: 'Groen', hex: '#15803D' },
  { value: 'Geel', label: 'Geel', hex: '#FACC15' },
  { value: 'Oranje', label: 'Oranje', hex: '#F97316' },
  { value: 'Bruin', label: 'Bruin', hex: '#78350F' },
  { value: 'Beige', label: 'Beige', hex: '#D6C7A1' },
  { value: 'Crème', label: 'Crème', hex: '#F5EBD3' },
  { value: 'Goud', label: 'Goud', hex: '#C9A227' },
  { value: 'Paars', label: 'Paars', hex: '#7C3AED' },
  { value: 'Roze', label: 'Roze', hex: '#EC4899' },
  { value: 'Turquoise', label: 'Turquoise', hex: '#14B8A6' },
  { value: 'Bordeaux', label: 'Bordeaux', hex: '#7F1D1D' },
  { value: 'Tweekleurig', label: 'Tweekleurig', swatch: 'two-tone' },
  { value: 'Overig', label: 'Overig', swatch: 'other' },
];

export const PROVINCES = [
  'Noord-Holland', 'Zuid-Holland', 'Utrecht', 'Noord-Brabant', 'Gelderland',
  'Overijssel', 'Limburg', 'Flevoland', 'Groningen', 'Friesland', 'Drenthe', 'Zeeland'
];

export const COUNTRY_OPTIONS = [
  { value: 'nl', label: 'Nederland' },
  { value: 'be', label: 'België' },
];

export const RADIUS_OPTIONS = [
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 250, label: '250 km' },
];

export const FEATURE_OPTIONS: { value: string; label: string; category: string }[] = [
  // Comfort
  { value: 'airco', label: 'Airconditioning', category: 'comfort' },
  { value: 'climate_control', label: 'Climate control', category: 'comfort' },
  { value: 'cruise_control', label: 'Cruise control', category: 'comfort' },
  { value: 'adaptive_cruise', label: 'Adaptieve cruise control', category: 'comfort' },
  { value: 'seat_heating', label: 'Stoelverwarming', category: 'comfort' },
  { value: 'seat_ventilation', label: 'Stoelventilatie', category: 'comfort' },
  { value: 'massage_seats', label: 'Massagestoelen', category: 'comfort' },
  { value: 'electric_seats', label: 'Elektrische stoelen', category: 'comfort' },
  { value: 'panoramic_roof', label: 'Panoramadak', category: 'comfort' },
  { value: 'sunroof', label: 'Schuifdak', category: 'comfort' },
  
  // Multimedia
  { value: 'bluetooth', label: 'Bluetooth', category: 'multimedia' },
  { value: 'usb', label: 'USB', category: 'multimedia' },
  { value: 'apple_carplay', label: 'Apple CarPlay', category: 'multimedia' },
  { value: 'android_auto', label: 'Android Auto', category: 'multimedia' },
  { value: 'navigation', label: 'Navigatie', category: 'multimedia' },
  { value: 'premium_audio', label: 'Premium audio', category: 'multimedia' },
  { value: 'head_up_display', label: 'Head-up display', category: 'multimedia' },
  { value: 'digital_cockpit', label: 'Digitaal instrumentarium', category: 'multimedia' },
  
  // Safety
  { value: 'parking_sensors', label: 'Parkeersensoren', category: 'safety' },
  { value: 'rear_camera', label: 'Achteruitrijcamera', category: 'safety' },
  { value: 'camera_360', label: '360° camera', category: 'safety' },
  { value: 'lane_assist', label: 'Rijstrookassistent', category: 'safety' },
  { value: 'blind_spot', label: 'Dodehoekassistent', category: 'safety' },
  { value: 'emergency_brake', label: 'Noodremassistent', category: 'safety' },
  { value: 'night_vision', label: 'Nachtzicht', category: 'safety' },
  
  // Exterior
  { value: 'alloy_wheels', label: 'Lichtmetalen velgen', category: 'exterior' },
  { value: 'led_headlights', label: 'LED koplampen', category: 'exterior' },
  { value: 'matrix_led', label: 'Matrix LED', category: 'exterior' },
  { value: 'tow_bar', label: 'Trekhaak', category: 'exterior' },
  { value: 'roof_rails', label: 'Dakrails', category: 'exterior' },
  { value: 'electric_tailgate', label: 'Elektrische achterklep', category: 'exterior' },
];

export const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Nieuwste eerst' },
  { value: 'price-asc', label: 'Prijs: laag naar hoog' },
  { value: 'price-desc', label: 'Prijs: hoog naar laag' },
  { value: 'mileage-asc', label: 'Km-stand: laag naar hoog' },
  { value: 'year-desc', label: 'Bouwjaar: nieuw naar oud' },
];

export const CAR_BRANDS = [
  'Audi', 'BMW', 'Citroën', 'Cupra', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 
  'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Porsche',
  'Renault', 'Seat', 'Skoda', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

// Brand -> Models mapping for dynamic filtering
export const CAR_MODELS: Record<string, string[]> = {
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q6 e-tron', 'Q7', 'Q8', 'Q8 e-tron', 'RS3', 'RS4', 'RS5', 'RS6', 'RS Q8', 'S3', 'S4', 'S5', 'TT', 'e-tron GT'],
  'BMW': ['1-serie', '2-serie', '2-serie Active Tourer', '3-serie', '4-serie', '5-serie', '7-serie', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z4', 'i4', 'i5', 'i7', 'iX', 'iX1', 'iX2', 'iX3'],
  'Citroën': ['C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Berlingo', 'ë-C3', 'ë-C4'],
  'Cupra': ['Born', 'Formentor', 'Leon', 'Tavascan', 'Terramar'],
  'Dacia': ['Sandero', 'Duster', 'Jogger', 'Spring'],
  'Fiat': ['500', '500e', '500X', 'Panda', 'Tipo', '600e'],
  'Ford': ['Fiesta', 'Focus', 'Kuga', 'Puma', 'Mustang', 'Mustang Mach-E', 'Explorer', 'Bronco', 'Tourneo Connect', 'Tourneo Courier'],
  'Honda': ['Jazz', 'Civic', 'CR-V', 'HR-V', 'ZR-V', 'e:Ny1', 'e'],
  'Hyundai': ['i10', 'i20', 'i30', 'Kona', 'Tucson', 'Santa Fe', 'IONIQ 5', 'IONIQ 6', 'BAYON', 'Staria'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'XCeed', 'Stonic', 'Sportage', 'Sorento', 'Niro', 'EV6', 'EV9', 'Soul'],
  'Mazda': ['2', '3', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-80', 'MX-5', 'MX-30'],
  'Mercedes-Benz': ['A-Klasse', 'B-Klasse', 'C-Klasse', 'E-Klasse', 'S-Klasse', 'CLA', 'CLE', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Klasse', 'EQA', 'EQB', 'EQE', 'EQE SUV', 'EQS', 'EQS SUV', 'AMG GT'],
  'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'Townstar'],
  'Opel': ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland', 'Combo Life'],
  'Peugeot': ['208', '308', '408', '508', '2008', '3008', '5008', 'e-208', 'e-308', 'e-2008', 'e-3008', 'Rifter'],
  'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman'],
  'Renault': ['Clio', 'Megane E-Tech', 'Captur', 'Arkana', 'Austral', 'Espace', 'Scenic E-Tech', 'Rafale', 'R5 E-Tech'],
  'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  'Skoda': ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Enyaq Coupé', 'Elroq'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
  'Toyota': ['Aygo X', 'Yaris', 'Yaris Cross', 'Corolla', 'Corolla Cross', 'Camry', 'C-HR', 'RAV4', 'Highlander', 'Prius', 'Supra', 'bZ4X', 'Land Cruiser', 'Proace City Verso'],
  'Volkswagen': ['Polo', 'Golf', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'Passat', 'Arteon', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Touran', 'Taigo', 'ID. Buzz'],
  'Volvo': ['V60', 'V90', 'S60', 'S90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX40', 'EX90', 'EM90'],
};

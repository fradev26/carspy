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
export type OnlineSince = '24h' | '7d' | '30d';
export type WarrantyOption = '6m' | '12m' | '24m' | '36m';

export interface SearchFilters {
  // 1. Quick Selection (Snelle selectie)
  brand?: string;
  model?: string;
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
  hasMaintenanceHistory?: boolean;
  isNonSmoker?: boolean;
  
  // 7. Options & Features (Opties & extra's)
  features?: string[];
}

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
  { value: '24h', label: 'Afgelopen 24 uur' },
  { value: '7d', label: 'Afgelopen 7 dagen' },
  { value: '30d', label: 'Afgelopen 30 dagen' },
];

export const WARRANTY_OPTIONS: { value: WarrantyOption; label: string }[] = [
  { value: '6m', label: '6 maanden' },
  { value: '12m', label: '12 maanden' },
  { value: '24m', label: '24 maanden' },
  { value: '36m', label: '36 maanden' },
];

export const COLOR_OPTIONS = [
  'Zwart', 'Wit', 'Grijs', 'Zilver', 'Blauw', 'Rood', 'Groen', 'Bruin', 'Beige', 'Geel', 'Oranje', 'Paars'
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
  'Audi', 'BMW', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 
  'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Porsche',
  'Renault', 'Seat', 'Skoda', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

// Brand -> Models mapping for dynamic filtering
export const CAR_MODELS: Record<string, string[]> = {
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'RS3', 'RS4', 'RS5', 'RS6', 'S3', 'S4', 'S5', 'TT'],
  'BMW': ['1-serie', '2-serie', '3-serie', '4-serie', '5-serie', '6-serie', '7-serie', '8-serie', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX', 'iX3'],
  'Citroën': ['C1', 'C3', 'C3 Aircross', 'C4', 'C4 Cactus', 'C5 Aircross', 'Berlingo', 'SpaceTourer'],
  'Dacia': ['Sandero', 'Duster', 'Logan', 'Jogger', 'Spring'],
  'Fiat': ['500', '500X', 'Panda', 'Tipo', 'Punto'],
  'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Puma', 'EcoSport', 'Mustang', 'Explorer', 'Mustang Mach-E'],
  'Honda': ['Jazz', 'Civic', 'Accord', 'CR-V', 'HR-V', 'e'],
  'Hyundai': ['i10', 'i20', 'i30', 'i40', 'Kona', 'Tucson', 'Santa Fe', 'IONIQ', 'IONIQ 5', 'IONIQ 6'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Sportage', 'Sorento', 'Niro', 'EV6', 'Soul'],
  'Mazda': ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'MX-5', 'MX-30'],
  'Mercedes-Benz': ['A-Klasse', 'B-Klasse', 'C-Klasse', 'E-Klasse', 'S-Klasse', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS'],
  'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya'],
  'Opel': ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland'],
  'Peugeot': ['108', '208', '308', '508', '2008', '3008', '5008', 'Partner', 'Rifter', 'e-208', 'e-2008'],
  'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman'],
  'Renault': ['Clio', 'Megane', 'Captur', 'Kadjar', 'Koleos', 'Scenic', 'Zoe', 'Arkana', 'Austral'],
  'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  'Skoda': ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'Toyota': ['Aygo', 'Yaris', 'Corolla', 'Camry', 'C-HR', 'RAV4', 'Highlander', 'Prius', 'Supra', 'bZ4X'],
  'Volkswagen': ['up!', 'Polo', 'Golf', 'ID.3', 'ID.4', 'ID.5', 'Passat', 'Arteon', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Touran'],
  'Volvo': ['V40', 'V60', 'V90', 'S60', 'S90', 'XC40', 'XC60', 'XC90', 'C40'],
};

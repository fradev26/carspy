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

export interface SearchFilters {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  fuelTypes?: FuelType[];
  transmissions?: TransmissionType[];
  bodyTypes?: BodyType[];
  location?: string;
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

export const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Nieuwste eerst' },
  { value: 'price-asc', label: 'Prijs: laag naar hoog' },
  { value: 'price-desc', label: 'Prijs: hoog naar laag' },
  { value: 'mileage-asc', label: 'Km-stand: laag naar hoog' },
  { value: 'year-desc', label: 'Bouwjaar: nieuw naar oud' },
];

export const CAR_BRANDS = [
  'Audi', 'BMW', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 
  'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault', 
  'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo'
];

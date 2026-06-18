import type {
  SearchFilters,
  FuelType,
  BodyType,
  TransmissionType,
  DriveType,
  PaintType,
  InteriorMaterial,
  OnlineSince,
  WarrantyOption,
} from '@/types/listing';

/**
 * Parse URL query params into a SearchFilters object.
 * Extracted from Search page so it can be unit-tested in isolation.
 *
 * Notes:
 * - Legacy single-value params (fuelType, bodyType) are folded into the
 *   array variants for backwards compatibility with old bookmarks.
 * - Deprecated filters that no longer have UI (paintTypes, interiorMaterials,
 *   noDamageHistory, hasMaintenanceHistory, isNonSmoker) are still parsed so
 *   legacy URLs don't crash; they become no-ops in the query layer.
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};

  const num = (key: string): number | undefined => {
    const v = searchParams.get(key);
    if (!v) return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };
  const str = (key: string): string | undefined => searchParams.get(key) || undefined;
  const arr = (key: string): string[] | undefined => {
    const v = searchParams.get(key);
    return v ? v.split(',').filter(Boolean) : undefined;
  };
  const bool = (key: string): true | undefined =>
    searchParams.get(key) === 'true' ? true : undefined;

  const brand = str('brand');
  if (brand) filters.brand = brand;
  const model = str('model');
  if (model) filters.model = model;

  const minPrice = num('minPrice');
  if (minPrice !== undefined) filters.minPrice = minPrice;
  const maxPrice = num('maxPrice');
  if (maxPrice !== undefined) filters.maxPrice = maxPrice;
  const minYear = num('minYear');
  if (minYear !== undefined) filters.minYear = minYear;
  const maxYear = num('maxYear');
  if (maxYear !== undefined) filters.maxYear = maxYear;
  const minMileage = num('minMileage');
  if (minMileage !== undefined) filters.minMileage = minMileage;
  const maxMileage = num('maxMileage');
  if (maxMileage !== undefined) filters.maxMileage = maxMileage;

  const fuelTypes = arr('fuelTypes');
  if (fuelTypes) filters.fuelTypes = fuelTypes as FuelType[];
  else {
    const legacy = str('fuelType');
    if (legacy) filters.fuelTypes = [legacy as FuelType];
  }

  const bodyTypes = arr('bodyTypes');
  if (bodyTypes) filters.bodyTypes = bodyTypes as BodyType[];
  else {
    const legacy = str('bodyType');
    if (legacy) filters.bodyTypes = [legacy as BodyType];
  }

  const transmissions = arr('transmissions');
  if (transmissions) filters.transmissions = transmissions as TransmissionType[];

  const driveTypes = arr('driveTypes');
  if (driveTypes) filters.driveTypes = driveTypes as DriveType[];

  const minPower = num('minPower');
  if (minPower !== undefined) filters.minPower = minPower;
  const maxPower = num('maxPower');
  if (maxPower !== undefined) filters.maxPower = maxPower;

  const paintTypes = arr('paintTypes');
  if (paintTypes) filters.paintTypes = paintTypes as PaintType[];
  const colors = arr('colors');
  if (colors) filters.colors = colors;
  const interiorColors = arr('interiorColors');
  if (interiorColors) filters.interiorColors = interiorColors;
  const interiorMaterials = arr('interiorMaterials');
  if (interiorMaterials) filters.interiorMaterials = interiorMaterials as InteriorMaterial[];

  const minDoors = num('minDoors');
  if (minDoors !== undefined) filters.minDoors = minDoors;
  const minSeats = num('minSeats');
  if (minSeats !== undefined) filters.minSeats = minSeats;

  const province = str('province');
  if (province) filters.province = province;
  const radius = num('radius');
  if (radius !== undefined) filters.radius = radius;
  const country = str('country');
  if (country) filters.country = country;
  const postalCode = str('postalCode');
  if (postalCode) filters.postalCode = postalCode;

  const onlineSinceRaw = str('onlineSince');
  if (onlineSinceRaw) {
    // Back-compat: legacy '24h' → 'today'
    const mapped = onlineSinceRaw === '24h' ? 'today' : onlineSinceRaw;
    filters.onlineSince = mapped as OnlineSince;
  }

  const sellerType = str('sellerType');
  if (sellerType === 'private' || sellerType === 'dealer') filters.sellerType = sellerType;

  const maxPreviousOwners = num('maxPreviousOwners');
  if (maxPreviousOwners !== undefined) filters.maxPreviousOwners = maxPreviousOwners;

  const minWarranty = str('minWarranty');
  if (minWarranty) filters.minWarranty = minWarranty as WarrantyOption;

  if (bool('noDamageHistory')) filters.noDamageHistory = true;
  if (bool('vatDeductible')) filters.vatDeductible = true;
  if (bool('hasMaintenanceHistory')) filters.hasMaintenanceHistory = true;
  if (bool('isNonSmoker')) filters.isNonSmoker = true;

  const features = arr('features');
  if (features) filters.features = features;

  return filters;
}

/**
 * Serialize a SearchFilters object into a plain string map suitable for
 * URLSearchParams. Mirrors parseFiltersFromURL so values round-trip.
 */
export function serializeFiltersToParams(filters: SearchFilters): Record<string, string> {
  const out: Record<string, string> = {};
  const setStr = (k: string, v: string | undefined | null) => {
    if (v != null && v !== '') out[k] = v;
  };
  const setNum = (k: string, v: number | undefined | null) => {
    if (v != null && Number.isFinite(v)) out[k] = String(v);
  };
  const setArr = (k: string, v: string[] | undefined) => {
    if (v && v.length) out[k] = v.join(',');
  };
  const setBool = (k: string, v: boolean | undefined) => {
    if (v) out[k] = 'true';
  };

  setStr('brand', filters.brand);
  setStr('model', filters.model);
  setNum('minPrice', filters.minPrice);
  setNum('maxPrice', filters.maxPrice);
  setNum('minYear', filters.minYear);
  setNum('maxYear', filters.maxYear);
  setNum('minMileage', filters.minMileage);
  setNum('maxMileage', filters.maxMileage);
  setArr('fuelTypes', filters.fuelTypes);
  setArr('bodyTypes', filters.bodyTypes);
  setArr('transmissions', filters.transmissions);
  setArr('driveTypes', filters.driveTypes);
  setNum('minPower', filters.minPower);
  setNum('maxPower', filters.maxPower);
  setArr('paintTypes', filters.paintTypes);
  setArr('colors', filters.colors);
  setArr('colors', filters.colors);
  setArr('interiorColors', filters.interiorColors);
  setArr('interiorMaterials', filters.interiorMaterials);
  setNum('minDoors', filters.minDoors);
  setNum('minSeats', filters.minSeats);
  setStr('province', filters.province);
  setNum('radius', filters.radius);
  setStr('country', filters.country);
  setStr('postalCode', filters.postalCode);
  setStr('onlineSince', filters.onlineSince);
  setStr('sellerType', filters.sellerType);
  setNum('maxPreviousOwners', filters.maxPreviousOwners);
  setStr('minWarranty', filters.minWarranty);
  setBool('noDamageHistory', filters.noDamageHistory);
  setBool('vatDeductible', filters.vatDeductible);
  setBool('hasMaintenanceHistory', filters.hasMaintenanceHistory);
  setBool('isNonSmoker', filters.isNonSmoker);
  setArr('features', filters.features);

  return out;
}

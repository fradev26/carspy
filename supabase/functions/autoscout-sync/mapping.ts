// Volledige AutoScout24 Listing Creation API -> VATUUR listings mapping.
// Eén pure functie die zowel door de edge function (Deno) als door de
// browser-client geïmporteerd wordt. Houd dit bestand framework-vrij
// (geen react / supabase imports).

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export type MappedListing = {
  /** Kolommen die direct in `public.listings` worden geschreven. */
  scalars: Record<string, unknown>;
  /** Genormaliseerd intern specs-object (jsonb). */
  specs: Record<string, unknown>;
  /** Onaangetaste API response, voor audit / debugging. */
  raw: Record<string, unknown>;
};

// ---------- Enum maps (AS24 -> VATUUR) ----------
export const FUEL_MAP: Record<string, string> = {
  PETROL: "benzine", GASOLINE: "benzine", BENZINE: "benzine",
  DIESEL: "diesel",
  ELECTRIC: "elektrisch", ELEKTRO: "elektrisch", EV: "elektrisch",
  HYBRID: "hybride", HYBRID_PETROL: "hybride", HYBRID_DIESEL: "hybride",
  HYBRID_PLUGIN: "plug-in hybride", PLUGIN_HYBRID: "plug-in hybride",
  LPG: "lpg", AUTOGAS: "lpg", CNG: "cng", HYDROGEN: "waterstof",
  ETHANOL: "ethanol",
};
export const TRANS_MAP: Record<string, string> = {
  MANUAL_GEAR: "handgeschakeld", MANUAL: "handgeschakeld",
  AUTOMATIC_GEAR: "automaat", AUTOMATIC: "automaat",
  SEMI_AUTOMATIC: "semi-automaat", SEMIAUTOMATIC_GEAR: "semi-automaat",
  CVT: "cvt", DSG: "dsg",
};
export const BODY_MAP: Record<string, string> = {
  SEDAN: "sedan", SALOON: "sedan",
  HATCHBACK: "hatchback", COMPACT: "hatchback", SMALL_CAR: "hatchback",
  STATION_WAGON: "stationwagon", ESTATE: "stationwagon",
  SUV: "suv", OFFROAD: "suv",
  CABRIO: "cabrio", CONVERTIBLE: "cabrio", ROADSTER: "cabrio",
  COUPE: "coupe",
  VAN: "mpv", MPV: "mpv",
  PANEL_VAN: "bestelwagen", TRANSPORTER: "bestelwagen",
  PICKUP: "pickup",
};

// ---------- Generieke helpers ----------
export function pickStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return pickStr(o.name ?? o.label ?? o.value ?? o.code ?? null);
  }
  return null;
}
export function pickNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return pickNum(o.value ?? o.amount ?? o.kw ?? o.km ?? null);
  }
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
export function pickInt(v: unknown): number | null {
  const n = pickNum(v);
  return n == null ? null : Math.round(n);
}
export function pickBool(v: unknown): boolean | null {
  if (v == null) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return pickBool(o.value ?? null);
  }
  const s = String(v).toLowerCase();
  if (["true", "yes", "y", "1", "ja"].includes(s)) return true;
  if (["false", "no", "n", "0", "nee"].includes(s)) return false;
  return null;
}
export function pickUnit(v: unknown, suffix = "Unit"): string | null {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const u = o[suffix] ?? o.unit;
    if (u) return pickStr(u);
  }
  return null;
}
export function pickDate(v: unknown): string | null {
  const s = pickStr(v);
  if (!s) return null;
  // Accept YYYY-MM-DD or ISO; return YYYY-MM-DD
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
export function pickStrArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(pickStr).filter((x): x is string => !!x);
}
export function normKey(s: string | null): string | null {
  return s ? s.toUpperCase().replace(/[\s-]/g, "_") : null;
}

// ---------- Mapping kern ----------
export function mapAs24ToListing(raw: Record<string, unknown>, dealerUserId: string): MappedListing {
  const get = <T = unknown>(k: string) => raw[k] as T | undefined;
  const obj = (k: string): Record<string, unknown> => (get<Record<string, unknown>>(k) ?? {});

  const prices = obj("prices");
  const publication = obj("publication");
  const marketing = obj("marketing");
  const condition = obj("condition");
  const availability = obj("availability");
  const consumption = obj("consumption");
  const power = obj("power");
  const warranty = obj("warranty");
  const cylinderCap = get("cylinderCapacity");
  const mileageObj = get("mileage");
  const co2 = get("co2Emissions");
  const alloyWheel = get("alloyWheelSize");
  const emptyWeight = get("emptyWeight");

  const brand = pickStr(get("make") ?? get("brand") ?? get("makeName"));
  const model = pickStr(get("model") ?? get("modelName"));
  const version = pickStr(get("modelVersion") ?? get("version") ?? get("trim"));
  const year = pickInt(get("firstRegistrationYear") ?? (get("firstRegistrationDate") as string | undefined)?.slice?.(0, 4));
  const mileage = pickInt(mileageObj ?? get("kilometers") ?? get("km"));
  const mileageUnit = pickUnit(mileageObj, "mileageUnit") ?? pickStr((mileageObj as Record<string, unknown> | undefined)?.unit) ?? "km";

  const pricePublic = pickInt(
    (prices as Record<string, unknown>).publicPrice ??
      (prices as Record<string, unknown>).consumerPriceGross ??
      get("price"),
  );
  const priceDealer = pickInt((prices as Record<string, unknown>).dealerPrice ?? (prices as Record<string, unknown>).b2bPrice);
  const priceNegotiable = pickBool((prices as Record<string, unknown>).negotiable);
  const vatDeductible = pickBool((prices as Record<string, unknown>).vatDeductible ?? get("vatDeductible"));
  const vatRate = pickNum((prices as Record<string, unknown>).vatRate ?? get("vatRate"));

  const fuelKey = normKey(pickStr(get("fuelCategory") ?? get("fuelType") ?? get("fuel")));
  const transKey = normKey(pickStr(get("gearbox") ?? get("transmission")));
  const bodyKey = normKey(pickStr(get("bodyType") ?? get("body") ?? get("category")));

  const fuel_type = (fuelKey && FUEL_MAP[fuelKey]) || (fuelKey ? fuelKey.toLowerCase() : null);
  const transmission = (transKey && TRANS_MAP[transKey]) || (transKey ? transKey.toLowerCase() : null);
  const body_type = (bodyKey && BODY_MAP[bodyKey]) || (bodyKey ? bodyKey.toLowerCase() : null);

  const additionalFuelTypes = pickStrArr(get("additionalFuelTypes")).map((s) => {
    const k = normKey(s);
    return (k && FUEL_MAP[k]) || s;
  });

  const images: string[] = (() => {
    const pickFromArr = (arr: unknown): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((i) => (typeof i === "string" ? i : ((i as Record<string, unknown> | null)?.url ?? (i as Record<string, unknown> | null)?.uri ?? null)))
        .filter((x): x is string => !!x);
    };
    const a = pickFromArr(get("images"));
    if (a.length) return a;
    return pickFromArr(get("pictures"));
  })();

  const equipment = pickStrArr(get("equipment"));
  const highlights = pickStrArr(get("highlights"));
  const includedServices = pickStrArr(get("includedServices"));
  const publicationChannels = pickStrArr((publication as Record<string, unknown>).channels);

  const title = [brand, model, version].filter(Boolean).join(" ").trim() || "Voertuig";

  const descriptionParts: string[] = [];
  const rawDescription = pickStr(get("description") ?? (marketing as Record<string, unknown>).description);
  if (rawDescription) descriptionParts.push(rawDescription);
  const vin = pickStr(get("vin") ?? get("vehicleIdentificationNumber"));
  if (vin) descriptionParts.push(`VIN: ${vin}`);

  const scalars: Record<string, unknown> = {
    user_id: dealerUserId,
    source: "autoscout",
    as24_listing_id: pickStr(get("id") ?? get("listingId") ?? get("uuid")),
    as24_publication_status: pickStr((publication as Record<string, unknown>).status ?? get("publicationStatus") ?? get("status")),

    title: title.slice(0, 140),
    brand: brand?.slice(0, 60) ?? null,
    model: model?.slice(0, 60) ?? null,
    model_version: version,
    year,
    mileage,
    mileage_unit: mileageUnit,
    price: pricePublic,
    price_public: pricePublic,
    price_dealer: priceDealer,
    price_negotiable: priceNegotiable,
    vat_deductible: vatDeductible,
    vat_rate: vatRate,

    fuel_type,
    transmission,
    body_type,
    additional_fuel_types: additionalFuelTypes.length ? additionalFuelTypes : null,
    color: pickStr(get("bodyColor") ?? get("color") ?? get("exteriorColor")),

    power: pickInt(power.kw ?? power.value ?? get("powerKw") ?? get("kw")),
    power_unit: pickStr(power.unit ?? get("powerUnit")) ?? "kW",
    cylinder_capacity: pickInt(cylinderCap),
    cylinder_capacity_unit: pickUnit(cylinderCap, "cylinderCapacityUnit") ?? pickStr((cylinderCap as Record<string, unknown> | undefined)?.unit) ?? "ccm",
    cylinder_count: pickInt(get("cylinderCount")),
    drivetrain: pickStr(get("drivetrain") ?? get("driveType")),
    gear_count: pickInt(get("gearCount") ?? get("gears")),

    co2_emissions: pickNum(co2),
    co2_emissions_unit: pickUnit(co2, "co2EmissionsUnit") ?? pickStr((co2 as Record<string, unknown> | undefined)?.unit) ?? "g/km",
    consumption_combined: pickNum((consumption as Record<string, unknown>).combined),
    consumption_city: pickNum((consumption as Record<string, unknown>).city ?? (consumption as Record<string, unknown>).urban),
    consumption_country: pickNum((consumption as Record<string, unknown>).country ?? (consumption as Record<string, unknown>).extraUrban),
    combined_unit: pickStr((consumption as Record<string, unknown>).combinedUnit ?? (consumption as Record<string, unknown>).unit) ?? "l/100km",
    emission_class: pickStr(get("emissionClass")),
    emission_sticker: pickStr(get("emissionSticker")),
    efficiency_class: pickStr(get("efficiencyClass")),
    particle_filter: pickBool(get("particleFilter")),

    first_registration_date: pickDate(get("firstRegistrationDate")),
    previous_owner_count: pickInt(get("previousOwnerCount")),
    country_version: pickStr(get("countryVersion")),

    door_count: pickInt(get("doorCount")),
    seat_count: pickInt(get("seatCount")),
    alloy_wheel_size: pickInt(alloyWheel),
    alloy_wheel_size_unit: pickUnit(alloyWheel, "alloyWheelSizeUnit") ?? pickStr((alloyWheel as Record<string, unknown> | undefined)?.unit) ?? "inch",
    empty_weight: pickInt(emptyWeight),
    empty_weight_unit: pickUnit(emptyWeight, "emptyWeightUnit") ?? pickStr((emptyWeight as Record<string, unknown> | undefined)?.unit) ?? "kg",

    vehicle_type: pickStr(get("vehicleType")),
    condition_type: pickStr((condition as Record<string, unknown>).type ?? get("conditionType")),

    vin,
    licence_plate: pickStr(get("licencePlate") ?? get("licensePlate")),
    cross_reference_id: pickStr(get("crossReferenceId")),
    offer_reference_id: pickStr(get("offerReferenceId")),

    warranty_months: pickInt(warranty.months ?? warranty.value ?? get("warrantyMonths")),
    warranty_unit: pickStr(warranty.unit ?? get("warrantyUnit")) ?? "months",
    warranty_type: pickStr(warranty.type),
    warranty_details: pickStr(warranty.details ?? warranty.description),

    inspection_date: pickDate(get("inspectionDate") ?? (condition as Record<string, unknown>).inspectionDate),
    next_inspection_date: pickDate(get("nextInspectionDate") ?? (condition as Record<string, unknown>).nextInspectionDate),

    equipment: equipment.length ? equipment : null,
    highlights: highlights.length ? highlights : null,
    included_services: includedServices.length ? includedServices : null,
    publication_channels: publicationChannels.length ? publicationChannels : null,

    service_history: get("serviceHistory") ?? null,
    leasing_offers: get("leasingOffers") ?? (prices as Record<string, unknown>).leasingOffers ?? null,
    marketing: Object.keys(marketing).length ? marketing : null,
    publication: Object.keys(publication).length ? publication : null,
    availability: Object.keys(availability).length ? availability : null,
    condition: Object.keys(condition).length ? condition : null,

    description: descriptionParts.join("\n\n") || null,
    images,
  };

  // Drop nulls om RLS-vrije upsert te houden, behoud user_id/source.
  const cleanScalars: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(scalars)) {
    if (v === undefined) continue;
    cleanScalars[k] = v;
  }

  const specs: Record<string, unknown> = {
    prices, publication, marketing, condition, availability, consumption,
    power, warranty,
    additionalFuelTypes, equipment, highlights, includedServices,
    leasingOffers: get("leasingOffers") ?? null,
    units: {
      power: cleanScalars.power_unit,
      mileage: cleanScalars.mileage_unit,
      warranty: cleanScalars.warranty_unit,
      co2: cleanScalars.co2_emissions_unit,
      cylinderCapacity: cleanScalars.cylinder_capacity_unit,
      combined: cleanScalars.combined_unit,
      alloyWheelSize: cleanScalars.alloy_wheel_size_unit,
      emptyWeight: cleanScalars.empty_weight_unit,
    },
  };

  return { scalars: cleanScalars, specs, raw };
}

// ---------- Bekende velden voor validatierapport ----------
export const KNOWN_AS24_KEYS: ReadonlyArray<string> = [
  "id", "listingId", "uuid", "vin", "vehicleIdentificationNumber",
  "licencePlate", "licensePlate", "crossReferenceId", "offerReferenceId",
  "make", "brand", "makeName", "model", "modelName", "modelVersion", "version", "trim",
  "bodyType", "body", "category", "doorCount", "seatCount", "vehicleType",
  "fuelCategory", "fuelType", "fuel", "additionalFuelTypes",
  "power", "powerKw", "powerUnit", "kw",
  "cylinderCapacity", "cylinderCount", "drivetrain", "driveType",
  "gearbox", "transmission", "gearCount", "gears",
  "co2Emissions", "consumption", "emissionClass", "emissionSticker",
  "efficiencyClass", "particleFilter",
  "firstRegistrationDate", "firstRegistrationYear", "mileage", "kilometers", "km",
  "previousOwnerCount", "countryVersion",
  "prices", "price", "vatDeductible", "vatRate",
  "warranty", "warrantyMonths", "warrantyUnit",
  "equipment", "highlights", "includedServices",
  "marketing", "publication", "publicationStatus", "status",
  "inspectionDate", "nextInspectionDate",
  "condition", "availability",
  "bodyColor", "color", "exteriorColor",
  "alloyWheelSize", "emptyWeight",
  "images", "pictures", "description",
  "serviceHistory", "leasingOffers",
];

export type MappingReport = {
  mapped: string[];
  unmapped: string[];
  totalKeys: number;
};

export function buildMappingReport(raw: Record<string, unknown>): MappingReport {
  const keys = Object.keys(raw);
  const known = new Set(KNOWN_AS24_KEYS);
  const mapped = keys.filter((k) => known.has(k));
  const unmapped = keys.filter((k) => !known.has(k));
  return { mapped, unmapped, totalKeys: keys.length };
}
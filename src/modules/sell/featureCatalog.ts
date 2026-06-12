export type FeatureCategory = 'safety' | 'comfort' | 'multimedia' | 'exterior';

export interface FeatureItem {
  value: string;
  label: string;
}

export const FEATURE_CATALOG: Record<FeatureCategory, { title: string; items: FeatureItem[] }> = {
  safety: {
    title: 'Veiligheid',
    items: [
      { value: 'abs', label: 'ABS' },
      { value: 'esp', label: 'ESP' },
      { value: 'airbags', label: 'Airbags' },
      { value: 'lane_assist', label: 'Rijstrookassistent' },
      { value: 'blind_spot', label: 'Dodehoekdetectie' },
      { value: 'adaptive_cruise', label: 'Adaptieve cruise control' },
    ],
  },
  comfort: {
    title: 'Comfort',
    items: [
      { value: 'airco', label: 'Airconditioning' },
      { value: 'climate_control', label: 'Automatische klimaatregeling' },
      { value: 'cruise_control', label: 'Cruise control' },
      { value: 'seat_heating', label: 'Zetelverwarming' },
      { value: 'electric_seats', label: 'Elektrische zetels' },
      { value: 'keyless_entry', label: 'Keyless entry' },
      { value: 'start_stop', label: 'Start/Stop-systeem' },
    ],
  },
  multimedia: {
    title: 'Multimedia',
    items: [
      { value: 'navigation', label: 'Navigatiesysteem' },
      { value: 'bluetooth', label: 'Bluetooth' },
      { value: 'apple_carplay', label: 'Apple CarPlay' },
      { value: 'android_auto', label: 'Android Auto' },
      { value: 'usb', label: 'USB-aansluiting' },
      { value: 'dab_radio', label: 'DAB-radio' },
    ],
  },
  exterior: {
    title: 'Exterieur',
    items: [
      { value: 'alloy_wheels', label: 'Lichtmetalen velgen' },
      { value: 'tow_bar', label: 'Trekhaak' },
      { value: 'panoramic_roof', label: 'Panoramisch dak' },
      { value: 'roof_rails', label: 'Dakrails' },
      { value: 'led_headlights', label: 'LED-verlichting' },
    ],
  },
};

export const VEHICLE_INFO_ITEMS: FeatureItem[] = [
  { value: 'maintenance_book', label: 'Onderhoudsboekje aanwezig' },
  { value: 'first_owner', label: 'Eerste eigenaar' },
  { value: 'non_smoker', label: 'Niet-rokerswagen' },
  { value: 'vat_deductible', label: 'BTW aftrekbaar' },
  { value: 'accident_free', label: 'Ongevalvrij' },
  { value: 'dealer_serviced', label: 'Altijd dealer onderhouden' },
  { value: 'car_pass', label: 'Car-Pass beschikbaar' },
  { value: 'inspection_certificate', label: 'Keuringsattest beschikbaar' },
  { value: 'spare_key', label: 'Reserve sleutel aanwezig' },
];

export const FEATURE_CATEGORY_ORDER: FeatureCategory[] = ['safety', 'comfort', 'multimedia', 'exterior'];

/** Build label lookup so we can render persisted values nicely on the detail page. */
const ALL_FEATURE_LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const cat of FEATURE_CATEGORY_ORDER) {
    for (const item of FEATURE_CATALOG[cat].items) map[item.value] = item.label;
  }
  for (const item of VEHICLE_INFO_ITEMS) map[item.value] = item.label;
  return map;
})();

export function labelForFeature(value: string): string {
  return ALL_FEATURE_LOOKUP[value] ?? value;
}

/** Flatten features object into the legacy text[] equipment column for compat & search. */
export function flattenFeatures(features: {
  safety?: string[];
  comfort?: string[];
  multimedia?: string[];
  exterior?: string[];
  vehicle_information?: string[];
}): string[] {
  const out: string[] = [];
  for (const cat of FEATURE_CATEGORY_ORDER) {
    (features[cat] || []).forEach((v) => out.push(labelForFeature(v)));
  }
  (features.vehicle_information || []).forEach((v) => out.push(labelForFeature(v)));
  return out;
}

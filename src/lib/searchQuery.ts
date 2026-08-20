import type { PowerUnit } from '@/types/listing';

/** 1 pk ≈ 0,7355 kW — we hanteren dezelfde factor als src/lib/units.ts (kW → pk = ×1,36). */
export function toKw(value: number, unit: PowerUnit = 'pk'): number {
  return unit === 'kW' ? value : Math.round(value / 1.36);
}

export function fromKw(value: number, unit: PowerUnit = 'pk'): number {
  return unit === 'kW' ? value : Math.round(value * 1.36);
}

/** PostgREST-waarde escapen: waarden met spaties/komma's moeten gequote worden. */
function q(value: string): string {
  return `"${value.replace(/"/g, '')}"`;
}

/**
 * Bouwt een PostgREST `or(...)`-expressie voor de multi-select merken/modellen.
 * Modellen zijn gecodeerd als "Merk:Model". Merken zonder modelselectie
 * matchen op alle modellen van dat merk.
 *
 * Retourneert null wanneer er geen merk- of modelselectie actief is.
 */
export function buildBrandModelFilter(
  brands?: string[],
  models?: string[],
): string | null {
  const brandList = (brands ?? []).filter(Boolean);
  const modelList = (models ?? []).filter((m) => m.includes(':'));
  if (brandList.length === 0 && modelList.length === 0) return null;

  const byBrand = new Map<string, string[]>();
  for (const entry of modelList) {
    const idx = entry.indexOf(':');
    const brand = entry.slice(0, idx);
    const model = entry.slice(idx + 1);
    if (!brand || !model) continue;
    byBrand.set(brand, [...(byBrand.get(brand) ?? []), model]);
  }
  for (const brand of brandList) {
    if (!byBrand.has(brand)) byBrand.set(brand, []);
  }

  const parts: string[] = [];
  for (const [brand, brandModels] of byBrand) {
    if (brandModels.length === 0) {
      parts.push(`brand.eq.${q(brand)}`);
    } else {
      parts.push(`and(brand.eq.${q(brand)},model.in.(${brandModels.map(q).join(',')}))`);
    }
  }
  return parts.join(',');
}

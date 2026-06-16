import { describe, it, expect } from 'vitest';
import { parseFiltersFromURL } from './searchFilters';

const parse = (qs: string) => parseFiltersFromURL(new URLSearchParams(qs));

describe('parseFiltersFromURL', () => {
  it('returns empty object for no params', () => {
    expect(parse('')).toEqual({});
  });

  it('parses numeric range filters', () => {
    expect(parse('minPrice=5000&maxPrice=20000&minYear=2018&maxMileage=120000'))
      .toMatchObject({ minPrice: 5000, maxPrice: 20000, minYear: 2018, maxMileage: 120000 });
  });

  it('ignores malformed numeric values', () => {
    expect(parse('minPrice=abc&maxPrice=')).toEqual({});
  });

  it('parses array filters split on comma', () => {
    expect(parse('fuelTypes=diesel,petrol&bodyTypes=suv'))
      .toMatchObject({ fuelTypes: ['diesel', 'petrol'], bodyTypes: ['suv'] });
  });

  it('falls back to legacy single-value fuelType / bodyType', () => {
    expect(parse('fuelType=diesel&bodyType=sedan'))
      .toMatchObject({ fuelTypes: ['diesel'], bodyTypes: ['sedan'] });
  });

  it('prefers array form over legacy when both present', () => {
    expect(parse('fuelType=diesel&fuelTypes=petrol,hybrid').fuelTypes)
      .toEqual(['petrol', 'hybrid']);
  });

  it('parses boolean flags only when value is "true"', () => {
    expect(parse('vatDeductible=true&noDamageHistory=false&isNonSmoker=1'))
      .toMatchObject({ vatDeductible: true });
  });

  it('whitelists sellerType to known values', () => {
    expect(parse('sellerType=private').sellerType).toBe('private');
    expect(parse('sellerType=dealer').sellerType).toBe('dealer');
    expect(parse('sellerType=spy')).toEqual({});
  });

  it('preserves features array for AND-filter semantics', () => {
    expect(parse('features=leather,navi,camera').features)
      .toEqual(['leather', 'navi', 'camera']);
  });

  it('still parses deprecated filters so old bookmarks degrade gracefully', () => {
    const f = parse('paintTypes=metallic&interiorMaterials=leather&hasMaintenanceHistory=true');
    expect(f.paintTypes).toEqual(['metallic']);
    expect(f.interiorMaterials).toEqual(['leather']);
    expect(f.hasMaintenanceHistory).toBe(true);
  });
});

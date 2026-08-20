import { describe, it, expect } from 'vitest';
import { buildBrandModelFilter, toKw, fromKw } from './searchQuery';

describe('buildBrandModelFilter', () => {
  it('returns null without brand or model selection', () => {
    expect(buildBrandModelFilter(undefined, undefined)).toBeNull();
    expect(buildBrandModelFilter([], [])).toBeNull();
  });

  it('matches all models for a brand without model selection', () => {
    expect(buildBrandModelFilter(['BMW'], [])).toBe('brand.eq."BMW"');
  });

  it('combines several brands', () => {
    expect(buildBrandModelFilter(['BMW', 'Audi'], [])).toBe('brand.eq."BMW",brand.eq."Audi"');
  });

  it('scopes models to their own brand', () => {
    expect(buildBrandModelFilter(['BMW', 'Audi'], ['BMW:X1', 'BMW:X3'])).toBe(
      'and(brand.eq."BMW",model.in.("X1","X3")),brand.eq."Audi"',
    );
  });

  it('adds the brand implicitly when only a model is selected', () => {
    expect(buildBrandModelFilter([], ['Tesla:Model 3'])).toBe(
      'and(brand.eq."Tesla",model.in.("Model 3"))',
    );
  });
});

describe('power unit conversion', () => {
  it('keeps kW values unchanged', () => {
    expect(toKw(150, 'kW')).toBe(150);
    expect(fromKw(150, 'kW')).toBe(150);
  });

  it('converts pk to kW and back', () => {
    expect(toKw(190, 'pk')).toBe(140);
    expect(fromKw(140, 'pk')).toBe(190);
  });
});

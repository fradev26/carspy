import { describe, it, expect } from 'vitest';
import { benchmarkDelta } from './useListingAnalytics';

describe('benchmarkDelta', () => {
  it('geeft null zonder bruikbare referentie', () => {
    expect(benchmarkDelta(2, null)).toBeNull();
    expect(benchmarkDelta(2, 0)).toBeNull();
  });

  it('berekent een positief verschil', () => {
    expect(benchmarkDelta(3, 2)).toBe(50);
  });

  it('berekent een negatief verschil', () => {
    expect(benchmarkDelta(1, 2)).toBe(-50);
  });

  it('rondt af op hele procenten', () => {
    expect(benchmarkDelta(1.05, 1)).toBe(5);
  });
});

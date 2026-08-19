import { describe, it, expect } from 'vitest';
import { parseEuroNorm, estimateEuroNorm, resolveEuroNorm, evaluateLez, co2Band } from './emissions';

describe('parseEuroNorm', () => {
  it('leest varianten van de emissieklasse', () => {
    expect(parseEuroNorm('Euro 6')).toBe(6);
    expect(parseEuroNorm('EURO6d-TEMP')).toBe(6);
    expect(parseEuroNorm('5')).toBe(5);
    expect(parseEuroNorm(null)).toBeNull();
    expect(parseEuroNorm('onbekend')).toBeNull();
  });
});

describe('estimateEuroNorm', () => {
  it('leidt de norm af uit de eerste inschrijving', () => {
    expect(estimateEuroNorm({ firstRegistrationDate: '2019-03-01' })).toBe(6);
    expect(estimateEuroNorm({ firstRegistrationDate: '2013-05-01' })).toBe(5);
    expect(estimateEuroNorm({ firstRegistrationDate: '2008-01-01' })).toBe(4);
    expect(estimateEuroNorm({ year: 2003 })).toBe(3);
    expect(estimateEuroNorm({})).toBeNull();
  });
});

describe('resolveEuroNorm', () => {
  it('geeft voorrang aan de opgegeven emissieklasse', () => {
    const r = resolveEuroNorm({ emissionClass: 'Euro 5', firstRegistrationDate: '2019-01-01', fuelType: 'diesel' });
    expect(r).toMatchObject({ norm: 5, origin: 'declared' });
  });
  it('markeert elektrische wagens als emissievrij', () => {
    expect(resolveEuroNorm({ fuelType: 'elektrisch' }).origin).toBe('zero-emission');
  });
  it('markeert een afgeleide norm als schatting', () => {
    expect(resolveEuroNorm({ fuelType: 'benzine', year: 2018 })).toMatchObject({ norm: 6, origin: 'estimated' });
  });
});

describe('evaluateLez', () => {
  it('laat elektrisch overal toe', () => {
    expect(evaluateLez({ fuelType: 'elektrisch' }).every((z) => z.status === 'toegelaten')).toBe(true);
  });
  it('weert diesel Euro 5 in Brussel maar laat hem voorwaardelijk toe in Antwerpen/Gent', () => {
    const res = evaluateLez({ fuelType: 'diesel', emissionClass: 'Euro 5' });
    expect(res.find((z) => z.zone === 'Brussel')?.status).toBe('niet-toegelaten');
    expect(res.find((z) => z.zone === 'Antwerpen')?.status).toBe('voorwaardelijk');
  });
  it('laat diesel Euro 6 overal toe', () => {
    expect(evaluateLez({ fuelType: 'diesel', emissionClass: 'Euro 6' }).every((z) => z.status === 'toegelaten')).toBe(true);
  });
  it('laat benzine Euro 3 toe en weert Euro 1', () => {
    expect(evaluateLez({ fuelType: 'benzine', emissionClass: 'Euro 3' })[0].status).toBe('toegelaten');
    expect(evaluateLez({ fuelType: 'benzine', emissionClass: 'Euro 1' })[0].status).toBe('niet-toegelaten');
  });
  it('geeft onbekend zonder gegevens', () => {
    expect(evaluateLez({ fuelType: 'diesel' })[0].status).toBe('onbekend');
  });
});

describe('co2Band', () => {
  it('deelt CO₂ in', () => {
    expect(co2Band(0)?.tone).toBe('good');
    expect(co2Band(110)?.tone).toBe('good');
    expect(co2Band(150)?.tone).toBe('medium');
    expect(co2Band(220)?.tone).toBe('high');
    expect(co2Band(null)).toBeNull();
  });
});

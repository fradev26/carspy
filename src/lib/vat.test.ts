import { describe, it, expect } from 'vitest';
import { normalizeVat, isValidVat, describeVatError, VAT_PATTERNS } from './vat';

describe('normalizeVat (BE)', () => {
  const cases: [string, string][] = [
    ['0123.456.789', 'BE0123456789'],
    ['0123456789', 'BE0123456789'],
    ['0123 456 789', 'BE0123456789'],
    ['0123-456-789', 'BE0123456789'],
    ['0123/456/789', 'BE0123456789'],
    ['0123_456_789', 'BE0123456789'],
    ['BE0123456789', 'BE0123456789'],
    ['BE 0123.456.789', 'BE0123456789'],
    ['be0123456789', 'BE0123456789'],
    ['  0123.456.789  ', 'BE0123456789'],
    // legacy 9-cijferige notatie krijgt een leidende nul
    ['123456789', 'BE0123456789'],
    ['123.456.789', 'BE0123456789'],
    ['BE 123 456 789', 'BE0123456789'],
    // nummers die met 1 starten (nieuwere reeks)
    ['1234.567.890', 'BE1234567890'],
    ['1234567890', 'BE1234567890'],
    ['BE 1234.567.890', 'BE1234567890'],
  ];

  it.each(cases)('normaliseert %s naar %s', (input, expected) => {
    expect(normalizeVat(input, 'BE')).toBe(expected);
  });

  it('is idempotent', () => {
    const once = normalizeVat('0123.456.789', 'BE');
    expect(normalizeVat(once, 'BE')).toBe(once);
  });
});

describe('isValidVat (BE) — geldige formaten', () => {
  const valid = [
    '0123.456.789',
    '0123456789',
    '0123 456 789',
    '0123-456-789',
    'BE0123456789',
    'BE 0123.456.789',
    'be 0123.456.789',
    '123456789',
    '123.456.789',
    '1234.567.890',
    '1234567890',
    'BE1234567890',
    '0000000097',
    '1999999999',
  ];

  it.each(valid)('accepteert %s', (input) => {
    expect(isValidVat(input, 'BE')).toBe(true);
  });
});

describe('isValidVat (BE) — ongeldige formaten', () => {
  const invalid: [string, string][] = [
    ['', 'leeg'],
    ['   ', 'alleen spaties'],
    ['12345678', '8 cijfers (te kort)'],
    ['12.345.678', '8 cijfers met punten'],
    ['12345678901', '11 cijfers (te lang)'],
    ['1234.567.8901', '11 cijfers met punten'],
    ['2123456789', 'start met 2'],
    ['9123456789', 'start met 9'],
    ['ABCDEFGHIJ', 'letters'],
    ['BE', 'alleen landcode'],
    ['NL123456789B01', 'Nederlands nummer als BE ingevuld'],
  ];

  it.each(invalid)('weigert %s (%s)', (input) => {
    expect(isValidVat(input, 'BE')).toBe(false);
  });

  it('padt 9-cijferige nummers en accepteert die daarna', () => {
    // 212345678 -> 0212345678, dat is een geldig 10-cijferig BE-formaat
    expect(normalizeVat('212345678', 'BE')).toBe('BE0212345678');
    expect(isValidVat('212345678', 'BE')).toBe(true);
  });
});

describe('isValidVat (NL)', () => {
  it('accepteert een correct NL-nummer met en zonder prefix/scheidingstekens', () => {
    expect(isValidVat('NL123456789B01', 'NL')).toBe(true);
    expect(isValidVat('123456789B01', 'NL')).toBe(true);
    expect(isValidVat('NL 1234.56789 B01', 'NL')).toBe(true);
  });

  it('weigert foutieve NL-nummers', () => {
    expect(isValidVat('NL12345678B01', 'NL')).toBe(false);
    expect(isValidVat('0123.456.789', 'NL')).toBe(false);
  });
});

describe('VAT_PATTERNS metadata', () => {
  it('bevat placeholder en hint per land', () => {
    expect(VAT_PATTERNS.BE.placeholder).toBe('0123.456.789');
    expect(VAT_PATTERNS.BE.hint).toContain('10 cijfers');
    expect(VAT_PATTERNS.NL.placeholder).toBe('NL123456789B01');
  });
});

describe('describeVatError', () => {
  it('geeft null bij geldige nummers', () => {
    expect(describeVatError('0123.456.789', 'BE')).toBeNull();
    expect(describeVatError('123456789', 'BE')).toBeNull();
    expect(describeVatError('NL123456789B01', 'NL')).toBeNull();
  });

  it('meldt een leeg veld', () => {
    expect(describeVatError('  ', 'BE')).toMatch(/Vul je ondernemingsnummer in/);
  });

  it('meldt ongeldige tekens', () => {
    expect(describeVatError('01234567AB', 'BE')).toMatch(/ongeldige tekens/);
  });

  it('meldt te weinig cijfers', () => {
    expect(describeVatError('0123456', 'BE')).toMatch(/7 cijfers in, er zijn er 10 nodig/);
  });

  it('meldt te veel cijfers', () => {
    expect(describeVatError('012345678901', 'BE')).toMatch(/2 te veel/);
  });

  it('meldt een verkeerd startcijfer', () => {
    expect(describeVatError('9123456789', 'BE')).toMatch(/start met 0 of 1, niet met 9/);
  });

  it('meldt ontbrekende B voor NL', () => {
    expect(describeVatError('NL12345678901', 'NL')).toMatch(/ontbreekt een "B"/);
  });

  it('meldt verkeerd aantal cijfers voor NL', () => {
    expect(describeVatError('NL12345678B01', 'NL')).toMatch(/er zijn er 11 nodig/);
  });
});

/**
 * Validatie en normalisatie van ondernemings-/BTW-nummers (BE, NL).
 *
 * Belgische ondernemingsnummers: 10 cijfers die starten met 0 of 1.
 * Gebruikers typen ze met punten, spaties, streepjes of zonder leidende nul
 * (legacy 9-cijferige notatie) — dat wordt allemaal genormaliseerd.
 */
export const VAT_PATTERNS = {
  BE: {
    regex: /^BE[01]\d{9}$/,
    placeholder: '0123.456.789',
    hint: 'Formaat: 10 cijfers, start met 0 of 1 (bv. BE 0123.456.789)',
  },
  NL: {
    regex: /^NL\d{9}B\d{2}$/,
    placeholder: 'NL123456789B01',
    hint: 'Formaat: NL + 9 cijfers + B + 2 cijfers',
  },
} as const;

export type VatCountry = keyof typeof VAT_PATTERNS;

export function normalizeVat(input: string, country: VatCountry): string {
  // Strip spaces, dots, dashes, slashes and any leading country prefix
  let v = input.replace(/[\s.\-/_]/g, '').toUpperCase().replace(/^(BE|NL)/, '');
  if (country === 'BE') {
    // Belgian company numbers are 10 digits; legacy 9-digit numbers get a leading 0
    v = v.replace(/\D/g, '');
    if (v.length === 9) v = '0' + v;
  }
  return country + v;
}

export function isValidVat(input: string, country: VatCountry): boolean {
  return VAT_PATTERNS[country].regex.test(normalizeVat(input, country));
}

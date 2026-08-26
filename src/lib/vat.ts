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

/**
 * Beschrijft precies wat er mis is met een ingevoerd nummer.
 * Geeft `null` terug wanneer het nummer geldig is.
 */
export function describeVatError(input: string, country: VatCountry): string | null {
  if (isValidVat(input, country)) return null;

  const raw = input.trim();
  const stripped = raw.replace(/[\s.\-/_]/g, '').toUpperCase();
  const body = stripped.replace(/^(BE|NL)/, '');

  if (!raw) {
    return country === 'BE'
      ? 'Vul je ondernemingsnummer in, bijvoorbeeld 0123.456.789.'
      : 'Vul je BTW-nummer in, bijvoorbeeld NL123456789B01.';
  }

  if (country === 'BE') {
    const digits = body.replace(/\D/g, '');
    const extra = body.replace(/[\d]/g, '');

    if (extra) {
      return `Je nummer bevat ongeldige tekens (${extra.split('').join(' ')}). Een Belgisch ondernemingsnummer bestaat enkel uit 10 cijfers, bijvoorbeeld 0123.456.789.`;
    }
    if (!digits) {
      return 'Je nummer bevat geen cijfers. Verwacht formaat: 10 cijfers, bijvoorbeeld 0123.456.789.';
    }
    if (digits.length < 9) {
      return `Je vulde ${digits.length} cijfer${digits.length === 1 ? '' : 's'} in, er zijn er 10 nodig (9 mag ook, wij vullen dan de nul aan). Bijvoorbeeld 0123.456.789.`;
    }
    if (digits.length > 10) {
      return `Je vulde ${digits.length} cijfers in, dat zijn er ${digits.length - 10} te veel. Een Belgisch ondernemingsnummer heeft 10 cijfers, bijvoorbeeld 0123.456.789.`;
    }
    // 10 cijfers maar verkeerd eerste cijfer
    return `Een Belgisch ondernemingsnummer start met 0 of 1, niet met ${digits[0]}. Bijvoorbeeld 0123.456.789.`;
  }

  // NL
  const nlDigits = body.replace(/\D/g, '');
  if (!/B/.test(body)) {
    return 'Er ontbreekt een "B" in je BTW-nummer. Verwacht formaat: NL + 9 cijfers + B + 2 cijfers, bijvoorbeeld NL123456789B01.';
  }
  if (nlDigits.length !== 11) {
    return `Je vulde ${nlDigits.length} cijfers in, er zijn er 11 nodig (9 vóór de B en 2 erna). Bijvoorbeeld NL123456789B01.`;
  }
  return 'Ongeldig Nederlands BTW-nummer. Verwacht formaat: NL + 9 cijfers + B + 2 cijfers, bijvoorbeeld NL123456789B01.';
}

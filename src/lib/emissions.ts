/**
 * Euronorm-, CO₂- en LEZ-logica (A2.2).
 *
 * Alles hier is puur en getest: de UI mag geen eigen regels bevatten.
 * De LEZ-regels zijn de Belgische toelatingsvoorwaarden zoals ze gelden in 2026
 * voor Antwerpen, Gent en Brussel. Ze veranderen periodiek, daarom tonen we
 * altijd een disclaimer bij het resultaat.
 */

export type EuroNorm = 1 | 2 | 3 | 4 | 5 | 6;

export type LezStatus = 'toegelaten' | 'voorwaardelijk' | 'niet-toegelaten' | 'onbekend';

export interface LezResult {
  zone: string;
  status: LezStatus;
  detail: string;
}

export interface EmissionInput {
  fuelType?: string | null;
  /** Waarde uit `emission_class`, bv. "Euro 6", "EURO6d", "6". */
  emissionClass?: string | null;
  /** ISO-datum van eerste inschrijving. */
  firstRegistrationDate?: string | null;
  year?: number | null;
}

const ZERO_EMISSION = ['elektrisch', 'electric', 'waterstof', 'hydrogen'];

export function isZeroEmission(fuelType?: string | null): boolean {
  if (!fuelType) return false;
  return ZERO_EMISSION.includes(fuelType.toLowerCase());
}

function isDiesel(fuelType?: string | null): boolean {
  return (fuelType ?? '').toLowerCase().includes('diesel');
}

/** Leest een Euronorm uit een vrij tekstveld ("Euro 6d-TEMP" → 6). */
export function parseEuroNorm(value?: string | null): EuroNorm | null {
  if (!value) return null;
  const match = value.match(/([1-6])/);
  if (!match) return null;
  return Number(match[1]) as EuroNorm;
}

/**
 * Schat de Euronorm op basis van de datum van eerste inschrijving.
 * Enkel gebruikt wanneer de verkoper geen emissieklasse invulde.
 */
export function estimateEuroNorm(input: EmissionInput): EuroNorm | null {
  const iso = input.firstRegistrationDate;
  const date = iso ? new Date(iso) : input.year ? new Date(input.year, 6, 1) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const t = date.getTime();
  if (t >= Date.UTC(2015, 8, 1)) return 6;
  if (t >= Date.UTC(2011, 0, 1)) return 5;
  if (t >= Date.UTC(2006, 0, 1)) return 4;
  if (t >= Date.UTC(2001, 0, 1)) return 3;
  if (t >= Date.UTC(1997, 0, 1)) return 2;
  if (t >= Date.UTC(1993, 0, 1)) return 1;
  return null;
}

export interface ResolvedEuroNorm {
  norm: EuroNorm | null;
  /** `declared` = door verkoper opgegeven, `estimated` = afgeleid uit inschrijvingsdatum. */
  origin: 'declared' | 'estimated' | 'zero-emission' | 'unknown';
  label: string;
}

export function resolveEuroNorm(input: EmissionInput): ResolvedEuroNorm {
  if (isZeroEmission(input.fuelType)) {
    return { norm: null, origin: 'zero-emission', label: 'Emissievrij' };
  }
  const declared = parseEuroNorm(input.emissionClass);
  if (declared) return { norm: declared, origin: 'declared', label: `Euro ${declared}` };
  const estimated = estimateEuroNorm(input);
  if (estimated) return { norm: estimated, origin: 'estimated', label: `Euro ${estimated} (schatting)` };
  return { norm: null, origin: 'unknown', label: 'Onbekend' };
}

/** Belgische LEZ-toelating per zone. */
export function evaluateLez(input: EmissionInput): LezResult[] {
  const zones = ['Antwerpen', 'Gent', 'Brussel'];

  if (isZeroEmission(input.fuelType)) {
    return zones.map((zone) => ({
      zone,
      status: 'toegelaten' as const,
      detail: 'Emissievrij voertuig — altijd toegelaten.',
    }));
  }

  const { norm, origin } = resolveEuroNorm(input);
  if (!norm) {
    return zones.map((zone) => ({
      zone,
      status: 'onbekend' as const,
      detail: 'Geen emissieklasse of inschrijvingsdatum bekend.',
    }));
  }

  const diesel = isDiesel(input.fuelType);
  const suffix = origin === 'estimated' ? ' (op basis van de geschatte Euronorm)' : '';

  return zones.map((zone) => {
    let status: LezStatus;
    let detail: string;

    if (diesel) {
      if (norm >= 6) {
        status = 'toegelaten';
        detail = `Diesel Euro ${norm} is toegelaten${suffix}.`;
      } else if (norm === 5 && zone !== 'Brussel') {
        status = 'voorwaardelijk';
        detail = `Diesel Euro 5 kan enkel mits registratie en betaling van een dagpas${suffix}.`;
      } else {
        status = 'niet-toegelaten';
        detail = `Diesel Euro ${norm} wordt geweerd in deze zone${suffix}.`;
      }
    } else {
      if (norm >= 3) {
        status = 'toegelaten';
        detail = `Benzine/LPG/CNG Euro ${norm} is toegelaten${suffix}.`;
      } else if (norm === 2) {
        status = 'voorwaardelijk';
        detail = `Euro 2 kan enkel mits registratie en betaling van een dagpas${suffix}.`;
      } else {
        status = 'niet-toegelaten';
        detail = `Euro ${norm} wordt geweerd in deze zone${suffix}.`;
      }
    }

    return { zone, status, detail };
  });
}

/** Grove CO₂-beoordeling voor de badge naast de waarde. */
export function co2Band(gramsPerKm?: number | null): { label: string; tone: 'good' | 'medium' | 'high' } | null {
  if (gramsPerKm == null || gramsPerKm < 0) return null;
  if (gramsPerKm === 0) return { label: 'Emissievrij', tone: 'good' };
  if (gramsPerKm <= 120) return { label: 'Laag', tone: 'good' };
  if (gramsPerKm <= 180) return { label: 'Gemiddeld', tone: 'medium' };
  return { label: 'Hoog', tone: 'high' };
}

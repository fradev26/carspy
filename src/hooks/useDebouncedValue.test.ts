import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('geeft de initiële waarde meteen terug', () => {
    const { result } = renderHook(() => useDebouncedValue({ brand: 'BMW' }, 250));
    expect(result.current.value).toEqual({ brand: 'BMW' });
    expect(result.current.pending).toBe(false);
  });

  it('houdt alleen de laatste wijziging over bij snelle opeenvolging', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 250), {
      initialProps: { v: { brand: 'BMW' } },
    });

    rerender({ v: { brand: 'Audi' } });
    rerender({ v: { brand: 'Volvo' } });
    rerender({ v: { brand: 'Kia' } });

    expect(result.current.value).toEqual({ brand: 'BMW' });
    expect(result.current.pending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.value).toEqual({ brand: 'Kia' });
    expect(result.current.pending).toBe(false);
  });

  it('negeert wijzigingen die weer terugkeren naar dezelfde waarde', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 250), {
      initialProps: { v: { brand: 'BMW' } },
    });

    rerender({ v: { brand: 'Audi' } });
    rerender({ v: { brand: 'BMW' } });

    expect(result.current.pending).toBe(false);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.value).toEqual({ brand: 'BMW' });
  });
});

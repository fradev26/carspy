import { useEffect, useRef, useState } from 'react';

/**
 * Debounce een (diep vergeleken) waarde. Zo ontstaat er pas een nieuwe
 * query-key — en dus een nieuw netwerkverzoek — wanneer de gebruiker
 * even stopt met filteren.
 *
 * `pending` is true zolang de doorgegeven waarde nog niet is doorgezet;
 * de UI kan daarmee tonen dat er nieuwe resultaten onderweg zijn.
 */
export function useDebouncedValue<T>(value: T, delay = 250): { value: T; pending: boolean } {
  const [debounced, setDebounced] = useState(value);
  const serialized = JSON.stringify(value);
  const debouncedSerialized = useRef(serialized);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    if (debouncedSerialized.current === serialized) return;
    const t = setTimeout(() => {
      debouncedSerialized.current = serialized;
      setDebounced(latest.current);
    }, delay);
    return () => clearTimeout(t);
  }, [serialized, delay]);

  return { value: debounced, pending: debouncedSerialized.current !== serialized };
}

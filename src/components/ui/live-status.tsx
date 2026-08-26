/**
 * Visueel verborgen statusregio voor schermlezers.
 *
 * - `role="status"` + `aria-live="polite"` voor laad- en resultaatupdates.
 * - `role="alert"` voor foutmeldingen (wordt direct aangekondigd).
 *
 * De regio blijft altijd in de DOM zodat schermlezers tekstwijzigingen
 * betrouwbaar oppikken.
 */
export function LiveStatus({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}

export function LiveAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="sr-only">
      {message}
    </div>
  );
}

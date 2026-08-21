import { Users } from 'lucide-react';

export function LeadEmptyState({ hasQuery }: { hasQuery?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-base font-semibold">
        {hasQuery ? 'Geen leads gevonden' : 'Nog geen leads'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasQuery
          ? 'Pas je zoekopdracht aan om andere resultaten te zien.'
          : 'Wanneer kopers je aanspreken via het contactformulier of een bericht versturen, verschijnen die hier als één overzichtelijk lijstje.'}
      </p>
    </div>
  );
}

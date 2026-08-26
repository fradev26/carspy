import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded bg-muted animate-pulse-soft", className)} />;
}

/**
 * Skeleton die de layout van de advertentiedetailpagina benadert:
 * galerij (3:2), titel, prijs, kenmerken en sticky zijpaneel.
 */
export function SkeletonListingDetail() {
  return (
    <div className="container py-6" aria-busy="true" role="status" aria-live="polite">
      <span className="sr-only">Advertentie wordt geladen</span>

      {/* Breadcrumb */}
      <div className="mb-4 flex gap-2">
        <Bar className="h-4 w-16" />
        <Bar className="h-4 w-20" />
        <Bar className="h-4 w-32" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Hoofdkolom */}
        <div className="space-y-6">
          {/* Galerij */}
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-muted">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
          </div>
          <div className="hidden gap-2 sm:flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bar key={i} className="h-16 w-24 flex-shrink-0" />
            ))}
          </div>

          {/* Titel + prijs (mobiel boven, desktop in zijpaneel) */}
          <div className="space-y-3 lg:hidden">
            <Bar className="h-7 w-3/4" />
            <Bar className="h-9 w-40" />
          </div>

          {/* Kenmerken */}
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <Bar className="mb-4 h-5 w-32" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Bar className="h-3 w-16" />
                  <Bar className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Beschrijving */}
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
            <Bar className="mb-1 h-5 w-40" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-11/12" />
            <Bar className="h-4 w-4/5" />
            <Bar className="h-4 w-2/3" />
          </div>
        </div>

        {/* Zijpaneel */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <Bar className="hidden h-7 w-3/4 lg:block" />
            <Bar className="hidden h-9 w-36 lg:block" />
            <Bar className="h-4 w-28" />
            <Bar className="h-11 w-full" />
            <Bar className="h-11 w-full" />
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Bar className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bar className="h-4 w-32" />
                <Bar className="h-3 w-24" />
              </div>
            </div>
            <Bar className="h-10 w-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}

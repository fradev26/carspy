import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { cn } from '@/lib/utils';

interface InfiniteFeedFooterProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  error?: unknown;
  onLoadMore: () => void;
  onRetry?: () => void;
  /** Skeleton layout while the next batch loads. */
  skeletonVariant?: 'default' | 'horizontal';
  skeletonCount?: number;
  /** How far ahead (px) we start prefetching the next batch. */
  prefetchMargin?: number;
  className?: string;
  endLabel?: string;
}

/**
 * Shared infinite-feed footer: IntersectionObserver prefetch sentinel,
 * skeleton loading state, explicit "Toon meer" rest point and an error state
 * with retry (never a silent fail).
 */
export function InfiniteFeedFooter({
  hasNextPage,
  isFetchingNextPage,
  error,
  onLoadMore,
  onRetry,
  skeletonVariant = 'default',
  skeletonCount = 3,
  prefetchMargin = 800,
  className,
  endLabel = 'Je hebt alle resultaten gezien',
}: InfiniteFeedFooterProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: `${prefetchMargin}px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, error, onLoadMore, prefetchMargin]);

  return (
    <div className={cn('mt-2', className)}>
      {/* Prefetch sentinel — sits just above the fold end */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-foreground">
            Laden van meer resultaten is mislukt. Controleer je verbinding.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => (onRetry ?? onLoadMore)()}>
            <RotateCcw className="h-4 w-4" /> Opnieuw proberen
          </Button>
        </div>
      ) : isFetchingNextPage ? (
        <div
          className={cn(
            skeletonVariant === 'horizontal'
              ? 'flex flex-col gap-4'
              : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6',
          )}
          aria-live="polite"
          aria-busy="true"
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={i} variant={skeletonVariant} />
          ))}
        </div>
      ) : hasNextPage ? (
        <div className="flex justify-center py-6">
          <Button variant="outline" onClick={onLoadMore} className="min-w-40">
            Toon meer
          </Button>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">{endLabel}</p>
      )}
    </div>
  );
}

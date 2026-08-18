import { useEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { Listing } from '@/types/listing';
import { ListingCard } from './ListingCard';
import { cn } from '@/lib/utils';

interface VirtualListingGridProps {
  listings: Listing[];
  variant?: 'grid' | 'list';
  className?: string;
  /** Approximate row height in px, used for the initial virtualizer estimate. */
  estimateRowHeight?: number;
}

function useColumnCount(variant: 'grid' | 'list') {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    if (variant === 'list') {
      setCols(1);
      return;
    }
    const compute = () => {
      const w = window.innerWidth;
      setCols(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [variant]);
  return cols;
}

/**
 * Window-scroll virtualized listing grid: only rows near the viewport stay in
 * the DOM, which keeps long infinite feeds smooth on mid-range phones.
 */
export function VirtualListingGrid({
  listings,
  variant = 'grid',
  className,
  estimateRowHeight,
}: VirtualListingGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const columns = useColumnCount(variant);
  const rowCount = Math.ceil(listings.length / columns);
  const estimate = estimateRowHeight ?? (variant === 'list' ? 220 : 400);

  useEffect(() => {
    const measure = () => setOffset(parentRef.current?.offsetTop ?? 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [listings.length, variant]);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimate,
    overscan: 4,
    scrollMargin: offset,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className={className}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {items.map((virtualRow) => {
          const start = virtualRow.index * columns;
          const rowListings = listings.slice(start, start + columns);
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)` }}
            >
              <div
                className={cn(
                  'pb-4 md:pb-6',
                  variant === 'list'
                    ? 'flex flex-col'
                    : cn(
                        'grid gap-4 md:gap-6',
                        columns === 3 && 'grid-cols-3',
                        columns === 2 && 'grid-cols-2',
                        columns === 1 && 'grid-cols-1',
                      ),
                )}
              >
                {rowListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    variant={variant === 'list' ? 'horizontal' : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

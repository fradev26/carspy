import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
  /** Column count per breakpoint: [mobile, sm, lg]. */
  columns?: [number, number, number];
  estimateRowHeight?: number;
  gapClassName?: string;
  className?: string;
}

/** Generic window-scroll virtualized grid, shared by the feed pages. */
export function VirtualGrid<T>({
  items,
  renderItem,
  getKey,
  columns = [1, 2, 3],
  estimateRowHeight = 360,
  gapClassName = 'gap-3',
  className,
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [cols, setCols] = useState(columns[0]);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setCols(w >= 1280 ? columns[2] : w >= 768 ? columns[1] : columns[0]);
      setOffset(parentRef.current?.offsetTop ?? 0);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [columns, items.length]);

  const rowCount = Math.ceil(items.length / cols);
  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowHeight,
    overscan: 4,
    scrollMargin: offset,
  });

  return (
    <div ref={parentRef} className={className}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const start = row.index * cols;
          const rowItems = items.slice(start, start + cols);
          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)` }}
            >
              <div
                className={cn('grid pb-3', gapClassName)}
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {rowItems.map((item, i) => (
                  <div key={getKey(item, start + i)}>{renderItem(item, start + i)}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

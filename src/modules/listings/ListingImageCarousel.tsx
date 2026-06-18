import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingImageCarouselProps {
  images: string[];
  alt: string;
  aspectClass?: string;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const SWIPE_THRESHOLD_PX = 10;
const COMMIT_RATIO = 0.22;
const COMMIT_VELOCITY = 0.4; // px/ms

export function ListingImageCarousel({
  images,
  alt,
  aspectClass = 'aspect-[16/10]',
  priority = false,
  className,
  children,
}: ListingImageCarouselProps) {
  const safeImages = images && images.length > 0 ? images : ['/placeholder.svg'];
  const total = safeImages.length;
  const hasMultiple = total > 1;

  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(() => new Set(priority ? [0] : [0]));
  const [errorSet, setErrorSet] = useState<Set<number>>(() => new Set());

  const containerRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const axisLock = useRef<'none' | 'x' | 'y'>('none');
  const lastSwipeRef = useRef(false);

  const ensureLoaded = useCallback((idxs: number[]) => {
    setLoadedSet((prev) => {
      let changed = false;
      const next = new Set(prev);
      idxs.forEach((i) => {
        if (i >= 0 && i < total && !next.has(i)) {
          next.add(i);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [total]);

  // Keep neighbors loaded around current index
  useEffect(() => {
    ensureLoaded([index, index - 1, index + 1]);
  }, [index, ensureLoaded]);

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    setIndex(clamped);
    if (clamped !== 0) setInteracted(true);
  }, [total]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = performance.now();
    axisLock.current = 'none';
    setDragDelta(0);
    setDragging(false);
    // Prefetch next/prev as soon as user touches the image
    ensureLoaded([index + 1, index - 1]);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (axisLock.current === 'none') {
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) return;
      axisLock.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axisLock.current === 'x') setDragging(true);
    }

    if (axisLock.current !== 'x') return;
    // Edge resistance
    let delta = dx;
    if ((index === 0 && delta > 0) || (index === total - 1 && delta < 0)) {
      delta = delta * 0.3;
    }
    setDragDelta(delta);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (axisLock.current !== 'x') {
      setDragging(false);
      setDragDelta(0);
      axisLock.current = 'none';
      return;
    }
    const width = containerRef.current?.clientWidth || 1;
    const dt = Math.max(1, performance.now() - startTime.current);
    const velocity = Math.abs(dragDelta) / dt;
    const ratio = Math.abs(dragDelta) / width;

    let next = index;
    if ((ratio > COMMIT_RATIO || velocity > COMMIT_VELOCITY) && Math.abs(dragDelta) > SWIPE_THRESHOLD_PX) {
      next = dragDelta < 0 ? index + 1 : index - 1;
    }
    next = Math.max(0, Math.min(total - 1, next));

    // Mark that the next click should be suppressed (it was a swipe)
    lastSwipeRef.current = true;
    window.setTimeout(() => {
      lastSwipeRef.current = false;
    }, 80);

    setDragging(false);
    setDragDelta(0);
    axisLock.current = 'none';
    if (next !== index) goTo(next);
  };

  // Suppress click after swipe
  const handleClickCapture = (e: React.MouseEvent) => {
    if (lastSwipeRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(index - 1);
    }
  };

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(index - 1);
  };
  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(index + 1);
  };

  const trackStyle: React.CSSProperties = {
    transform: `translate3d(calc(${-index * 100}% + ${dragDelta}px), 0, 0)`,
    transition: dragging ? 'none' : 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: dragging ? 'transform' : undefined,
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-muted select-none touch-pan-y', aspectClass, className)}
      role={hasMultiple ? 'region' : undefined}
      aria-roledescription={hasMultiple ? 'carousel' : undefined}
      aria-label={hasMultiple ? `Foto's van ${alt}` : undefined}
      tabIndex={hasMultiple ? 0 : -1}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onClickCapture={handleClickCapture}
    >
      {/* Track */}
      <div className="absolute inset-0 flex" style={trackStyle}>
        {safeImages.map((src, i) => {
          const loaded = loadedSet.has(i);
          const showImg = loaded && !errorSet.has(i);
          return (
            <div key={i} className="relative h-full w-full shrink-0 grow-0 basis-full bg-muted">
              {showImg ? (
                <img
                  src={src}
                  alt={i === 0 ? alt : `${alt} – foto ${i + 1}`}
                  draggable={false}
                  decoding="async"
                  loading={i === 0 && priority ? 'eager' : 'lazy'}
                  {...(i === 0 && priority ? { fetchpriority: 'high' as const } : {})}
                  onError={() =>
                    setErrorSet((prev) => {
                      const n = new Set(prev);
                      n.add(i);
                      return n;
                    })
                  }
                  className="pointer-events-none h-full w-full object-cover"
                />
              ) : errorSet.has(i) ? (
                <img
                  src="/placeholder.svg"
                  alt={alt}
                  draggable={false}
                  className="pointer-events-none h-full w-full object-cover opacity-70"
                />
              ) : (
                <div className="h-full w-full bg-muted" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Overlay children (price, favorite, badges, etc.) */}
      {children}

      {/* Photo counter */}
      {total > 0 && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {interacted && hasMultiple ? `${index + 1} / ${total}` : total}
          </span>
        </div>
      )}

      {/* Dots */}
      {hasMultiple && total <= 8 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/35 px-2 py-1 backdrop-blur-sm">
          {safeImages.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                'h-1.5 rounded-full bg-white/60 transition-all duration-200',
                i === index ? 'w-4 bg-white' : 'w-1.5',
              )}
            />
          ))}
        </div>
      )}

      {/* Desktop arrows */}
      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Vorige foto"
            onClick={goPrev}
            disabled={index === 0}
            tabIndex={-1}
            className={cn(
              'absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md backdrop-blur transition-all hover:bg-card lg:flex',
              'opacity-0 group-hover:opacity-100',
              index === 0 && 'opacity-0 pointer-events-none',
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Volgende foto"
            onClick={goNext}
            disabled={index === total - 1}
            tabIndex={-1}
            className={cn(
              'absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md backdrop-blur transition-all hover:bg-card lg:flex',
              'opacity-0 group-hover:opacity-100',
              index === total - 1 && 'opacity-0 pointer-events-none',
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Live region for screenreaders */}
      {hasMultiple && (
        <div className="sr-only" aria-live="polite">
          Foto {index + 1} van {total}
        </div>
      )}
    </div>
  );
}

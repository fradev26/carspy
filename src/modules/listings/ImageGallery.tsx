import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Expand, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);

  // Zoom state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const pinchStartRef = useRef<{ dist: number; scale: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchEndRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const validImages = images.length > 0 ? images : ['/placeholder.svg'];

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goToPrevious = useCallback(() => {
    resetZoom();
    setCurrentIndex(prev => (prev === 0 ? validImages.length - 1 : prev - 1));
  }, [validImages.length, resetZoom]);

  const goToNext = useCallback(() => {
    resetZoom();
    setCurrentIndex(prev => (prev === validImages.length - 1 ? 0 : prev + 1));
  }, [validImages.length, resetZoom]);

  const handleImageError = (i: number) => setImageErrors(prev => new Set([...prev, i]));
  const handleImageLoad = (i: number) => setLoadedImages(prev => new Set([...prev, i]));
  const getImageUrl = (i: number) => (imageErrors.has(i) ? '/placeholder.svg' : validImages[i]);

  // Show hint briefly on lightbox open
  useEffect(() => {
    if (isLightboxOpen) {
      resetZoom();
      setShowHint(true);
      const t = setTimeout(() => setShowHint(false), 2200);
      return () => clearTimeout(t);
    }
  }, [isLightboxOpen, resetZoom]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLightboxOpen, goToPrevious, goToNext]);

  // Wheel zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isLightboxOpen) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta * s)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isLightboxOpen]);

  // Reset offset when scale returns to 1
  useEffect(() => {
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  }, [scale]);

  const distance = (a: React.Touch, b: React.Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStartRef.current = { dist: distance(e.touches[0], e.touches[1]), scale };
      return;
    }
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    touchEndRef.current = { x: t.clientX, y: t.clientY };
    if (scale > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
    }
    // Double tap detect
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      setScale(s => (s > 1 ? 1 : 2));
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      const d = distance(e.touches[0], e.touches[1]);
      const next = pinchStartRef.current.scale * (d / pinchStartRef.current.dist);
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)));
      return;
    }
    const t = e.touches[0];
    touchEndRef.current = { x: t.clientX, y: t.clientY };
    if (scale > 1 && dragStartRef.current) {
      setOffset({
        x: dragStartRef.current.ox + (t.clientX - dragStartRef.current.x),
        y: dragStartRef.current.oy + (t.clientY - dragStartRef.current.y),
      });
    }
  };

  const handleTouchEnd = () => {
    pinchStartRef.current = null;
    setIsDragging(false);
    dragStartRef.current = null;
    if (scale > 1 || validImages.length <= 1) return;
    const dx = touchEndRef.current.x - touchStartRef.current.x;
    const dy = touchEndRef.current.y - touchStartRef.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goToNext();
      else goToPrevious();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    setOffset({
      x: dragStartRef.current.ox + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.oy + (e.clientY - dragStartRef.current.y),
    });
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleDoubleClick = () => {
    setScale(s => (s > 1 ? 1 : 2));
  };

  return (
    <>
      <div className="space-y-3">
        {/* Main Image */}
        <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-xl bg-black/90 shadow-card">
          {!loadedImages.has(currentIndex) && (
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
          )}

          <img
            src={getImageUrl(currentIndex)}
            alt={`${alt} - Afbeelding ${currentIndex + 1}`}
            className={cn(
              'h-full w-full object-contain md:object-cover cursor-zoom-in transition-opacity duration-300',
              loadedImages.has(currentIndex) ? 'opacity-100' : 'opacity-0',
            )}
            onClick={() => setIsLightboxOpen(true)}
            onError={() => handleImageError(currentIndex)}
            onLoad={() => handleImageLoad(currentIndex)}
          />

          {validImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-md bg-card/90 backdrop-blur-sm hover:bg-card shadow-elevated"
                onClick={goToPrevious}
                aria-label="Vorige foto"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-md bg-card/90 backdrop-blur-sm hover:bg-card shadow-elevated"
                onClick={goToNext}
                aria-label="Volgende foto"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-10 w-10 rounded-md bg-card/90 backdrop-blur-sm hover:bg-card shadow-md"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Foto vergroten"
          >
            <Expand className="h-4 w-4" />
          </Button>

          {validImages.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-md bg-card/90 px-3 py-1.5 text-sm font-medium backdrop-blur-sm shadow-md">
              {currentIndex + 1} / {validImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {validImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200',
                  currentIndex === index
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'opacity-60 hover:opacity-100',
                )}
                aria-label={`Ga naar foto ${index + 1}`}
              >
                <img
                  src={getImageUrl(index)}
                  alt={`${alt} - Thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={() => handleImageError(index)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:hidden">
          <div
            ref={containerRef}
            className={cn(
              'relative flex items-center justify-center h-[90vh] touch-none select-none overflow-hidden',
              scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
            )}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={getImageUrl(currentIndex)}
              alt={`${alt} - Afbeelding ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain pointer-events-none will-change-transform"
              draggable={false}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: isDragging || pinchStartRef.current ? 'none' : 'transform 200ms ease-out',
              }}
              onError={() => handleImageError(currentIndex)}
            />

            {/* Zoom hint */}
            {showHint && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs text-white pointer-events-none">
                <ZoomIn className="h-3.5 w-3.5" />
                Dubbeltik of scroll om te zoomen
              </div>
            )}

            {/* Zoom level badge */}
            {scale > 1 && (
              <button
                type="button"
                onClick={resetZoom}
                className="absolute top-4 left-4 rounded-md bg-white/10 backdrop-blur-sm px-2.5 py-1 text-xs text-white hover:bg-white/20"
              >
                {Math.round(scale * 100)}% · reset
              </button>
            )}

            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-md bg-white/10 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                  aria-label="Vorige foto"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-md bg-white/10 text-white hover:bg-white/20"
                  onClick={goToNext}
                  aria-label="Volgende foto"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {validImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-white/10 px-5 py-2.5 text-base font-medium text-white backdrop-blur-sm">
                {currentIndex + 1} / {validImages.length}
              </div>
            )}

            <DialogClose className="absolute right-4 top-4 h-12 w-12 rounded-md bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/40" aria-label="Sluiten">
              <X className="h-6 w-6" />
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

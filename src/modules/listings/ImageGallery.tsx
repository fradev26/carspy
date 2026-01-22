import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const validImages = images.length > 0 ? images : ['/placeholder.svg'];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set([...prev, index]));
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set([...prev, index]));
  };

  const getImageUrl = (index: number) => {
    return imageErrors.has(index) ? '/placeholder.svg' : validImages[index];
  };

  return (
    <>
      <div className="space-y-3">
        {/* Main Image */}
        <div className="relative aspect-[16/10] md:aspect-[16/9] overflow-hidden rounded-xl bg-muted shadow-card">
          {/* Loading shimmer */}
          {!loadedImages.has(currentIndex) && (
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
          )}
          
          <img
            src={getImageUrl(currentIndex)}
            alt={`${alt} - Afbeelding ${currentIndex + 1}`}
            className={cn(
              "h-full w-full object-cover cursor-zoom-in transition-opacity duration-300",
              loadedImages.has(currentIndex) ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setIsLightboxOpen(true)}
            onError={() => handleImageError(currentIndex)}
            onLoad={() => handleImageLoad(currentIndex)}
          />
          
          {/* Navigation Arrows */}
          {validImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card shadow-elevated"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card shadow-elevated"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Expand button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-10 w-10 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card shadow-md"
            onClick={() => setIsLightboxOpen(true)}
          >
            <Expand className="h-4 w-4" />
          </Button>

          {/* Image counter */}
          {validImages.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-full bg-card/90 px-3 py-1.5 text-sm font-medium backdrop-blur-sm shadow-md">
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
                    : 'opacity-60 hover:opacity-100'
                )}
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center h-[90vh]">
            <img
              src={getImageUrl(currentIndex)}
              alt={`${alt} - Afbeelding ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              onError={() => handleImageError(currentIndex)}
            />

            {/* Navigation in lightbox */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image counter in lightbox */}
            {validImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-5 py-2.5 text-base font-medium text-white backdrop-blur-sm">
                {currentIndex + 1} / {validImages.length}
              </div>
            )}

            <DialogClose className="absolute right-4 top-4 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="h-6 w-6" />
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

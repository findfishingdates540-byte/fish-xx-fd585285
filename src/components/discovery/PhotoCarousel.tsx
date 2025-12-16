import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoCarouselProps {
  photos: string[];
  name: string;
}

export function PhotoCarousel({ photos, name }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const validPhotos = photos?.filter(Boolean) || [];
  
  if (validPhotos.length === 0) {
    return (
      <div className="absolute inset-0 bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-lg">No photos</span>
      </div>
    );
  }

  const goTo = (index: number) => {
    if (index >= 0 && index < validPhotos.length) {
      setCurrentIndex(index);
    }
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo((currentIndex + 1) % validPhotos.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo((currentIndex - 1 + validPhotos.length) % validPhotos.length);
  };

  return (
    <div className="absolute inset-0">
      {/* Photo */}
      <img
        src={validPhotos[currentIndex]}
        alt={`${name} photo ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Tap zones for navigation */}
      {validPhotos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            aria-label="Previous photo"
          />
          <button
            onClick={goNext}
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            aria-label="Next photo"
          />
        </>
      )}

      {/* Progress indicators */}
      {validPhotos.length > 1 && (
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
          {validPhotos.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              )}
            />
          ))}
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
    </div>
  );
}

import { useState } from 'react';
import { MapPin, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface ProfileData {
  id: string;
  name: string;
  age: number;
  location: string;
  distance: string;
  bio: string;
  photos: string[];
  tags: { icon?: string; label: string }[];
  fishingType?: string;
}

interface ProfileCardProps {
  profile: ProfileData;
  onInfoClick?: () => void;
}

export function ProfileCard({ profile, onInfoClick }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = () => {
    if (currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  return (
    <div className="bg-background rounded-3xl shadow-medium overflow-hidden max-w-sm w-full mx-auto">
      {/* Photo Section */}
      <div className="relative aspect-[3/4] bg-muted">
        <img
          src={profile.photos[currentPhotoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover"
        />

        {/* Photo Navigation Dots */}
        {profile.photos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1">
            {profile.photos.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1 rounded-full transition-all',
                  idx === currentPhotoIndex
                    ? 'w-6 bg-background'
                    : 'w-1 bg-background/50'
                )}
              />
            ))}
          </div>
        )}

        {/* Photo Navigation Arrows */}
        {profile.photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/30 transition-colors"
              disabled={currentPhotoIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/30 transition-colors"
              disabled={currentPhotoIndex === profile.photos.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Fishing Type Badge */}
        {profile.fishingType && (
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-background text-foreground font-medium">
              🎣 {profile.fishingType}
            </Badge>
          </div>
        )}

        {/* Info Button */}
        <button
          onClick={onInfoClick}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/30 transition-colors"
        >
          <Info className="h-4 w-4" />
        </button>

        {/* Name & Location Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-6 pt-20">
          <h2 className="text-2xl font-bold text-background">
            {profile.name}, {profile.age}
          </h2>
          <div className="flex items-center gap-1 text-background/90 text-sm mt-1">
            <MapPin className="h-4 w-4" />
            <span>{profile.location}</span>
            <span className="mx-1">•</span>
            <span>{profile.distance}</span>
          </div>
        </div>
      </div>

      {/* Bio & Tags Section */}
      <div className="p-5">
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {profile.bio}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {profile.tags.map((tag, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="px-3 py-1.5 font-medium text-sm rounded-full"
            >
              {tag.icon && <span className="mr-1">{tag.icon}</span>}
              {tag.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

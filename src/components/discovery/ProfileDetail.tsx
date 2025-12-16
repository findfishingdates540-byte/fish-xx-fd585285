import { useState } from 'react';
import { MapPin, Briefcase, Fish, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProfileDetailProps {
  profile: Tables<'profiles'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLike?: () => void;
  onPass?: () => void;
}

export function ProfileDetail({ profile, open, onOpenChange, onLike, onPass }: ProfileDetailProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!profile) return null;

  const photos = profile.photos || [];
  
  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.date_of_birth);

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const formatExperience = (exp: string | null) => {
    if (!exp) return null;
    return exp.replace('_', ' ').charAt(0).toUpperCase() + exp.replace('_', ' ').slice(1);
  };

  const formatLookingFor = (items: string[] | null) => {
    if (!items || items.length === 0) return null;
    return items.map(item => item.replace('_', ' ')).join(', ');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] bg-background">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Profile Details</DrawerTitle>
        </DrawerHeader>
        
        <div className="overflow-y-auto">
          {/* Photo Section */}
          <div className="relative aspect-[3/4] max-h-[60vh] bg-muted">
            {photos.length > 0 ? (
              <>
                <img
                  src={photos[currentPhotoIndex]}
                  alt={`${profile.display_name}'s photo`}
                  className="w-full h-full object-cover"
                />
                
                {/* Photo indicators */}
                {photos.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-4">
                    {photos.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          index === currentPhotoIndex ? 'bg-foreground' : 'bg-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Navigation buttons */}
                {photos.length > 1 && (
                  <>
                    {currentPhotoIndex > 0 && (
                      <button
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/50 backdrop-blur-sm"
                      >
                        <ChevronLeft className="h-6 w-6 text-foreground" />
                      </button>
                    )}
                    {currentPhotoIndex < photos.length - 1 && (
                      <button
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/50 backdrop-blur-sm"
                      >
                        <ChevronRight className="h-6 w-6 text-foreground" />
                      </button>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🎣</span>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="p-4 space-y-4">
            {/* Name and Age */}
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-foreground">
                {profile.display_name || 'Anonymous'}
              </h2>
              {age && <span className="text-xl text-muted-foreground">{age}</span>}
            </div>

            {/* Location */}
            {profile.location_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.location_name}</span>
              </div>
            )}

            {/* Looking For */}
            {profile.looking_for && profile.looking_for.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>Looking for {formatLookingFor(profile.looking_for)}</span>
              </div>
            )}

            {/* Fishing Experience */}
            {profile.fishing_experience && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Fish className="h-4 w-4" />
                <span>{formatExperience(profile.fishing_experience)} angler</span>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="pt-2 border-t border-border">
                <h3 className="font-semibold text-foreground mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Preferred Species */}
            {profile.preferred_species && profile.preferred_species.length > 0 && (
              <div className="pt-2 border-t border-border">
                <h3 className="font-semibold text-foreground mb-2">Favorite Fish</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_species.map((species, index) => (
                    <Badge key={index} variant="secondary">
                      {species}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Fishing Gear */}
            {profile.fishing_gear && profile.fishing_gear.length > 0 && (
              <div className="pt-2 border-t border-border">
                <h3 className="font-semibold text-foreground mb-2">Gear</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.fishing_gear.map((gear, index) => (
                    <Badge key={index} variant="outline">
                      {gear}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {(onPass || onLike) && (
              <div className="flex gap-4 pt-4 pb-6">
                {onPass && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-14 text-lg"
                    onClick={() => {
                      onPass();
                      onOpenChange(false);
                    }}
                  >
                    Pass
                  </Button>
                )}
                {onLike && (
                  <Button
                    size="lg"
                    className="flex-1 h-14 text-lg"
                    onClick={() => {
                      onLike();
                      onOpenChange(false);
                    }}
                  >
                    Like
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

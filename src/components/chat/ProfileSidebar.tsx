import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Heart, Briefcase, Fish, Camera, Music, Coffee, Dumbbell, Book, Plane, Gamepad2, Utensils, Palette, TreesIcon as Trees, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { Lightbox } from '@/components/ui/lightbox';

interface ProfileSidebarProps {
  userId?: string;
  name: string;
  age: number;
  photo: string;
  isOnline?: boolean;
  location?: string;
  bio?: string;
  interests?: string[];
  photos?: string[];
  className?: string;
  favoriteSpot?: { name: string; location?: string };
  recentCatches?: { photo: string; species?: string }[];
  chatType?: 'date' | 'buddy';
  idVerified?: boolean;
  liveVerified?: boolean;
}

// Map interests to icons
const interestIcons: Record<string, React.ReactNode> = {
  'Photography': <Camera className="h-4 w-4" />,
  'Music': <Music className="h-4 w-4" />,
  'Coffee': <Coffee className="h-4 w-4" />,
  'Fitness': <Dumbbell className="h-4 w-4" />,
  'Reading': <Book className="h-4 w-4" />,
  'Travel': <Plane className="h-4 w-4" />,
  'Gaming': <Gamepad2 className="h-4 w-4" />,
  'Cooking': <Utensils className="h-4 w-4" />,
  'Art': <Palette className="h-4 w-4" />,
  'Hiking': <Trees className="h-4 w-4" />,
  'Fishing': <Fish className="h-4 w-4" />,
  'Sports': <Flag className="h-4 w-4" />,
};

const getInterestIcon = (interest: string) => {
  return interestIcons[interest] || <Heart className="h-4 w-4" />;
};

// Format interest string: replace underscores with spaces and capitalize each word
const formatInterest = (interest: string) => {
  return interest
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function ProfileSidebar({
  userId,
  name,
  age,
  photo,
  isOnline,
  location,
  bio,
  interests = [],
  photos = [],
  className,
  favoriteSpot,
  recentCatches = [],
  chatType = 'date',
  idVerified,
  liveVerified,
}: ProfileSidebarProps) {
  const navigate = useNavigate();
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine main photo with additional photos for lightbox
  const allPhotos = photo ? [photo, ...photos.filter(p => p !== photo)] : photos;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  return (
    <aside className={cn("flex flex-col bg-background overflow-y-auto", className)}>
      {/* Hero Photo Section */}
      <div 
        className="relative h-48 w-full overflow-hidden cursor-pointer"
        onClick={() => openLightbox(0)}
      >
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />
        
        {/* Name overlay at bottom */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-1">
              {name}
              <VerificationBadge 
                idVerified={idVerified} 
                liveVerified={liveVerified} 
                size="sm" 
              />
            </h3>
            {chatType === 'date' ? (
              <span className="text-lg">💕</span>
            ) : (
              <span className="text-lg">🎣</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge className="bg-green-500 text-white text-xs">ONLINE</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">OFFLINE</Badge>
            )}
            <span className="text-muted-foreground text-sm">• {age} yrs</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col items-center p-3 rounded-xl border border-border">
            <MapPin className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground text-center truncate w-full">{location || 'Unknown'}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl border border-border">
            <Briefcase className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">{chatType === 'date' ? 'Dating' : 'Buddy'}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl border border-border">
            <Heart className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Matched</span>
          </div>
        </div>

        {/* About */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            About
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {bio || 'No bio yet.'}
          </p>
        </div>

        {/* Interests with Icons */}
        {interests.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Interests
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {interests.slice(0, 6).map((interest) => (
                <div
                  key={interest}
                  className="flex items-center gap-2 p-2 rounded-lg bg-accent/50"
                >
                  <div className="text-primary">
                    {getInterestIcon(interest)}
                  </div>
                  <span className="text-xs text-foreground truncate">{formatInterest(interest)}</span>
                </div>
              ))}
            </div>
            {interests.length > 6 && (
              <p className="text-xs text-muted-foreground mt-2">+{interests.length - 6} more</p>
            )}
          </div>
        )}

        {/* Favorite Spot */}
        {favoriteSpot && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Favorite Spot
            </h4>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="h-20 bg-muted flex items-center justify-center">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">{favoriteSpot.name}</p>
                {favoriteSpot.location && (
                  <p className="text-xs text-muted-foreground">{favoriteSpot.location}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Catches */}
        {recentCatches.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Recent Catches
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {recentCatches.slice(0, 3).map((catchItem, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden bg-accent relative group"
                >
                  <img
                    src={catchItem.photo}
                    alt={catchItem.species || 'Catch'}
                    className="w-full h-full object-cover"
                  />
                  {catchItem.species && (
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-background font-medium text-center px-1">
                        {catchItem.species}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Photos
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {photos.slice(0, 3).map((photoUrl, index) => (
                <button
                  key={index}
                  onClick={() => openLightbox(allPhotos.indexOf(photoUrl) !== -1 ? allPhotos.indexOf(photoUrl) : index + 1)}
                  className="aspect-square rounded-xl overflow-hidden bg-accent hover:ring-2 hover:ring-primary transition-all"
                >
                  <img
                    src={photoUrl}
                    alt={`${name}'s photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {photos.length > 3 && (
                <button
                  onClick={() => openLightbox(4)}
                  className="aspect-square rounded-xl bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">
                    +{photos.length - 3} more
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full border-border"
            onClick={() => userId && navigate(`/app/u/${userId}`)}
            disabled={!userId}
          >
            View Full Profile
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Block
            </Button>
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              Report
            </Button>
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      <Lightbox
        images={allPhotos}
        initialIndex={lightboxIndex}
        open={showLightbox}
        onOpenChange={setShowLightbox}
      />
    </aside>
  );
}
import { useState } from 'react';
import { MapPin, Info, Check, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { VerificationBadge } from '@/components/ui/verification-badge';

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
  idVerified?: boolean;
  liveVerified?: boolean;
  likedYou?: boolean;
  occupation?: string;
}

interface ProfileCardProps {
  profile: ProfileData;
  onInfoClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  showInfoPanel?: boolean;
}

export function ProfileCard({ profile, onInfoClick, onSwipeLeft, onSwipeRight, className, showInfoPanel = false }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Color overlays for swipe feedback
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

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

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swiped right - Like
      onSwipeRight?.();
    } else if (info.offset.x < -threshold) {
      // Swiped left - Pass
      onSwipeLeft?.();
    }
    
    // Reset dragging state after a small delay to prevent click triggering
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleCardClick = () => {
    if (!isDragging) {
      onInfoClick?.();
    }
  };

  const isMobile = useIsMobile();

  return (
    <motion.div 
      style={{ x, rotate, opacity }}
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      whileTap={{ cursor: 'grabbing' }}
      data-tutorial="profile-card"
      className={cn(
        "bg-background rounded-2xl shadow-medium overflow-hidden cursor-grab relative",
        isMobile ? "touch-none h-full w-full flex flex-col" : "touch-pan-y flex",
        showInfoPanel && !isMobile ? "max-w-3xl" : "max-w-md",
        className
      )}
    >
      {/* Swipe Indicators - Corner positioned stamps */}
      <motion.div 
        style={{ opacity: likeOpacity }} 
        className="absolute top-8 right-6 z-20 pointer-events-none"
      >
        <div className="bg-green-500/90 text-white px-4 py-2 rounded-lg font-bold text-lg rotate-[12deg] border-[3px] border-white shadow-lg uppercase tracking-wider">
          Like
        </div>
      </motion.div>
      <motion.div 
        style={{ opacity: passOpacity }} 
        className="absolute top-8 left-6 z-20 pointer-events-none"
      >
        <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg font-bold text-lg rotate-[-12deg] border-[3px] border-white shadow-lg uppercase tracking-wider">
          Nope
        </div>
      </motion.div>

      {/* Photo Section */}
      <div className={cn(
        "relative bg-muted overflow-hidden",
        isMobile ? "flex-1 min-h-0" : showInfoPanel ? "flex-[3] aspect-[3/4]" : "aspect-[3/4] w-full"
      )}>
        <img
          src={profile.photos[currentPhotoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover absolute inset-0"
        />

        {/* Photo Navigation Segment Bars - Stories style */}
        {profile.photos.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
            {profile.photos.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  idx === currentPhotoIndex
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                    : 'bg-white/40'
                )}
              />
            ))}
          </div>
        )}

        {/* Photo Navigation Touch Areas */}
        {profile.photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
              disabled={currentPhotoIndex === 0}
              aria-label="Previous photo"
            />
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
              disabled={currentPhotoIndex === profile.photos.length - 1}
              aria-label="Next photo"
            />
          </>
        )}

        {/* Top Badges */}
        <div className="absolute top-10 left-4 flex flex-col gap-2 z-10">
          {/* Liked You Badge */}
          {profile.likedYou && (
            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold border-0 shadow-lg animate-pulse">
              💕 Liked You
            </Badge>
          )}
          {/* Fishing Type Badge */}
          {profile.fishingType && (
            <Badge variant="secondary" className="bg-white/90 text-foreground font-medium backdrop-blur-sm">
              🎣 {profile.fishingType}
            </Badge>
          )}
        </div>

        {/* Info Button - Desktop only, when info panel is NOT shown */}
        {!isMobile && !showInfoPanel && (
          <button
            onClick={(e) => { e.stopPropagation(); onInfoClick?.(); }}
            className="absolute top-10 right-4 h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
            aria-label="View profile details"
          >
            <Info className="h-5 w-5" />
          </button>
        )}

        {/* Name & Location Overlay - Only shown when info panel is hidden */}
        {!showInfoPanel && (
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent",
              isMobile ? "p-4 pt-16" : "p-5 pt-20"
            )}
          >
            <h2 className={cn("font-bold text-white flex items-center gap-2", isMobile ? "text-xl" : "text-2xl")}>
              {profile.name}, {profile.age}
              <VerificationBadge 
                idVerified={profile.idVerified} 
                liveVerified={profile.liveVerified} 
                size="md" 
              />
            </h2>
            {profile.occupation && (
              <p className="text-white/90 text-sm mt-0.5 font-medium">
                {profile.occupation}
              </p>
            )}
            <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
              <MapPin className="h-4 w-4" />
              <span>{profile.location}</span>
              <span className="mx-1">•</span>
              <span>{profile.distance}</span>
            </div>
          </div>
        )}
      </div>

      {/* Integrated Info Panel - Desktop only when showInfoPanel is true */}
      {showInfoPanel && !isMobile && (
        <div className="flex-[2] bg-amber-50/80 dark:bg-amber-950/20 border-l border-amber-200/50 dark:border-amber-800/30 flex flex-col min-w-[260px] max-w-[320px]">
          <div className="flex-1 p-6 flex flex-col">
            {/* Name & Age */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                {profile.name}, {profile.age}
                <VerificationBadge
                  idVerified={profile.idVerified}
                  liveVerified={profile.liveVerified}
                  size="lg"
                />
              </h2>
            </div>

            {/* Photo Verified Badge */}
            {(profile.idVerified || profile.liveVerified) && (
              <Badge
                variant="outline"
                className="w-fit mb-4 bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Photo verified
              </Badge>
            )}

            {/* Occupation */}
            {profile.occupation && (
              <div className="flex items-start gap-3 mb-4">
                <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{profile.occupation}</p>
              </div>
            )}

            {/* Location */}
            <div className="flex items-start gap-3 mb-6">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                {profile.location}
                {profile.distance && (
                  <span className="text-muted-foreground"> • {profile.distance}</span>
                )}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Tags/Interests */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-background/80 text-foreground"
                  >
                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                    {tag.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Fishing Type */}
            {profile.fishingType && (
              <div className="mt-4">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  🎣 {profile.fishingType}
                </Badge>
              </div>
            )}
          </div>

          {/* Bottom dots indicator (decorative) */}
          <div className="p-6 pt-0 flex justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-foreground/20" />
            <span className="h-2 w-2 rounded-full bg-foreground/20" />
            <span className="h-2 w-2 rounded-full bg-foreground/20" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

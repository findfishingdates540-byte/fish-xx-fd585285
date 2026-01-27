import { useState } from 'react';
import { Flag, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface BumbleProfileCardProps {
  profile: ProfileData;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onExpandClick?: () => void;
  showExpandButton?: boolean;
  className?: string;
}

export function BumbleProfileCard({ 
  profile, 
  onSwipeLeft, 
  onSwipeRight, 
  onExpandClick,
  showExpandButton = true,
  className 
}: BumbleProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Color overlays for swipe feedback - Corner positioned stamps
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const isMobile = useIsMobile();

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      onSwipeRight?.();
    } else if (info.offset.x < -threshold) {
      onSwipeLeft?.();
    }
    
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleCardClick = () => {
    if (!isDragging) {
      onExpandClick?.();
    }
  };

  return (
    <motion.div 
      style={{ x, rotate, opacity, willChange: 'transform' }}
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      dragTransition={{ bounceStiffness: 650, bounceDamping: 38 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      whileTap={{ cursor: 'grabbing' }}
      data-tutorial="profile-card"
      className={cn(
        "bg-transparent overflow-hidden cursor-grab relative transform-gpu",
        isMobile ? "touch-none h-full w-full" : "touch-pan-y aspect-[3/4] w-full max-w-md",
        className
      )}
    >
      {/* Swipe Indicators - Corner positioned stamps */}
      <motion.div 
        style={{ opacity: likeOpacity }} 
        className="absolute top-8 right-8 z-20 pointer-events-none"
      >
        <div className="bg-foreground text-background px-5 py-2 rounded-lg font-bold text-xl rotate-[15deg] border-4 border-foreground shadow-lg">
          LIKE
        </div>
      </motion.div>
      <motion.div 
        style={{ opacity: passOpacity }} 
        className="absolute top-8 left-8 z-20 pointer-events-none"
      >
        <div className="bg-destructive text-destructive-foreground px-5 py-2 rounded-lg font-bold text-xl rotate-[-15deg] border-4 border-destructive shadow-lg">
          NOPE
        </div>
      </motion.div>

      {/* Photo Section - Full card */}
      <div className="relative w-full h-full">
        <img
          src={profile.photos[currentPhotoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover"
        />

        {/* Photo Navigation Segments (Instagram-style bars) */}
        {profile.photos.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
            {profile.photos.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all',
                  idx === currentPhotoIndex
                    ? 'bg-background'
                    : 'bg-background/40'
                )}
              />
            ))}
          </div>
        )}

        {/* Photo Navigation - Tap zones */}
        {profile.photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
              aria-label="Previous photo"
            />
            <button
              onClick={nextPhoto}
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
              aria-label="Next photo"
            />
          </>
        )}

        {/* Expand Button - Top right */}
        {showExpandButton && (
          <button
            onClick={(e) => { e.stopPropagation(); onExpandClick?.(); }}
            className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/30 transition-colors z-10"
            aria-label="Expand profile"
          >
            <Expand className="h-4 w-4" />
          </button>
        )}

        {/* Top Badges */}
        <div className="absolute top-14 left-4 flex flex-col gap-2 z-10">
          {profile.likedYou && (
            <Badge className="bg-foreground text-background font-semibold border-0 shadow-lg animate-pulse">
              💕 Liked You
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

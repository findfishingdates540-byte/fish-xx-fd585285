import { useState, useCallback } from 'react';
import { MapPin, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { VerificationBadge } from '@/components/ui/verification-badge';
import confetti from 'canvas-confetti';

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
  onSuperLike?: () => void;
  className?: string;
}

export function ProfileCard({ profile, onInfoClick, onSwipeLeft, onSwipeRight, onSuperLike, className }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Color overlays for swipe feedback
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const triggerSuperLikeConfetti = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#1a1a1a', '#333333', '#666666', '#999999', '#ffffff'],
    };

    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star'],
    });
  }, []);

  const handleSuperLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerSuperLikeConfetti();
    onSuperLike?.();
  }, [onSuperLike, triggerSuperLikeConfetti]);

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
        "bg-background rounded-3xl shadow-medium overflow-hidden max-w-[calc(100vw-1.5rem)] sm:max-w-sm w-full mx-auto cursor-grab relative flex flex-col",
        isMobile ? "touch-none h-full" : "touch-pan-y",
        className
      )}
    >
      {/* Swipe Indicators */}
      <motion.div 
        style={{ opacity: likeOpacity }} 
        className="absolute inset-0 bg-green-500/20 rounded-3xl pointer-events-none z-10 flex items-center justify-center"
      >
        <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-xl rotate-[-15deg] border-4 border-green-500">
          LIKE
        </div>
      </motion.div>
      <motion.div 
        style={{ opacity: passOpacity }} 
        className="absolute inset-0 bg-red-500/20 rounded-3xl pointer-events-none z-10 flex items-center justify-center"
      >
        <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl rotate-[15deg] border-4 border-red-500">
          NOPE
        </div>
      </motion.div>

      {/* Photo Section - 50% on mobile */}
      <div className={cn(
        "relative bg-muted overflow-hidden",
        isMobile ? "h-1/2 flex-shrink-0" : "aspect-[3/4]"
      )}>
        <img
          src={profile.photos[currentPhotoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover absolute inset-0"
        />

        {/* Photo Navigation Dots - Tappable on mobile */}
        {profile.photos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
            {profile.photos.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCurrentPhotoIndex(idx); 
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  isMobile ? 'min-w-[24px] flex-1' : 'w-auto',
                  idx === currentPhotoIndex
                    ? 'bg-background'
                    : 'bg-background/40'
                )}
                aria-label={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Photo Navigation Arrows */}
        {profile.photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/30 transition-colors"
              disabled={currentPhotoIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/30 transition-colors"
              disabled={currentPhotoIndex === profile.photos.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Liked You Badge */}
          {profile.likedYou && (
            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold border-0 shadow-lg animate-pulse">
              💕 Liked You
            </Badge>
          )}
          {/* Fishing Type Badge */}
          {profile.fishingType && (
            <Badge variant="secondary" className="bg-background text-foreground font-medium">
              🎣 {profile.fishingType}
            </Badge>
          )}
        </div>

        {/* Info Button - Desktop only */}
        {!isMobile && (
          <button
            onClick={(e) => { e.stopPropagation(); onInfoClick?.(); }}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/30 transition-colors"
            aria-label="View profile details"
          >
            <Info className="h-4 w-4" />
          </button>
        )}

        {/* SuperLike FAB - Mobile only */}
        {isMobile && onSuperLike && (
          <motion.button
            onClick={handleSuperLike}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute bottom-20 right-4 h-12 w-12 rounded-xl bg-foreground shadow-lg flex items-center justify-center z-20"
            aria-label="Super Like"
          >
            <Star className="h-6 w-6 text-background" strokeWidth={1.5} />
          </motion.button>
        )}

        {/* Name & Location Overlay */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent",
            isMobile ? "p-4 pt-16" : "p-4 pt-16"
          )}
        >
          <h2 className={cn("font-bold text-background flex items-center gap-1", isMobile ? "text-2xl" : "text-xl")}>
            {profile.name}, {profile.age}
            <VerificationBadge 
              idVerified={profile.idVerified} 
              liveVerified={profile.liveVerified} 
              size="sm" 
            />
          </h2>
          {profile.occupation && (
            <p className="text-background/90 text-sm mt-0.5">{profile.occupation}</p>
          )}
          <div className="flex items-center gap-1 text-background/90 text-sm mt-1">
            <MapPin className="h-4 w-4" />
            <span>{profile.location}</span>
            <span className="mx-1">•</span>
            <span>{profile.distance}</span>
          </div>
        </div>
      </div>

      {/* Bio & Tags Section - Scrollable on mobile */}
      <div className={cn(
        "flex-1 overflow-y-auto",
        isMobile ? "p-4" : "p-5"
      )}>
        <p className={cn(
          "text-muted-foreground leading-relaxed",
          isMobile ? "text-base font-medium line-clamp-3" : "text-sm line-clamp-2"
        )}>
          {profile.bio}
        </p>

        <div className={cn("flex flex-wrap gap-2", isMobile ? "mt-3" : "mt-4")}>
          {profile.tags.slice(0, isMobile ? 8 : profile.tags.length).map((tag, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className={cn(
                "font-semibold rounded-full",
                isMobile ? "px-3 py-1.5 text-sm" : "px-3 py-1.5 text-sm"
              )}
            >
              {tag.icon && <span className="mr-1">{tag.icon}</span>}
              {tag.label}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

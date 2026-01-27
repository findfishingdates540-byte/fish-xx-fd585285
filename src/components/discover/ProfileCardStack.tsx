import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Ruler, Wine, Cigarette, Star, Brain, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { BumbleProfileCard, ProfileData } from './BumbleProfileCard';

interface ProfilePrompt {
  question: string;
  answer?: string;
}

interface ProfileCardStackProps {
  profile: {
    name: string;
    age?: number;
    bio?: string;
    occupation?: string;
    idVerified?: boolean;
    liveVerified?: boolean;
    interests?: string[];
    heightCm?: number;
    smoker?: string;
    drinker?: string;
    zodiacSign?: string;
    personalityType?: string;
    promptResponses?: ProfilePrompt[];
  };
  // Profile card data for the photo (Card 1)
  profileCardData?: ProfileData;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onExpandClick?: () => void;
  onMoreClick?: () => void;
  onCardChange?: (currentIndex: number, totalCards: number) => void;
  profileId?: string;
  className?: string;
}

type CardType = 'basics' | 'interests' | 'lifestyle' | 'prompts';

interface CardConfig {
  type: CardType;
  hasContent: boolean;
}

export function ProfileCardStack({ 
  profile, 
  profileCardData,
  onSwipeLeft,
  onSwipeRight,
  onExpandClick,
  onMoreClick, 
  onCardChange, 
  profileId,
  className 
}: ProfileCardStackProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef(false);

  // Reset to first card when profile changes
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [profileId]);

  // Build cards array based on available content
  const buildCards = useCallback((): CardConfig[] => {
    const cards: CardConfig[] = [
      { type: 'basics', hasContent: true }, // Always show basics
    ];

    if (profile.interests && profile.interests.length > 0) {
      cards.push({ type: 'interests', hasContent: true });
    }

    const hasLifestyle = profile.heightCm || profile.drinker || profile.smoker || 
                         profile.zodiacSign || profile.personalityType;
    if (hasLifestyle) {
      cards.push({ type: 'lifestyle', hasContent: true });
    }

    const hasPrompts = profile.promptResponses && 
                       profile.promptResponses.some(p => p.answer);
    if (hasPrompts) {
      cards.push({ type: 'prompts', hasContent: true });
    }

    return cards;
  }, [profile]);

  const cards = buildCards();
  const totalCards = cards.length;

  // Clamp currentCardIndex if cards shrink
  useEffect(() => {
    if (currentCardIndex >= totalCards) {
      setCurrentCardIndex(Math.max(0, totalCards - 1));
    }
  }, [totalCards, currentCardIndex]);

  // Handle wheel scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isScrolling.current) return;
    
    const threshold = 30;
    
    if (e.deltaY > threshold && currentCardIndex < totalCards - 1) {
      isScrolling.current = true;
      setDirection(1);
      setCurrentCardIndex(prev => prev + 1);
      setTimeout(() => { isScrolling.current = false; }, 300);
    } else if (e.deltaY < -threshold && currentCardIndex > 0) {
      isScrolling.current = true;
      setDirection(-1);
      setCurrentCardIndex(prev => prev - 1);
      setTimeout(() => { isScrolling.current = false; }, 300);
    }
  }, [currentCardIndex, totalCards]);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isScrolling.current) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    const threshold = 50;

    if (deltaY > threshold && currentCardIndex < totalCards - 1) {
      isScrolling.current = true;
      setDirection(1);
      setCurrentCardIndex(prev => prev + 1);
      setTimeout(() => { isScrolling.current = false; }, 300);
    } else if (deltaY < -threshold && currentCardIndex > 0) {
      isScrolling.current = true;
      setDirection(-1);
      setCurrentCardIndex(prev => prev - 1);
      setTimeout(() => { isScrolling.current = false; }, 300);
    }
  }, [currentCardIndex, totalCards]);

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchEnd]);

  // Notify parent of card changes
  useEffect(() => {
    onCardChange?.(currentCardIndex, totalCards);
  }, [currentCardIndex, totalCards, onCardChange]);

  const formatHeight = (cm?: number) => {
    if (!cm) return null;
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    return `${feet}'${inches}"`;
  };

  const currentCard = cards[currentCardIndex];
  const isVerified = profile.idVerified || profile.liveVerified;

  // Card 1: Basics with Photo (split layout on desktop, overlay on tablet)
  const renderBasicsCard = () => (
    <div className="flex flex-col lg:flex-row h-full w-full">
      {/* Photo Section with name overlay on tablet - Left on desktop, top on tablet */}
      {profileCardData && (
        <div className="relative w-full lg:w-1/2 h-[60%] lg:h-full flex-shrink-0">
          <BumbleProfileCard
            profile={profileCardData}
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            onExpandClick={onExpandClick}
            showExpandButton={false}
            className="h-full w-full rounded-none max-w-none aspect-auto"
          />
          
          {/* Name/Occupation overlay on tablet only */}
          <div className="absolute bottom-0 left-0 right-0 lg:hidden bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 py-5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-3xl font-extrabold text-white">
                {profile.name}{profile.age ? `, ${profile.age}` : ''}
              </h2>
              <VerificationBadge idVerified={profile.idVerified} liveVerified={profile.liveVerified} size="md" />
              {isVerified && (
                <span className="text-sm text-white/90 font-semibold leading-tight">
                  Photo<br />verified
                </span>
              )}
            </div>
            {profile.occupation && (
              <p className="text-base font-medium text-white/90 mt-1.5">
                {profile.occupation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Basics Content - Right on desktop, bottom on tablet */}
      <div className={cn(
        "flex flex-col justify-start lg:justify-center bg-muted px-5 py-4 lg:px-6 lg:py-8 overflow-y-auto",
        profileCardData ? "w-full lg:w-1/2 h-[40%] lg:h-full" : "w-full h-full"
      )}>
        <div className="flex-1 flex flex-col justify-start lg:justify-center">
          {/* Name, Age, Verification - Desktop only */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap mb-3">
            <h2 className="text-3xl font-bold text-foreground">
              {profile.name}{profile.age ? `, ${profile.age}` : ''}
            </h2>
            <VerificationBadge idVerified={profile.idVerified} liveVerified={profile.liveVerified} size="md" />
            {isVerified && (
              <span className="text-xs text-foreground font-medium leading-tight">
                Photo<br />verified
              </span>
            )}
          </div>

          {/* Occupation - Desktop only */}
          {profile.occupation && (
            <p className="hidden lg:block text-sm text-muted-foreground mb-3">
              {profile.occupation}
            </p>
          )}

          {/* Bio */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile.bio || 'No bio yet'}
          </p>

          {/* More Info Button */}
          <button
            onClick={onMoreClick}
            className="mt-3 lg:mt-4 p-2 w-fit rounded-full hover:bg-accent transition-colors"
            aria-label="View more details"
          >
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );

  // Card 2: Interests (full-width, centered)
  const renderInterestsCard = () => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-muted px-8 py-12">
      <div className="space-y-6 text-center">
        <h3 className="text-2xl font-semibold text-foreground">Interests</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {profile.interests?.map((interest, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="px-4 py-2 text-base font-medium bg-background/80 text-foreground"
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      <button
        onClick={onMoreClick}
        className="mt-8 p-2 rounded-full hover:bg-accent transition-colors"
        aria-label="View more details"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
  );

  // Card 3: Lifestyle (full-width, centered)
  const renderLifestyleCard = () => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-muted px-8 py-12">
      <div className="space-y-6 text-center">
        <h3 className="text-2xl font-semibold text-foreground">Lifestyle</h3>
        <div className="space-y-4 flex flex-col items-center">
          {profile.heightCm && (
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
                <Ruler className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-base text-foreground">{formatHeight(profile.heightCm)}</span>
            </div>
          )}
          {profile.drinker && (
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
                <Wine className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-base text-foreground capitalize">
                {profile.drinker === 'never' ? 'Non-drinker' : `Drinks ${profile.drinker}`}
              </span>
            </div>
          )}
          {profile.smoker && (
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
                <Cigarette className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-base text-foreground capitalize">
                {profile.smoker === 'never' ? 'Non-smoker' : `Smokes ${profile.smoker}`}
              </span>
            </div>
          )}
          {profile.zodiacSign && (
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
                <Star className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-base text-foreground">{profile.zodiacSign}</span>
            </div>
          )}
          {profile.personalityType && (
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
                <Brain className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-base text-foreground capitalize">{profile.personalityType}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onMoreClick}
        className="mt-8 p-2 rounded-full hover:bg-accent transition-colors"
        aria-label="View more details"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
  );

  // Card 4: Prompts (full-width, centered)
  const renderPromptsCard = () => {
    const prompts = profile.promptResponses?.filter(p => p.answer) || [];
    
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-muted px-8 py-12">
        <div className="space-y-6 text-center">
          <h3 className="text-2xl font-semibold text-foreground">Prompts</h3>
          <div className="space-y-4 flex flex-col items-center">
            {prompts.slice(0, 3).map((prompt, idx) => (
              <div key={idx} className="flex items-start gap-4 text-left max-w-md">
                <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{prompt.question}</p>
                  <p className="text-base text-muted-foreground mt-1">{prompt.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onMoreClick}
          className="mt-8 p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="View more details"
        >
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    );
  };

  const renderCardContent = (type: CardType) => {
    switch (type) {
      case 'basics':
        return renderBasicsCard();
      case 'interests':
        return renderInterestsCard();
      case 'lifestyle':
        return renderLifestyleCard();
      case 'prompts':
        return renderPromptsCard();
      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden",
        className
      )}
    >
      {/* Animated Card Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentCardIndex}
          initial={{ opacity: 0, y: direction > 0 ? 20 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: direction > 0 ? -20 : 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="h-full w-full"
        >
          {renderCardContent(currentCard.type)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Ruler, Wine, Cigarette, Star, Brain, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from '@/components/ui/verification-badge';

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
  onMoreClick?: () => void;
  onCardChange?: (currentIndex: number, totalCards: number) => void;
  className?: string;
}

type CardType = 'basics' | 'interests' | 'lifestyle' | 'prompts';

interface CardConfig {
  type: CardType;
  hasContent: boolean;
}

export function ProfileCardStack({ profile, onMoreClick, onCardChange, className }: ProfileCardStackProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef(false);

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

  // Card content renderers
  const renderBasicsCard = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1" />
      
      <div className="space-y-3">
        {/* Name, Age, Verification */}
        <div className="flex items-center gap-2 flex-wrap">
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

        {/* Occupation */}
        {profile.occupation && (
          <p className="text-sm text-muted-foreground">
            {profile.occupation}
          </p>
        )}

        {/* Bio */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {profile.bio || 'No bio yet'}
        </p>
      </div>

      {/* More Info Button */}
      <button
        onClick={onMoreClick}
        className="mt-4 p-2 w-fit rounded-full hover:bg-accent transition-colors"
        aria-label="View more details"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1 min-h-[60px]" />
    </div>
  );

  const renderInterestsCard = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1" />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Interests</h3>
        <div className="flex flex-wrap gap-2">
          {profile.interests?.map((interest, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="px-3 py-1.5 font-medium bg-background/80 text-foreground"
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      <button
        onClick={onMoreClick}
        className="mt-4 p-2 w-fit rounded-full hover:bg-accent transition-colors"
        aria-label="View more details"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1 min-h-[60px]" />
    </div>
  );

  const renderLifestyleCard = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1" />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Lifestyle</h3>
        <div className="space-y-3">
          {profile.heightCm && (
            <div className="flex items-center gap-3">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{formatHeight(profile.heightCm)}</span>
            </div>
          )}
          {profile.drinker && (
            <div className="flex items-center gap-3">
              <Wine className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">
                {profile.drinker === 'never' ? 'Non-drinker' : `Drinks ${profile.drinker}`}
              </span>
            </div>
          )}
          {profile.smoker && (
            <div className="flex items-center gap-3">
              <Cigarette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">
                {profile.smoker === 'never' ? 'Non-smoker' : `Smokes ${profile.smoker}`}
              </span>
            </div>
          )}
          {profile.zodiacSign && (
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{profile.zodiacSign}</span>
            </div>
          )}
          {profile.personalityType && (
            <div className="flex items-center gap-3">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">{profile.personalityType}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onMoreClick}
        className="mt-4 p-2 w-fit rounded-full hover:bg-accent transition-colors"
        aria-label="View more details"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1 min-h-[60px]" />
    </div>
  );

  const renderPromptsCard = () => {
    const prompts = profile.promptResponses?.filter(p => p.answer) || [];
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1" />
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Prompts</h3>
          <div className="space-y-3">
            {prompts.slice(0, 2).map((prompt, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-background/80 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-xs text-foreground">{prompt.question}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{prompt.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onMoreClick}
          className="mt-4 p-2 w-fit rounded-full hover:bg-accent transition-colors"
          aria-label="View more details"
        >
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1 min-h-[60px]" />
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
        "relative flex flex-col justify-center pl-6 pr-8 py-12 bg-muted overflow-hidden",
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
          className="h-full"
        >
          {renderCardContent(currentCard.type)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

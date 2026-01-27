import { useState, useRef, useCallback, useMemo } from 'react';
import { MoreHorizontal, Ruler, Wine, Cigarette, Star, Brain, GraduationCap, Briefcase } from 'lucide-react';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProfilePrompt } from '@/components/profile';

// Matches ProfileDetailData from ProfileDetailView but defined inline to avoid circular deps
interface ProfileDetailData {
  id: string;
  name: string;
  age?: number;
  location?: string;
  distance?: string;
  bio?: string;
  photos?: string[];
  idVerified?: boolean;
  liveVerified?: boolean;
  isActive?: boolean;
  height?: string;
  heightCm?: number;
  smoker?: string;
  drinker?: string;
  education?: string;
  occupation?: string;
  zodiacSign?: string;
  personalityType?: string;
  targetSpecies?: string;
  bestCatch?: string;
  ride?: string;
  interests?: string[];
  promptResponses?: ProfilePrompt[];
}

interface ProfileInfoPanelProps {
  profile: ProfileDetailData;
  onMoreClick?: () => void;
  className?: string;
}

// Individual card component for each section
function ProfileCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn(
      "snap-start min-h-full flex flex-col justify-center px-6 py-8",
      className
    )}>
      {children}
    </div>
  );
}

// Scroll indicator dots on the right side
function ScrollIndicator({ 
  totalCards, 
  activeCard 
}: { 
  totalCards: number; 
  activeCard: number;
}) {
  if (totalCards <= 1) return null;
  
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
      {Array.from({ length: totalCards }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-200",
            index === activeCard 
              ? "bg-foreground scale-125" 
              : "bg-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}

// Format height from cm to feet/inches
function formatHeight(cm?: number): string | null {
  if (!cm) return null;
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm % 30.48) / 2.54);
  return `${feet}'${inches}"`;
}

// Format lifestyle values for display
function formatLifestyleValue(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function ProfileInfoPanel({
  profile,
  onMoreClick,
  className,
}: ProfileInfoPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);

  // Determine which cards to show based on available data
  const hasInterests = profile.interests && profile.interests.length > 0;
  const hasLifestyle = profile.heightCm || profile.drinker || profile.smoker || 
                       profile.zodiacSign || profile.personalityType ||
                       profile.education || profile.occupation;
  const hasPrompts = profile.promptResponses && profile.promptResponses.length > 0;

  // Build array of card types that will be rendered
  const cardTypes = useMemo(() => {
    const types: string[] = ['basics'];
    if (hasInterests) types.push('interests');
    if (hasLifestyle) types.push('lifestyle');
    if (hasPrompts) types.push('prompts');
    return types;
  }, [hasInterests, hasLifestyle, hasPrompts]);

  const totalCards = cardTypes.length;

  // Handle scroll to detect active card
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollTop = container.scrollTop;
    const cardHeight = container.clientHeight;
    const newActiveCard = Math.round(scrollTop / cardHeight);
    setActiveCard(Math.min(newActiveCard, totalCards - 1));
  }, [totalCards]);

  const isVerified = profile.idVerified || profile.liveVerified;

  return (
    <div className={cn("relative bg-muted", className)}>
      {/* Scroll Indicator */}
      <ScrollIndicator totalCards={totalCards} activeCard={activeCard} />

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      >
        {/* Card 1 - Profile Basics (Always shown) */}
        <ProfileCard>
          <div className="space-y-3">
            {/* Name, Age, and Verification */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-3xl font-bold text-foreground">
                {profile.name}{profile.age ? `, ${profile.age}` : ''}
              </h2>
              <VerificationBadge 
                idVerified={profile.idVerified} 
                liveVerified={profile.liveVerified} 
                size="md" 
              />
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
            {profile.bio && (
              <p className="text-sm text-foreground leading-relaxed mt-4">
                {profile.bio}
              </p>
            )}

            {/* More Info Button */}
            <button
              onClick={onMoreClick}
              className="mt-4 p-2 w-fit rounded-full hover:bg-accent transition-colors"
              aria-label="View more details"
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </ProfileCard>

        {/* Card 2 - Interests (Conditional) */}
        {hasInterests && (
          <ProfileCard>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests!.map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="bg-background text-foreground border border-border px-3 py-1.5 text-sm"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </ProfileCard>
        )}

        {/* Card 3 - Lifestyle / The Basics (Conditional) */}
        {hasLifestyle && (
          <ProfileCard>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">The Basics</h3>
              <div className="space-y-3">
                {profile.heightCm && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Ruler className="h-5 w-5 text-muted-foreground" />
                    <span>{formatHeight(profile.heightCm)}</span>
                  </div>
                )}
                {profile.occupation && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <span>{profile.occupation}</span>
                  </div>
                )}
                {profile.education && (
                  <div className="flex items-center gap-3 text-foreground">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <span>{profile.education}</span>
                  </div>
                )}
                {profile.drinker && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Wine className="h-5 w-5 text-muted-foreground" />
                    <span>{formatLifestyleValue(profile.drinker)}</span>
                  </div>
                )}
                {profile.smoker && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Cigarette className="h-5 w-5 text-muted-foreground" />
                    <span>{formatLifestyleValue(profile.smoker)}</span>
                  </div>
                )}
                {profile.zodiacSign && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Star className="h-5 w-5 text-muted-foreground" />
                    <span>{formatLifestyleValue(profile.zodiacSign)}</span>
                  </div>
                )}
                {profile.personalityType && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <span>{profile.personalityType}</span>
                  </div>
                )}
              </div>
            </div>
          </ProfileCard>
        )}

        {/* Card 4 - Prompts (Conditional) */}
        {hasPrompts && (
          <ProfileCard>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Get to Know Me</h3>
              <div className="space-y-4">
                {profile.promptResponses!.slice(0, 2).map((prompt, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {prompt.question}
                    </p>
                    <p className="text-foreground font-medium">
                      {prompt.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ProfileCard>
        )}
      </div>
    </div>
  );
}

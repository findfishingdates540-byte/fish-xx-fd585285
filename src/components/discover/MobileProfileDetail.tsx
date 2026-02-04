import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { MapPin, Ruler, Wine, Cigarette, Star, Brain, MessageCircle, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePrompt {
  question: string;
  answer?: string;
}

interface MobileProfileDetailProps {
  open: boolean;
  onClose: () => void;
  profile: {
    name: string;
    age?: number;
    location?: string;
    distance?: string;
    bio?: string;
    occupation?: string;
    idVerified?: boolean;
    liveVerified?: boolean;
    photos?: string[];
    interests?: string[];
    heightCm?: number;
    smoker?: string;
    drinker?: string;
    zodiacSign?: string;
    personalityType?: string;
    promptResponses?: ProfilePrompt[];
    tags?: { icon?: string; label: string }[];
  };
}

export function MobileProfileDetail({ open, onClose, profile }: MobileProfileDetailProps) {
  const formatHeight = (cm?: number) => {
    if (!cm) return null;
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    return `${feet}'${inches}"`;
  };

  const hasLifestyle = profile.heightCm || profile.drinker || profile.smoker || 
                       profile.zodiacSign || profile.personalityType;
  const hasPrompts = profile.promptResponses && 
                     profile.promptResponses.some(p => p.answer);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl p-0 overflow-hidden"
      >
        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto overscroll-contain scrollbar-hide">
          {/* Header with Photo */}
          {profile.photos?.[0] && (
            <div className="relative aspect-[4/5] w-full">
              <img 
                src={profile.photos[0]} 
                alt={profile.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/60 to-transparent p-4 pt-20">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile.name}{profile.age ? `, ${profile.age}` : ''}
                  </h2>
                  <VerificationBadge 
                    idVerified={profile.idVerified} 
                    liveVerified={profile.liveVerified} 
                    size="md" 
                  />
                </div>
                
                {profile.occupation && (
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm">{profile.occupation}</span>
                  </div>
                )}
                
                {(profile.location || profile.distance) && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                    {profile.distance && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{profile.distance}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Sections */}
          <div className="px-4 pb-8 space-y-6">
            {/* Bio Section */}
            {profile.bio && (
              <section className="pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  About
                </h3>
                <p className="text-foreground leading-relaxed">
                  {profile.bio}
                </p>
              </section>
            )}

            {/* Interests Section */}
            {profile.interests && profile.interests.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="px-3 py-1.5 text-sm font-medium"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Fishing Tags Section */}
            {profile.tags && profile.tags.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Fishing
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="px-3 py-1.5 text-sm font-medium"
                    >
                      {tag.icon && <span className="mr-1">{tag.icon}</span>}
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Lifestyle Section */}
            {hasLifestyle && (
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Lifestyle
                </h3>
                <div className="space-y-3">
                  {profile.heightCm && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Ruler className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="text-foreground">{formatHeight(profile.heightCm)}</span>
                    </div>
                  )}
                  {profile.drinker && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Wine className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="text-foreground capitalize">
                        {profile.drinker === 'never' ? 'Non-drinker' : `Drinks ${profile.drinker}`}
                      </span>
                    </div>
                  )}
                  {profile.smoker && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Cigarette className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="text-foreground capitalize">
                        {profile.smoker === 'never' ? 'Non-smoker' : `Smokes ${profile.smoker}`}
                      </span>
                    </div>
                  )}
                  {profile.zodiacSign && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Star className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="text-foreground">{profile.zodiacSign}</span>
                    </div>
                  )}
                  {profile.personalityType && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Brain className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="text-foreground capitalize">{profile.personalityType}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Prompts Section */}
            {hasPrompts && (
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Prompts
                </h3>
                <div className="space-y-4">
                  {profile.promptResponses?.filter(p => p.answer).map((prompt, idx) => (
                    <div key={idx} className="bg-muted rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{prompt.question}</p>
                          <p className="text-muted-foreground mt-1">{prompt.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

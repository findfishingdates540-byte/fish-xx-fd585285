import { Check, Briefcase, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from '@/components/ui/verification-badge';
import type { ProfileData } from './ProfileCard';

interface ProfileInfoPanelProps {
  profile: ProfileData | null;
}

export function ProfileInfoPanel({ profile }: ProfileInfoPanelProps) {
  if (!profile) {
    return (
      <div className="hidden lg:flex flex-col flex-[2] min-w-[280px] max-w-[360px] h-full bg-amber-50/80 dark:bg-amber-950/20 p-6 justify-center items-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Swipe to see profile details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col flex-[2] min-w-[280px] max-w-[360px] h-full bg-amber-50/80 dark:bg-amber-950/20 border-l border-amber-200/50 dark:border-amber-800/30">
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
  );
}

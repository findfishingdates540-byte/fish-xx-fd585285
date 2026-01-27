import { MapPin, Briefcase, MoreHorizontal } from 'lucide-react';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProfileInfoPanelProps {
  name: string;
  age: number;
  occupation?: string;
  location?: string;
  distance?: string;
  idVerified?: boolean;
  liveVerified?: boolean;
  bio?: string;
  fishingType?: string;
  tags?: { icon?: string; label: string }[];
  onMoreClick?: () => void;
  className?: string;
}

export function ProfileInfoPanel({
  name,
  age,
  occupation,
  location,
  distance,
  idVerified,
  liveVerified,
  bio,
  fishingType,
  tags = [],
  onMoreClick,
  className,
}: ProfileInfoPanelProps) {
  return (
    <div 
      className={cn(
        "flex flex-col justify-center p-6 bg-amber-50 dark:bg-amber-950/30 rounded-r-3xl h-full min-h-[400px]",
        className
      )}
    >
      {/* Name, Age, and Verification */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-3xl font-bold text-foreground">
            {name}, {age}
          </h2>
          <VerificationBadge idVerified={idVerified} liveVerified={liveVerified} size="md" />
          {(idVerified || liveVerified) && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Photo verified
            </span>
          )}
        </div>
      </div>

      {/* Occupation */}
      {occupation && (
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Briefcase className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{occupation}</span>
        </div>
      )}

      {/* Location */}
      {(location || distance) && (
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            {location}
            {distance && ` • ${distance}`}
          </span>
        </div>
      )}

      {/* Fishing Type Badge */}
      {fishingType && (
        <Badge variant="secondary" className="w-fit mb-4 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
          🎣 {fishingType}
        </Badge>
      )}

      {/* Bio Preview */}
      {bio && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {bio}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="px-2 py-1 text-xs bg-background/50"
            >
              {tag.icon && <span className="mr-1">{tag.icon}</span>}
              {tag.label}
            </Badge>
          ))}
        </div>
      )}

      {/* More Info Button */}
      <button
        onClick={onMoreClick}
        className="mt-auto p-2 w-fit rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        aria-label="View more details"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
  );
}

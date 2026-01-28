import { useNavigate } from 'react-router-dom';
import { User, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProfileCompletionGuide } from '@/hooks/use-profile-completion-guide';

interface ProfileCompletionBannerProps {
  profile: {
    bio?: string | null;
    occupation?: string | null;
    height_cm?: number | null;
    smoking?: string | null;
    drinking?: string | null;
    zodiac_sign?: string | null;
    photos?: string[] | null;
    city?: string | null;
    state?: string | null;
  } | null | undefined;
  isLoading?: boolean;
}

export function ProfileCompletionBanner({ profile, isLoading }: ProfileCompletionBannerProps) {
  const navigate = useNavigate();
  const {
    completionPercent,
    isProfileComplete,
    showBanner,
    dismissBanner,
    markGuideShown,
  } = useProfileCompletionGuide(profile);

  // Don't show while loading or if profile is complete or banner is dismissed
  if (isLoading || isProfileComplete || !showBanner) return null;

  const handleCompleteProfile = () => {
    markGuideShown();
    navigate('/app/profile/edit?guide=true');
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
        {/* Left side - Progress info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex h-9 w-9 rounded-full bg-primary/20 items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Progress value={completionPercent} className="w-20 h-2" />
              <span className="text-sm font-medium whitespace-nowrap">
                {completionPercent}% complete
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Complete your profile to get more matches
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            size="sm" 
            onClick={handleCompleteProfile}
            className="gap-1"
          >
            Complete Now
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={dismissBanner}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

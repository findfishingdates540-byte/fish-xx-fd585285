import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  } | null;
  className?: string;
}

export function ProfileCompletionBanner({ profile, className }: ProfileCompletionBannerProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [storageKey] = useState('profile-banner-dismissed');

  // Check if banner was previously dismissed (within last 24 hours)
  useEffect(() => {
    const dismissedAt = localStorage.getItem(storageKey);
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = new Date().getTime();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
      
      // Re-show after 24 hours
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
      }
    }
  }, [storageKey]);

  if (!profile || dismissed) return null;

  // Calculate missing fields
  const missingFields: string[] = [];
  if (!profile.bio?.trim()) missingFields.push('Bio');
  if (!profile.occupation?.trim()) missingFields.push('Occupation');
  if (!profile.height_cm) missingFields.push('Height');
  if (!profile.smoking) missingFields.push('Smoking preference');
  if (!profile.drinking) missingFields.push('Drinking preference');
  if (!profile.zodiac_sign) missingFields.push('Zodiac sign');
  if (!profile.photos || profile.photos.length === 0) missingFields.push('Photo');
  if (!profile.city?.trim() && !profile.state?.trim()) missingFields.push('Location');

  // If profile is complete, don't show banner
  if (missingFields.length === 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(storageKey, new Date().toISOString());
    setDismissed(true);
  };

  const completionPercent = Math.round(((8 - missingFields.length) / 8) * 100);

  return (
    <div className={cn(
      "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 relative",
      className
    )}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-semibold text-foreground">Complete your profile</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your profile is {completionPercent}% complete. Add your {missingFields.slice(0, 3).join(', ').toLowerCase()}
            {missingFields.length > 3 && ` and ${missingFields.length - 3} more`} to get more matches!
          </p>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          <Button
            onClick={() => navigate('/app/profile/edit')}
            size="sm"
            className="mt-3"
          >
            <User className="h-4 w-4 mr-1.5" />
            Complete Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

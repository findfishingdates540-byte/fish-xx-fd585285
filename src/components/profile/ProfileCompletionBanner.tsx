import { useNavigate } from 'react-router-dom';
import { User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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

  // Don't show while loading to prevent false positives
  if (isLoading) return null;
  if (!profile) return null;

  // Calculate missing fields with strict checks
  const missingFields: string[] = [];
  
  // Only check if the field is truly missing (null, undefined, or empty)
  const bio = profile.bio?.trim();
  const occupation = profile.occupation?.trim();
  const city = profile.city?.trim();
  const state = profile.state?.trim();
  
  if (!bio || bio.length === 0) missingFields.push('Bio');
  if (!occupation || occupation.length === 0) missingFields.push('Occupation');
  if (profile.height_cm === null || profile.height_cm === undefined) missingFields.push('Height');
  if (!profile.smoking) missingFields.push('Smoking preference');
  if (!profile.drinking) missingFields.push('Drinking preference');
  if (!profile.zodiac_sign) missingFields.push('Zodiac sign');
  if (!profile.photos || profile.photos.length === 0) missingFields.push('Photo');
  if (!city && !state) missingFields.push('Location');

  // If profile is complete, don't show modal
  if (missingFields.length === 0) return null;

  const completionPercent = Math.round(((8 - missingFields.length) / 8) * 100);

  return (
    <Dialog open={true}>
      <DialogContent 
        className="w-[calc(100%-2rem)] max-w-md [&>button.absolute.right-4.top-4]:hidden p-6 min-h-[420px] rounded-2xl" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center pb-0">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <AlertCircle className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-lg">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-sm">
            Your profile is {completionPercent}% complete. Add your missing info to start discovering matches!
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Missing fields list */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Missing information:</p>
          <div className="flex flex-wrap gap-1.5">
            {missingFields.map((field) => (
              <span 
                key={field}
                className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium text-muted-foreground"
              >
                {field}
              </span>
            ))}
          </div>
        </div>

        <Button
          onClick={() => navigate('/app/profile/edit')}
          size="lg"
          className="w-full"
        >
          <User className="h-4 w-4 mr-2" />
          Complete Profile Now
        </Button>
      </DialogContent>
    </Dialog>
  );
}

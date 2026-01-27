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
  } | null;
}

export function ProfileCompletionBanner({ profile }: ProfileCompletionBannerProps) {
  const navigate = useNavigate();

  if (!profile) return null;

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

  // If profile is complete, don't show modal
  if (missingFields.length === 0) return null;

  const completionPercent = Math.round(((8 - missingFields.length) / 8) * 100);

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden max-h-[90vh] flex flex-col" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex-1 overflow-y-auto">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <AlertCircle className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-lg">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-sm">
              Your profile is {completionPercent}% complete. Add your missing info to start discovering matches!
            </DialogDescription>
          </DialogHeader>

          {/* Progress bar */}
          <div className="mt-3 h-2.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Missing fields list */}
          <div className="mt-3 space-y-1.5">
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
        </div>

        <Button
          onClick={() => navigate('/app/profile/edit')}
          size="lg"
          className="w-full mt-4 flex-shrink-0"
        >
          <User className="h-4 w-4 mr-2" />
          Complete Profile Now
        </Button>
      </DialogContent>
    </Dialog>
  );
}

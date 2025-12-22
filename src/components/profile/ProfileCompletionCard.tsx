import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileField {
  key: string;
  label: string;
  isComplete: boolean;
  weight: number;
}

interface ProfileCompletionCardProps {
  profile: {
    display_name?: string | null;
    bio?: string | null;
    photos?: string[] | null;
    location_name?: string | null;
    date_of_birth?: string | null;
    height_cm?: number | null;
    education?: string | null;
    occupation?: string | null;
    drinking?: string | null;
    smoking?: string | null;
    interests?: string[] | null;
    prompt_responses?: any[] | null;
  };
  className?: string;
}

export function ProfileCompletionCard({ profile, className }: ProfileCompletionCardProps) {
  const fields: ProfileField[] = [
    { key: 'photos', label: 'Add profile photos', isComplete: (profile.photos?.length || 0) >= 1, weight: 20 },
    { key: 'bio', label: 'Write a bio', isComplete: !!profile.bio && profile.bio.length > 10, weight: 15 },
    { key: 'basics', label: 'Add basic info', isComplete: !!profile.display_name && !!profile.date_of_birth, weight: 15 },
    { key: 'location', label: 'Add your location', isComplete: !!profile.location_name, weight: 10 },
    { key: 'lifestyle', label: 'Share your lifestyle', isComplete: !!profile.drinking || !!profile.smoking, weight: 10 },
    { key: 'work', label: 'Add work & education', isComplete: !!profile.education || !!profile.occupation, weight: 10 },
    { key: 'height', label: 'Add your height', isComplete: !!profile.height_cm, weight: 5 },
    { key: 'interests', label: 'Select your interests', isComplete: (profile.interests?.length || 0) >= 3, weight: 10 },
    { key: 'prompts', label: 'Answer profile prompts', isComplete: (profile.prompt_responses?.filter((p: any) => p.answer)?.length || 0) >= 1, weight: 5 },
  ];

  const completedWeight = fields.reduce((sum, field) => sum + (field.isComplete ? field.weight : 0), 0);
  const percentage = Math.round(completedWeight);
  const incompleteFields = fields.filter(f => !f.isComplete);

  if (percentage === 100) {
    return (
      <Card className={cn("bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-900/30", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">Profile Complete!</p>
              <p className="text-sm text-muted-foreground">Your profile is looking great</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">Complete Your Profile</p>
            <p className="text-xs text-muted-foreground">
              {percentage}% complete • {incompleteFields.length} items left
            </p>
          </div>
          <div className="text-2xl font-bold text-primary">{percentage}%</div>
        </div>
        
        <Progress value={percentage} className="h-2 mb-4" />
        
        <div className="space-y-2 mb-4">
          {fields.slice(0, 5).map((field) => (
            <div key={field.key} className="flex items-center gap-2 text-sm">
              {field.isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              )}
              <span className={cn(
                field.isComplete ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {field.label}
              </span>
            </div>
          ))}
          {incompleteFields.length > 5 && (
            <p className="text-xs text-muted-foreground pl-6">
              +{incompleteFields.length - 5} more items
            </p>
          )}
        </div>

        <Button asChild size="sm" className="w-full">
          <Link to="/app/profile/edit">Complete Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

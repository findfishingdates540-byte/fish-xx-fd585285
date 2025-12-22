import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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

function CircularProgress({ percentage, size = 100, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getGradientColor = () => {
    if (percentage === 100) return 'url(#complete-gradient)';
    if (percentage >= 70) return 'url(#good-gradient)';
    if (percentage >= 40) return 'url(#progress-gradient)';
    return 'url(#start-gradient)';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="complete-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--chart-2))" />
            <stop offset="100%" stopColor="hsl(142 76% 36%)" />
          </linearGradient>
          <linearGradient id="good-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" />
          </linearGradient>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--chart-4))" />
            <stop offset="100%" stopColor="hsl(var(--chart-3))" />
          </linearGradient>
          <linearGradient id="start-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getGradientColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-2xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {animatedPercentage}%
        </motion.span>
      </div>
    </div>
  );
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
  const completedCount = fields.filter(f => f.isComplete).length;

  if (percentage === 100) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn("bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-900/30 overflow-hidden", className)}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <CircularProgress percentage={100} size={80} strokeWidth={6} />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Sparkles className="h-6 w-6 text-green-500" />
                </motion.div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-700 dark:text-green-400">Profile Complete!</p>
                <p className="text-sm text-muted-foreground">Your profile is looking great</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <CircularProgress percentage={percentage} size={80} strokeWidth={6} />
            <div className="flex-1 pt-1">
              <p className="font-semibold text-sm mb-1">Complete Your Profile</p>
              <p className="text-xs text-muted-foreground mb-2">
                {completedCount} of {fields.length} completed
              </p>
              <p className="text-xs text-muted-foreground">
                Complete profiles get <span className="text-primary font-medium">3x more matches</span>
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            {incompleteFields.slice(0, 3).map((field, index) => (
              <motion.div 
                key={field.key} 
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Circle className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                <span className="text-foreground text-xs">{field.label}</span>
              </motion.div>
            ))}
            {incompleteFields.length > 3 && (
              <p className="text-xs text-muted-foreground pl-5">
                +{incompleteFields.length - 3} more to complete
              </p>
            )}
          </div>

          <Button asChild size="sm" className="w-full group">
            <Link to="/app/profile/edit" className="flex items-center justify-center gap-2">
              Complete Profile
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

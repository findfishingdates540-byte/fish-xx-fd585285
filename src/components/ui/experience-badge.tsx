import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExperienceBadgeProps {
  level: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const experienceLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert'
};

const experienceColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
  intermediate: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  advanced: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  expert: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5'
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4'
};

export function ExperienceBadge({ 
  level, 
  size = 'md', 
  showIcon = true,
  className 
}: ExperienceBadgeProps) {
  if (!level) return null;

  const label = experienceLabels[level] || level;
  const colorClass = experienceColors[level] || 'bg-muted text-foreground';

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'border font-medium',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Award className={cn(iconSizes[size], 'mr-1')} />}
      {label}
    </Badge>
  );
}

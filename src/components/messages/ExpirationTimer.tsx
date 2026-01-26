import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface ExpirationTimerProps {
  formattedTime: string;
  isExpiringSoon: boolean;
  isUrgent: boolean;
  className?: string;
}

export function ExpirationTimer({ 
  formattedTime, 
  isExpiringSoon, 
  isUrgent,
  className 
}: ExpirationTimerProps) {
  if (!formattedTime || formattedTime === 'Expired') return null;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium",
      isUrgent 
        ? "text-destructive" 
        : isExpiringSoon 
          ? "text-amber-500 dark:text-amber-400" 
          : "text-muted-foreground",
      className
    )}>
      <Clock className="h-2.5 w-2.5" />
      {formattedTime}
    </span>
  );
}

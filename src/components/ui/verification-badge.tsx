import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  idVerified?: boolean;
  liveVerified?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function VerificationBadge({
  idVerified = false,
  liveVerified = false,
  showTooltip = true,
  size = 'md',
  className,
}: VerificationBadgeProps) {
  if (!idVerified && !liveVerified) return null;

  const sizeClass = sizeMap[size];

  // Deep blue badge-check style (like FontAwesome's badge-check)
  const badges = (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {idVerified && !liveVerified && (
        <BadgeCheck 
          className={cn(sizeClass, 'text-white fill-slate-500')} 
          strokeWidth={2.5}
        />
      )}
      {liveVerified && (
        <BadgeCheck 
          className={cn(sizeClass, 'text-white fill-[#1877F2]')} 
          strokeWidth={2.5}
        />
      )}
    </span>
  );

  if (!showTooltip) return badges;

  const tooltipText = liveVerified
    ? 'Live Verified'
    : idVerified
    ? 'ID Verified'
    : '';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badges}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

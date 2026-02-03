import { Check } from 'lucide-react';
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
  sm: { container: 'h-3.5 w-3.5', icon: 'h-2.5 w-2.5' },
  md: { container: 'h-4 w-4', icon: 'h-3 w-3' },
  lg: { container: 'h-5 w-5', icon: 'h-3.5 w-3.5' },
};

export function VerificationBadge({
  idVerified = false,
  liveVerified = false,
  showTooltip = true,
  size = 'md',
  className,
}: VerificationBadgeProps) {
  if (!idVerified && !liveVerified) return null;

  const { container, icon } = sizeMap[size];

  // Twitter/X style badge: filled circle with white checkmark
  const badges = (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {idVerified && !liveVerified && (
        <span className={cn(container, 'inline-flex items-center justify-center rounded-full bg-slate-400')}>
          <Check className={cn(icon, 'text-white')} strokeWidth={3} />
        </span>
      )}
      {liveVerified && (
        <span className={cn(container, 'inline-flex items-center justify-center rounded-full bg-[#1D9BF0]')}>
          <Check className={cn(icon, 'text-white')} strokeWidth={3} />
        </span>
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

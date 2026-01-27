import { MoreHorizontal } from 'lucide-react';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { cn } from '@/lib/utils';

interface ProfileInfoPanelProps {
  name: string;
  age: number;
  occupation?: string;
  idVerified?: boolean;
  liveVerified?: boolean;
  onMoreClick?: () => void;
  className?: string;
}

export function ProfileInfoPanel({
  name,
  age,
  occupation,
  idVerified,
  liveVerified,
  onMoreClick,
  className,
}: ProfileInfoPanelProps) {
  const isVerified = idVerified || liveVerified;

  return (
    <div 
      className={cn(
        "flex flex-col justify-center px-8 py-6 bg-amber-50 dark:bg-amber-950/30 h-full",
        className
      )}
    >
      {/* Spacer to push content to vertical center */}
      <div className="flex-1" />

      {/* Name, Age, and Verification */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-3xl font-bold text-foreground">
            {name}, {age}
          </h2>
          <VerificationBadge idVerified={idVerified} liveVerified={liveVerified} size="md" />
          {isVerified && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium leading-tight">
              Photo<br />verified
            </span>
          )}
        </div>

        {/* Occupation */}
        {occupation && (
          <p className="text-sm text-muted-foreground">
            {occupation}
          </p>
        )}
      </div>

      {/* More Info Button */}
      <button
        onClick={onMoreClick}
        className="mt-4 p-2 w-fit rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        aria-label="View more details"
      >
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Spacer to push content to vertical center */}
      <div className="flex-1" />
    </div>
  );
}
